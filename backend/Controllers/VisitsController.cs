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
public class VisitsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AccessScopeService _scope;
    public VisitsController(AppDbContext db, AccessScopeService scope) { _db = db; _scope = scope; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? centerId, [FromQuery] int? departmentId)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var q = _db.Visits.AsQueryable();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null) return Forbid();
            q = q.Where(v => v.CenterId == scope.CenterId || v.CenterId == null);
        }
        if (centerId != null) q = q.Where(v => v.CenterId == centerId);
        if (departmentId != null) q = q.Where(v => v.DepartmentId == departmentId);

        var visits = await q.OrderByDescending(v => v.VisitDate)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new VisitDto(v.Id, v.Name, v.Location, v.VisitDate, v.Remarks, v.IsActive, v.CreatedAt))
            .ToListAsync();
        return Ok(visits);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var v = await _db.Visits.FindAsync(id);
        if (v == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || v.CenterId != scope.CenterId) return Forbid();
        }
        return Ok(new VisitDto(v.Id, v.Name, v.Location, v.VisitDate, v.Remarks, v.IsActive, v.CreatedAt));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] VisitCreateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var visit = new Visit { Name = dto.Name, Location = dto.Location, VisitDate = dto.VisitDate, Remarks = dto.Remarks };
        visit.VisitDate = DateTime.SpecifyKind(dto.VisitDate, DateTimeKind.Utc);
        if (!scope.IsGlobalAdmin)
        {
            visit.CenterId = scope.CenterId;
            visit.DepartmentId = scope.DepartmentId;
        }
        _db.Visits.Add(visit);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = visit.Id },
            new VisitDto(visit.Id, visit.Name, visit.Location, visit.VisitDate, visit.Remarks, visit.IsActive, visit.CreatedAt));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] VisitUpdateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var visit = await _db.Visits.FindAsync(id);
        if (visit == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || visit.CenterId != scope.CenterId) return Forbid();
        }
        visit.Name = dto.Name; visit.Location = dto.Location;
        visit.VisitDate = dto.VisitDate; visit.Remarks = dto.Remarks; visit.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var visit = await _db.Visits.FindAsync(id);
        if (visit == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || visit.CenterId != scope.CenterId) return Forbid();
        }
        _db.Visits.Remove(visit);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
