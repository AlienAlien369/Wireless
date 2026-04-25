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
public class InchargesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AccessScopeService _scope;
    public InchargesController(AppDbContext db, AccessScopeService scope) { _db = db; _scope = scope; }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var q = _db.Incharges.AsQueryable();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null) return Forbid();
            q = q.Where(i => i.CenterId == scope.CenterId || i.CenterId == null);
            if (!scope.IsCenterHead && scope.DepartmentId != null) q = q.Where(i => i.DepartmentId == scope.DepartmentId || i.DepartmentId == null);
        }

        var list = await q.OrderBy(i => i.Name)
            .Select(i => new InchargeDto(i.Id, i.Name, i.BadgeNumber, i.MobileNumber, i.GroupName, i.IsActive))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var i = await _db.Incharges.FindAsync(id);
        if (i == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || i.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && scope.DepartmentId != null && i.DepartmentId != scope.DepartmentId) return Forbid();
        }
        return Ok(new InchargeDto(i.Id, i.Name, i.BadgeNumber, i.MobileNumber, i.GroupName, i.IsActive));
    }

    [HttpGet("badge/{badge}")]
    public async Task<IActionResult> GetByBadge(string badge)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var i = await _db.Incharges.FirstOrDefaultAsync(x => x.BadgeNumber == badge);
        if (i == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || i.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && scope.DepartmentId != null && i.DepartmentId != scope.DepartmentId) return Forbid();
        }
        return Ok(new InchargeDto(i.Id, i.Name, i.BadgeNumber, i.MobileNumber, i.GroupName, i.IsActive));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InchargeCreateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        if (await _db.Incharges.AnyAsync(x => x.BadgeNumber == dto.BadgeNumber))
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
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = incharge.Id },
            new InchargeDto(incharge.Id, incharge.Name, incharge.BadgeNumber, incharge.MobileNumber, incharge.GroupName, incharge.IsActive));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] InchargeUpdateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var i = await _db.Incharges.FindAsync(id);
        if (i == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || i.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && scope.DepartmentId != null && i.DepartmentId != scope.DepartmentId) return Forbid();
        }
        i.Name = dto.Name; i.BadgeNumber = dto.BadgeNumber;
        i.MobileNumber = dto.MobileNumber; i.GroupName = dto.GroupName; i.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var i = await _db.Incharges.FindAsync(id);
        if (i == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || i.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && scope.DepartmentId != null && i.DepartmentId != scope.DepartmentId) return Forbid();
        }
        _db.Incharges.Remove(i);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
