namespace RSSBWireless.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportSvc;
    private readonly AppDbContext _db;
    public ReportsController(ReportService reportSvc, AppDbContext db) { _reportSvc = reportSvc; _db = db; }

    [HttpGet("dashboard")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDashboard()
    {
        var stats = new DashboardStatsDto
        {
            TotalWirelessSets = await _db.WirelessSets.CountAsync(),
            AvailableSets = await _db.WirelessSets.CountAsync(w => w.Status == "Available"),
            IssuedSets = await _db.WirelessSets.CountAsync(w => w.Status == "Issued"),
            BrokenSets = await _db.WirelessSets.CountAsync(w => w.Status == "Broken"),
            TotalIncharges = await _db.Incharges.CountAsync(),
            ActiveVisits = await _db.Visits.CountAsync(v => v.IsActive),
            TodayIssues = await _db.Issues.CountAsync(i => i.IssuedAt.Date == DateTime.UtcNow.Date),
            TotalBreakages = await _db.Breakages.CountAsync()
        };
        return Ok(stats);
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
