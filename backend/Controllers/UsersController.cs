namespace RSSBWireless.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AccessScopeService _scope;

    public UsersController(AppDbContext db, UserManager<ApplicationUser> userManager, AccessScopeService scope)
    {
        _db = db;
        _userManager = userManager;
        _scope = scope;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? centerId, [FromQuery] int? departmentId, [FromQuery] string? role)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var q = _userManager.Users
            .Include(x => x.Center)
            .Include(x => x.Department)
            .AsQueryable();

        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null) return Forbid();
            q = q.Where(x => x.CenterId == scope.CenterId);
            if (!scope.IsCenterHead && scope.DepartmentId != null) q = q.Where(x => x.DepartmentId == scope.DepartmentId);
        }

        if (centerId != null) q = q.Where(x => x.CenterId == centerId);
        if (departmentId != null) q = q.Where(x => x.DepartmentId == departmentId);
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(x => x.Role == role);

        var list = await q.OrderBy(x => x.UserName)
            .Select(x => new AdminUserDto(
                x.Id,
                x.UserName ?? "",
                x.FullName,
                x.Role,
                x.CenterId,
                x.Center != null ? x.Center.Name : null,
                x.DepartmentId,
                x.Department != null ? x.Department.Name : null,
                x.BadgeNumber,
                x.Email,
                x.PhoneNumber,
                x.IsActive,
                x.CreatedAt
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminUserCreateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var username = (dto.Username ?? "").Trim();
        if (string.IsNullOrWhiteSpace(username)) return BadRequest(new { message = "Username is required" });
        if (string.IsNullOrWhiteSpace(dto.Password)) return BadRequest(new { message = "Password is required" });

        var role = (dto.Role ?? "").Trim();
        var roleExists = await _db.AppRoles.AnyAsync(x => x.Name == role && x.IsActive);
        if (!roleExists) return BadRequest(new { message = "Invalid role" });
        if (string.Equals(role, "SUPER_ADMIN", StringComparison.OrdinalIgnoreCase) && !scope.IsSuperAdmin)
            return Forbid();

        if (dto.CenterId != null && !await _db.Centers.AnyAsync(x => x.Id == dto.CenterId))
            return BadRequest(new { message = "Invalid centerId" });
        if (dto.DepartmentId != null && !await _db.Departments.AnyAsync(x => x.Id == dto.DepartmentId))
            return BadRequest(new { message = "Invalid departmentId" });
        if (dto.CenterId != null) _scope.EnsureCenterAccess(scope, dto.CenterId.Value);
        _scope.EnsureDepartmentAccess(scope, dto.DepartmentId);

        var email = string.IsNullOrWhiteSpace(dto.Email) ? $"{username}@rssb.local" : dto.Email.Trim();

        var user = new ApplicationUser
        {
            UserName = username,
            Email = email,
            PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim(),
            FullName = dto.FullName?.Trim() ?? "",
            Role = role,
            BadgeNumber = string.IsNullOrWhiteSpace(dto.BadgeNumber) ? null : dto.BadgeNumber.Trim(),
            CenterId = dto.CenterId,
            DepartmentId = dto.DepartmentId,
            IsActive = dto.IsActive
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        var created = await _userManager.Users
            .Include(x => x.Center)
            .Include(x => x.Department)
            .FirstAsync(x => x.Id == user.Id);

        return Ok(new AdminUserDto(
            created.Id,
            created.UserName ?? "",
            created.FullName,
            created.Role,
            created.CenterId,
            created.Center?.Name,
            created.DepartmentId,
            created.Department?.Name,
            created.BadgeNumber,
            created.Email,
            created.PhoneNumber,
            created.IsActive,
            created.CreatedAt
        ));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] AdminUserUpdateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var user = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user == null) return NotFound();

        var role = (dto.Role ?? "").Trim();
        var roleExists = await _db.AppRoles.AnyAsync(x => x.Name == role && x.IsActive);
        if (!roleExists) return BadRequest(new { message = "Invalid role" });
        if (string.Equals(role, "SUPER_ADMIN", StringComparison.OrdinalIgnoreCase) && !scope.IsSuperAdmin)
            return Forbid();

        if (dto.CenterId != null && !await _db.Centers.AnyAsync(x => x.Id == dto.CenterId))
            return BadRequest(new { message = "Invalid centerId" });
        if (dto.DepartmentId != null && !await _db.Departments.AnyAsync(x => x.Id == dto.DepartmentId))
            return BadRequest(new { message = "Invalid departmentId" });
        if (dto.CenterId != null) _scope.EnsureCenterAccess(scope, dto.CenterId.Value);
        _scope.EnsureDepartmentAccess(scope, dto.DepartmentId);

        user.FullName = dto.FullName?.Trim() ?? "";
        user.Role = role;
        user.BadgeNumber = string.IsNullOrWhiteSpace(dto.BadgeNumber) ? null : dto.BadgeNumber.Trim();
        user.CenterId = dto.CenterId;
        user.DepartmentId = dto.DepartmentId;
        user.IsActive = dto.IsActive;
        user.Email = string.IsNullOrWhiteSpace(dto.Email) ? user.Email : dto.Email.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? user.PhoneNumber : dto.PhoneNumber.Trim();

        await _userManager.UpdateAsync(user);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        if (user.CenterId != null) _scope.EnsureCenterAccess(scope, user.CenterId.Value);
        _scope.EnsureDepartmentAccess(scope, user.DepartmentId);

        if (string.Equals(user.UserName, "admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Default admin user cannot be deleted" });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPost("{id}/set-password")]
    public async Task<IActionResult> SetPassword(string id, [FromBody] AdminSetPasswordDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        if (string.IsNullOrWhiteSpace(dto.NewPassword)) return BadRequest(new { message = "NewPassword is required" });
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        if (user.CenterId != null) _scope.EnsureCenterAccess(scope, user.CenterId.Value);
        _scope.EnsureDepartmentAccess(scope, user.DepartmentId);

        // Force-reset regardless of existing password.
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, resetToken, dto.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }
}

