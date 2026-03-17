namespace RSSBWireless.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BreakagesController : ControllerBase
{
    private readonly AppDbContext _db;
    public BreakagesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? visitId)
    {
        var q = _db.Breakages.Include(b => b.Visit).AsQueryable();
        if (visitId.HasValue) q = q.Where(b => b.VisitId == visitId);
        var list = await q.OrderByDescending(b => b.ReportedAt).Select(b => new BreakageDto
        {
            Id = b.Id, VisitId = b.VisitId, VisitName = b.Visit!.Name,
            ItemNumber = b.ItemNumber, BreakageReason = b.BreakageReason,
            ReportedBy = b.ReportedBy, Remarks = b.Remarks, ReportedAt = b.ReportedAt
        }).ToListAsync();
        return Ok(list);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] BreakageCreateDto dto)
    {
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

    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var b = await _db.Breakages.FindAsync(id);
        if (b == null) return NotFound();
        _db.Breakages.Remove(b);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
