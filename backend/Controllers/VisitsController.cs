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
public class VisitsController : ControllerBase
{
    private readonly AppDbContext _db;
    public VisitsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var visits = await _db.Visits.OrderByDescending(v => v.VisitDate)
            .Select(v => new VisitDto(v.Id, v.Name, v.Location, v.VisitDate, v.Remarks, v.IsActive, v.CreatedAt))
            .ToListAsync();
        return Ok(visits);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var v = await _db.Visits.FindAsync(id);
        if (v == null) return NotFound();
        return Ok(new VisitDto(v.Id, v.Name, v.Location, v.VisitDate, v.Remarks, v.IsActive, v.CreatedAt));
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] VisitCreateDto dto)
    {
        var visit = new Visit { Name = dto.Name, Location = dto.Location, VisitDate = dto.VisitDate, Remarks = dto.Remarks };
        visit.VisitDate = DateTime.SpecifyKind(dto.VisitDate, DateTimeKind.Utc);
        _db.Visits.Add(visit);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = visit.Id },
            new VisitDto(visit.Id, visit.Name, visit.Location, visit.VisitDate, visit.Remarks, visit.IsActive, visit.CreatedAt));
    }

    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] VisitUpdateDto dto)
    {
        var visit = await _db.Visits.FindAsync(id);
        if (visit == null) return NotFound();
        visit.Name = dto.Name; visit.Location = dto.Location;
        visit.VisitDate = dto.VisitDate; visit.Remarks = dto.Remarks; visit.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var visit = await _db.Visits.FindAsync(id);
        if (visit == null) return NotFound();
        _db.Visits.Remove(visit);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
