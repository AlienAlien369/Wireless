namespace RSSBWireless.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Models;
using RSSBWireless.API.Services;
using System;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AccessScopeService _scope;
    public RolesController(AppDbContext db, AccessScopeService scope) { _db = db; _scope = scope; }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await _scope.RequireAdminUiAsync(User);
        var list = await _db.AppRoles
            .OrderBy(x => x.Name)
            .Select(x => new AppRoleDto(x.Id, x.Name, x.Audience, x.IsActive))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AppRoleCreateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        if (!scope.IsGlobalAdmin) return Forbid();
        var name = (dto.Name ?? "").Trim();
        var audience = (dto.Audience ?? "").Trim();
        if (string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "Role name is required" });
        if (audience != "Admin" && audience != "Incharge") return BadRequest(new { message = "Audience must be Admin or Incharge" });

        if (await _db.AppRoles.AnyAsync(x => x.Name == name))
            return BadRequest(new { message = "Role already exists" });

        var role = new AppRole { Name = name, Audience = audience };
        _db.AppRoles.Add(role);
        await _db.SaveChangesAsync();
        return Ok(new AppRoleDto(role.Id, role.Name, role.Audience, role.IsActive));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AppRoleUpdateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        if (!scope.IsGlobalAdmin) return Forbid();
        var role = await _db.AppRoles.FirstOrDefaultAsync(x => x.Id == id);
        if (role == null) return NotFound();

        var name = (dto.Name ?? "").Trim();
        var audience = (dto.Audience ?? "").Trim();
        if (string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "Role name is required" });
        if (audience != "Admin" && audience != "Incharge") return BadRequest(new { message = "Audience must be Admin or Incharge" });
        if (await _db.AppRoles.AnyAsync(x => x.Id != id && x.Name == name))
            return BadRequest(new { message = "Role already exists" });

        role.Name = name;
        role.Audience = audience;
        role.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new AppRoleDto(role.Id, role.Name, role.Audience, role.IsActive));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        if (!scope.IsGlobalAdmin) return Forbid();
        var role = await _db.AppRoles.FirstOrDefaultAsync(x => x.Id == id);
        if (role == null) return NotFound();
        if (string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Admin role cannot be deleted" });

        var hasUsage = await _db.Users.AnyAsync(x => x.Role == role.Name)
            || await _db.MenuPagePermissions.AnyAsync(x => x.Role == role.Name);
        if (hasUsage) return BadRequest(new { message = "Role is in use and cannot be deleted" });

        _db.AppRoles.Remove(role);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

