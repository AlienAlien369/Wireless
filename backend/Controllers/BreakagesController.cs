namespace RSSBWireless.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Models;
using RSSBWireless.API.Services;
using RSSBWireless.API.Services.Interfaces;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BreakagesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAccessScopeService _scope;
    public BreakagesController(AppDbContext db, IAccessScopeService scope) { _db = db; _scope = scope; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? visitId, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var q = _db.Breakages.AsNoTracking().Include(b => b.Visit).AsQueryable();
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
        }).ToListAsync(cancellationToken);
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BreakageCreateDto dto, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var visit = await _db.Visits.FirstOrDefaultAsync(v => v.Id == dto.VisitId, cancellationToken);
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
            var ws = await _db.WirelessSets.FindAsync(new object?[] { dto.WirelessSetId }, cancellationToken);
            if (ws != null) ws.Status = AssetStatus.Broken;
        }

        _db.Breakages.Add(breakage);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(breakage);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var b = await _db.Breakages.FindAsync(new object?[] { id }, cancellationToken);
        if (b == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            var visit = await _db.Visits.FirstOrDefaultAsync(v => v.Id == b.VisitId, cancellationToken);
            if (visit == null) return NotFound();
            if (scope.CenterId == null || visit.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && visit.DepartmentId != scope.DepartmentId) return Forbid();
        }
        _db.Breakages.Remove(b);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
