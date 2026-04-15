namespace RSSBWireless.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class RolesController : ControllerBase
{
    private readonly AppDbContext _db;
    public RolesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.AppRoles
            .OrderBy(x => x.Name)
            .Select(x => new AppRoleDto(x.Id, x.Name, x.Audience, x.IsActive))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AppRoleCreateDto dto)
    {
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
}

