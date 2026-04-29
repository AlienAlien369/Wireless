namespace RSSBWireless.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Services;
using RSSBWireless.API.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportSvc;
    private readonly AppDbContext _db;
    private readonly AccessScopeService _scope;
    private readonly ProductConfigService _config;
    public ReportsController(ReportService reportSvc, AppDbContext db, AccessScopeService scope, ProductConfigService config) { _reportSvc = reportSvc; _db = db; _scope = scope; _config = config; }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] int? centerId, [FromQuery] int? departmentId)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        if (!scope.IsGlobalAdmin && scope.CenterId == null) return Forbid();
        var effectiveCenterId = scope.IsGlobalAdmin ? centerId : scope.CenterId;
        var effectiveDepartmentId = scope.IsGlobalAdmin ? departmentId : (scope.IsCenterHead ? departmentId : scope.DepartmentId);
        if (!scope.IsGlobalAdmin && departmentId != null && !scope.IsCenterHead) _scope.EnsureDepartmentAccess(scope, departmentId);
        var allowedAssetTypeIds = GetAllowedAssetTypeIds(scope, effectiveCenterId, effectiveDepartmentId);
        var assetsQuery = _db.Assets.AsQueryable();
        if (effectiveCenterId != null) assetsQuery = assetsQuery.Where(a => a.CenterId == effectiveCenterId);
        if (allowedAssetTypeIds != null) assetsQuery = assetsQuery.Where(a => allowedAssetTypeIds.Contains(a.AssetTypeId));

        var stats = new DashboardStatsDto
        {
            TotalWirelessSets = await assetsQuery.CountAsync(),
            AvailableSets = await assetsQuery.CountAsync(a => a.Status == "Available"),
            IssuedSets = await assetsQuery.CountAsync(a => a.Status == "Issued"),
            BrokenSets = await assetsQuery.CountAsync(a => a.Status == "Broken"),
            TotalIncharges = await _db.Incharges.CountAsync(i =>
                (effectiveCenterId == null || i.CenterId == effectiveCenterId) &&
                (effectiveDepartmentId == null || i.DepartmentId == effectiveDepartmentId)),
            ActiveVisits = await _db.Visits.CountAsync(v =>
                v.IsActive &&
                (effectiveCenterId == null || v.CenterId == effectiveCenterId) &&
                (effectiveDepartmentId == null || v.DepartmentId == effectiveDepartmentId)),
            TodayIssues = await _db.Issues.CountAsync(i =>
                i.IssuedAt.Date == DateTime.UtcNow.Date &&
                (effectiveCenterId == null || i.CenterId == effectiveCenterId) &&
                (effectiveDepartmentId == null || i.DepartmentId == effectiveDepartmentId)),
            TotalBreakages = await _db.Breakages
                .Include(b => b.Visit)
                .CountAsync(b =>
                    b.Visit != null &&
                    (effectiveCenterId == null || b.Visit.CenterId == effectiveCenterId) &&
                    (effectiveDepartmentId == null || b.Visit.DepartmentId == effectiveDepartmentId))
        };
        return Ok(stats);
    }

    [HttpGet("visit-wise")]
    public async Task<IActionResult> GetVisitWiseDashboard([FromQuery] int? centerId, [FromQuery] int? departmentId)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        if (!scope.IsGlobalAdmin && scope.CenterId == null) return Forbid();
        var effectiveCenterId = scope.IsGlobalAdmin ? centerId : scope.CenterId;
        var effectiveDepartmentId = scope.IsGlobalAdmin ? departmentId : (scope.IsCenterHead ? departmentId : scope.DepartmentId);

        var result = await _reportSvc.GetVisitWiseDashboardAsync();
        var allowedVisitIds = await _db.Visits
            .Where(v =>
                (effectiveCenterId == null || v.CenterId == effectiveCenterId) &&
                (effectiveDepartmentId == null || v.DepartmentId == effectiveDepartmentId))
            .Select(v => v.Id)
            .ToListAsync();
        result = result.Where(x => allowedVisitIds.Contains(x.VisitId)).ToList();
        return Ok(result);
    }

    [HttpGet("visit/{visitId}/excel")]
    public async Task<IActionResult> VisitExcel(int visitId)
    {
        var data = await _reportSvc.GenerateVisitExcelReportAsync(visitId);
        return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"visit_{visitId}_report.xlsx");
    }

    [HttpGet("inventory/excel")]
    public async Task<IActionResult> InventoryExcel()
    {
        var data = await _reportSvc.GenerateInventoryExcelReportAsync();
        return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "inventory_report.xlsx");
    }

    [HttpGet("breakages/pdf")]
    public async Task<IActionResult> BreakagesPdf([FromQuery] int? visitId)
    {
        var data = await _reportSvc.GenerateBreakagePdfReportAsync(visitId);
        return File(data, "application/pdf", "breakage_report.pdf");
    }

    private List<int>? GetAllowedAssetTypeIds(AccessScope scope, int? centerId, int? departmentId)
    {
        if (centerId == null) return null;
        var rules = _config.GetSnapshot().AssetVisibilityRules ?? new List<AssetVisibilityRuleConfig>();
        if (scope.IsGlobalAdmin)
        {
            if (departmentId == null) return null;
            return rules.Where(x => x.CenterId == centerId && x.DepartmentId == departmentId).Select(x => x.AssetTypeId).Distinct().ToList();
        }
        if (scope.IsCenterHead)
        {
            if (departmentId == null) return null;
            return rules.Where(x => x.CenterId == centerId && x.DepartmentId == departmentId).Select(x => x.AssetTypeId).Distinct().ToList();
        }
        return rules
            .Where(x => x.CenterId == centerId && x.Role == scope.Role && (x.DepartmentId == null || x.DepartmentId == scope.DepartmentId))
            .Select(x => x.AssetTypeId)
            .Distinct()
            .ToList();
    }
}
