namespace RSSBWireless.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Models;
using RSSBWireless.API.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BreakagesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AccessScopeService _scope;
    public BreakagesController(AppDbContext db, AccessScopeService scope) { _db = db; _scope = scope; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? visitId)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var q = _db.Breakages.Include(b => b.Visit).AsQueryable();
        if (visitId.HasValue) q = q.Where(b => b.VisitId == visitId);
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null) return Forbid();
            q = q.Where(b => b.Visit.CenterId == scope.CenterId);
            if (!scope.IsCenterHead) q = q.Where(b => b.Visit.DepartmentId == scope.DepartmentId || b.Visit.DepartmentId == null);
        }
        var list = await q.OrderByDescending(b => b.ReportedAt).Select(b => new BreakageDto
        {
            Id = b.Id, VisitId = b.VisitId, VisitName = b.Visit!.Name,
            ItemNumber = b.ItemNumber, BreakageReason = b.BreakageReason,
            ReportedBy = b.ReportedBy, Remarks = b.Remarks, ReportedAt = b.ReportedAt
        }).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BreakageCreateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var visit = await _db.Visits.FirstOrDefaultAsync(v => v.Id == dto.VisitId);
        if (visit == null) return BadRequest(new { message = "Invalid visit" });
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || visit.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && visit.DepartmentId != scope.DepartmentId) return Forbid();
        }
        var breakage = new Breakage
        {
            VisitId = dto.VisitId, WirelessSetId = dto.WirelessSetId,
            ItemNumber = dto.ItemNumber, BreakageReason = dto.BreakageReason,
            ReportedBy = dto.ReportedBy, Remarks = dto.Remarks
        };

        if (dto.WirelessSetId.HasValue)
        {
            var ws = await _db.WirelessSets.FindAsync(dto.WirelessSetId);
            if (ws != null) ws.Status = "Broken";
        }

        _db.Breakages.Add(breakage);
        await _db.SaveChangesAsync();
        return Ok(breakage);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var b = await _db.Breakages.FindAsync(id);
        if (b == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            var visit = await _db.Visits.FirstOrDefaultAsync(v => v.Id == b.VisitId);
            if (visit == null) return NotFound();
            if (scope.CenterId == null || visit.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && visit.DepartmentId != scope.DepartmentId) return Forbid();
        }
        _db.Breakages.Remove(b);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
