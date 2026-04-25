namespace RSSBWireless.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportSvc;
    private readonly AppDbContext _db;
    private readonly AccessScopeService _scope;
    public ReportsController(ReportService reportSvc, AppDbContext db, AccessScopeService scope) { _reportSvc = reportSvc; _db = db; _scope = scope; }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        if (!scope.IsGlobalAdmin && scope.CenterId == null) return Forbid();

        var centerId = scope.IsGlobalAdmin ? (int?)null : scope.CenterId;
        var strictDept = !scope.IsGlobalAdmin && !scope.IsCenterHead;
        var departmentId = scope.DepartmentId;
        var stats = new DashboardStatsDto
        {
            TotalWirelessSets = await _db.Assets.CountAsync(a => centerId == null || a.CenterId == centerId),
            AvailableSets = await _db.Assets.CountAsync(a => (centerId == null || a.CenterId == centerId) && a.Status == "Available"),
            IssuedSets = await _db.Assets.CountAsync(a => (centerId == null || a.CenterId == centerId) && a.Status == "Issued"),
            BrokenSets = await _db.Assets.CountAsync(a => (centerId == null || a.CenterId == centerId) && a.Status == "Broken"),
            TotalIncharges = await _db.Incharges.CountAsync(i =>
                (centerId == null || i.CenterId == centerId) &&
                (!strictDept || departmentId == null || i.DepartmentId == departmentId)),
            ActiveVisits = await _db.Visits.CountAsync(v =>
                v.IsActive &&
                (centerId == null || v.CenterId == centerId) &&
                (!strictDept || departmentId == null || v.DepartmentId == departmentId)),
            TodayIssues = await _db.Issues.CountAsync(i =>
                i.IssuedAt.Date == DateTime.UtcNow.Date &&
                (centerId == null || i.CenterId == centerId) &&
                (!strictDept || departmentId == null || i.DepartmentId == departmentId)),
            TotalBreakages = await _db.Breakages
                .Include(b => b.Visit)
                .CountAsync(b =>
                    b.Visit != null &&
                    (centerId == null || b.Visit.CenterId == centerId) &&
                    (!strictDept || departmentId == null || b.Visit.DepartmentId == departmentId))
        };
        return Ok(stats);
    }

    [HttpGet("visit-wise")]
    public async Task<IActionResult> GetVisitWiseDashboard()
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        if (!scope.IsGlobalAdmin && scope.CenterId == null) return Forbid();
        var centerId = scope.IsGlobalAdmin ? (int?)null : scope.CenterId;
        var strictDept = !scope.IsGlobalAdmin && !scope.IsCenterHead;
        var departmentId = scope.DepartmentId;

        var result = await _reportSvc.GetVisitWiseDashboardAsync();
        var allowedVisitIds = await _db.Visits
            .Where(v =>
                (centerId == null || v.CenterId == centerId) &&
                (!strictDept || departmentId == null || v.DepartmentId == departmentId))
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
}
