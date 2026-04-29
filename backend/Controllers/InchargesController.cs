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
[Route("api/incharges")]
[Route("api/sewadaars")]
[Authorize]
public class InchargesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAccessScopeService _scope;
    public InchargesController(AppDbContext db, IAccessScopeService scope) { _db = db; _scope = scope; }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var q = _db.Incharges.AsNoTracking().AsQueryable();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null) return Forbid();
            q = q.Where(i => i.CenterId == scope.CenterId || i.CenterId == null);
            if (!scope.IsCenterHead) q = q.Where(i => i.DepartmentId == scope.DepartmentId || i.DepartmentId == null);
        }

        var list = await q.OrderBy(i => i.Name)
            .Select(i => new InchargeDto(i.Id, i.Name, i.BadgeNumber, i.MobileNumber, i.GroupName, i.IsActive))
            .ToListAsync(cancellationToken);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var i = await _db.Incharges.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (i == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || i.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && i.DepartmentId != scope.DepartmentId) return Forbid();
        }
        return Ok(new InchargeDto(i.Id, i.Name, i.BadgeNumber, i.MobileNumber, i.GroupName, i.IsActive));
    }

    [HttpGet("badge/{badge}")]
    public async Task<IActionResult> GetByBadge(string badge, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var i = await _db.Incharges.AsNoTracking().FirstOrDefaultAsync(x => x.BadgeNumber == badge, cancellationToken);
        if (i == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || i.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && i.DepartmentId != scope.DepartmentId) return Forbid();
        }
        return Ok(new InchargeDto(i.Id, i.Name, i.BadgeNumber, i.MobileNumber, i.GroupName, i.IsActive));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InchargeCreateDto dto, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        if (await _db.Incharges.AnyAsync(x => x.BadgeNumber == dto.BadgeNumber, cancellationToken))
            return BadRequest(new { message = "Badge number already exists" });

        var incharge = new Incharge
        {
            Name = dto.Name, BadgeNumber = dto.BadgeNumber,
            MobileNumber = dto.MobileNumber, GroupName = dto.GroupName
        };
        if (!scope.IsGlobalAdmin)
        {
            incharge.CenterId = scope.CenterId;
            incharge.DepartmentId = scope.IsCenterHead ? null : scope.DepartmentId;
        }
        _db.Incharges.Add(incharge);
        await _db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = incharge.Id },
            new InchargeDto(incharge.Id, incharge.Name, incharge.BadgeNumber, incharge.MobileNumber, incharge.GroupName, incharge.IsActive));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] InchargeUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var i = await _db.Incharges.FindAsync(new object?[] { id }, cancellationToken);
        if (i == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || i.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && i.DepartmentId != scope.DepartmentId) return Forbid();
        }
        i.Name = dto.Name; i.BadgeNumber = dto.BadgeNumber;
        i.MobileNumber = dto.MobileNumber; i.GroupName = dto.GroupName; i.IsActive = dto.IsActive;
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var i = await _db.Incharges.FindAsync(new object?[] { id }, cancellationToken);
        if (i == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || i.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && i.DepartmentId != scope.DepartmentId) return Forbid();
        }
        _db.Incharges.Remove(i);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
