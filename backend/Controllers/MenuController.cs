namespace RSSBWireless.API.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MenuController : ControllerBase
{
    private readonly AppDbContext _db;
    public MenuController(AppDbContext db) => _db = db;

    [HttpGet("my")]
    public async Task<IActionResult> GetMyMenu()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user == null) return Unauthorized();
        if (user.CenterId == null) return Ok(new List<MenuMyItemDto>());

        var role = await _db.AppRoles.FirstOrDefaultAsync(x => x.Name == user.Role && x.IsActive);
        var audience = role?.Audience ?? user.Role;

        var items = await _db.MenuPagePermissions
            .Where(p =>
                p.CenterId == user.CenterId &&
                p.Role == user.Role &&
                (p.DepartmentId == null || p.DepartmentId == user.DepartmentId))
            .Select(p => p.MenuPage)
            .Where(p => p.IsActive && p.Audience == audience)
            .GroupBy(p => p.Id)
            .Select(g => g.First())
            .OrderBy(p => p.SortOrder)
            .Select(p => new MenuMyItemDto(p.Code, p.Label, p.Path, p.Icon, p.SortOrder))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("pages")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPages()
    {
        var list = await _db.MenuPages
            .OrderBy(x => x.SortOrder)
            .Select(x => new MenuPageDto(x.Id, x.Code, x.Label, x.Path, x.Icon, x.Audience, x.SortOrder, x.IsActive))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("assignments")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAssignment([FromQuery] int centerId, [FromQuery] int? departmentId, [FromQuery] string role)
    {
        role = role?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(role)) return BadRequest(new { message = "role is required" });
        if (!await _db.AppRoles.AnyAsync(x => x.Name == role && x.IsActive)) return BadRequest(new { message = "Invalid role" });

        var centerExists = await _db.Centers.AnyAsync(x => x.Id == centerId);
        if (!centerExists) return BadRequest(new { message = "Invalid centerId" });

        if (departmentId != null)
        {
            var deptOk = await _db.Departments.AnyAsync(x => x.Id == departmentId && x.CenterId == centerId);
            if (!deptOk) return BadRequest(new { message = "Invalid departmentId for this center" });
        }

        var pageIds = await _db.MenuPagePermissions
            .Where(x => x.CenterId == centerId && x.DepartmentId == departmentId && x.Role == role)
            .Select(x => x.MenuPageId)
            .OrderBy(x => x)
            .ToListAsync();

        return Ok(pageIds);
    }

    [HttpPut("assignments")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpsertAssignment([FromBody] MenuAssignmentUpdateDto dto)
    {
        var role = dto.Role?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(role)) return BadRequest(new { message = "role is required" });
        if (!await _db.AppRoles.AnyAsync(x => x.Name == role && x.IsActive)) return BadRequest(new { message = "Invalid role" });

        var centerExists = await _db.Centers.AnyAsync(x => x.Id == dto.CenterId);
        if (!centerExists) return BadRequest(new { message = "Invalid centerId" });

        if (dto.DepartmentId != null)
        {
            var deptOk = await _db.Departments.AnyAsync(x => x.Id == dto.DepartmentId && x.CenterId == dto.CenterId);
            if (!deptOk) return BadRequest(new { message = "Invalid departmentId for this center" });
        }

        var distinctIds = (dto.MenuPageIds ?? new List<int>()).Distinct().ToList();
        if (distinctIds.Count > 0)
        {
            var validCount = await _db.MenuPages.CountAsync(x => distinctIds.Contains(x.Id));
            if (validCount != distinctIds.Count) return BadRequest(new { message = "Invalid menuPageIds" });
        }

        var existing = await _db.MenuPagePermissions
            .Where(x => x.CenterId == dto.CenterId && x.DepartmentId == dto.DepartmentId && x.Role == role)
            .ToListAsync();

        _db.MenuPagePermissions.RemoveRange(existing);

        foreach (var pageId in distinctIds)
        {
            _db.MenuPagePermissions.Add(new MenuPagePermission
            {
                CenterId = dto.CenterId,
                DepartmentId = dto.DepartmentId,
                Role = role,
                MenuPageId = pageId
            });
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
