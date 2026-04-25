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
public class TenantsController : ControllerBase
{
    private readonly AppDbContext _db;
    public TenantsController(AppDbContext db) => _db = db;

    [HttpGet("centers")]
    public async Task<IActionResult> GetCenters()
    {
        var list = await _db.Centers
            .OrderBy(x => x.Name)
            .Select(x => new CenterDto(x.Id, x.Name, x.IsActive))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("centers")]
    public async Task<IActionResult> CreateCenter([FromBody] CenterCreateDto dto)
    {
        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Center name is required" });

        if (await _db.Centers.AnyAsync(x => x.Name == name))
            return BadRequest(new { message = "Center already exists" });

        var center = new Center { Name = name };
        _db.Centers.Add(center);
        await _db.SaveChangesAsync();
        return Ok(new CenterDto(center.Id, center.Name, center.IsActive));
    }

    [HttpPut("centers/{id:int}")]
    public async Task<IActionResult> UpdateCenter(int id, [FromBody] CenterUpdateDto dto)
    {
        var center = await _db.Centers.FirstOrDefaultAsync(x => x.Id == id);
        if (center == null) return NotFound();

        var name = (dto.Name ?? "").Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Center name is required" });

        if (await _db.Centers.AnyAsync(x => x.Id != id && x.Name == name))
            return BadRequest(new { message = "Center already exists" });

        center.Name = name;
        center.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new CenterDto(center.Id, center.Name, center.IsActive));
    }

    [HttpDelete("centers/{id:int}")]
    public async Task<IActionResult> DeleteCenter(int id)
    {
        var center = await _db.Centers.FirstOrDefaultAsync(x => x.Id == id);
        if (center == null) return NotFound();

        var hasUsage = await _db.Users.AnyAsync(x => x.CenterId == id)
            || await _db.Departments.AnyAsync(x => x.CenterId == id)
            || await _db.MenuPagePermissions.AnyAsync(x => x.CenterId == id)
            || await _db.AssetTypes.AnyAsync(x => x.CenterId == id)
            || await _db.Assets.AnyAsync(x => x.CenterId == id);
        if (hasUsage) return BadRequest(new { message = "Center is in use and cannot be deleted" });

        _db.Centers.Remove(center);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments([FromQuery] int? centerId)
    {
        var q = _db.Departments.AsQueryable();
        if (centerId != null) q = q.Where(x => x.CenterId == centerId);

        var list = await q.OrderBy(x => x.Name)
            .Select(x => new DepartmentDto(x.Id, x.CenterId, x.Name, x.IsActive))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("departments")]
    public async Task<IActionResult> CreateDepartment([FromBody] DepartmentCreateDto dto)
    {
        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Department name is required" });

        if (!await _db.Centers.AnyAsync(x => x.Id == dto.CenterId))
            return BadRequest(new { message = "Invalid centerId" });

        if (await _db.Departments.AnyAsync(x => x.CenterId == dto.CenterId && x.Name == name))
            return BadRequest(new { message = "Department already exists for this center" });

        var dept = new Department { CenterId = dto.CenterId, Name = name };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();
        return Ok(new DepartmentDto(dept.Id, dept.CenterId, dept.Name, dept.IsActive));
    }

    [HttpPut("departments/{id:int}")]
    public async Task<IActionResult> UpdateDepartment(int id, [FromBody] DepartmentUpdateDto dto)
    {
        var dept = await _db.Departments.FirstOrDefaultAsync(x => x.Id == id);
        if (dept == null) return NotFound();

        var name = (dto.Name ?? "").Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Department name is required" });

        if (await _db.Departments.AnyAsync(x => x.Id != id && x.CenterId == dept.CenterId && x.Name == name))
            return BadRequest(new { message = "Department already exists for this center" });

        dept.Name = name;
        dept.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new DepartmentDto(dept.Id, dept.CenterId, dept.Name, dept.IsActive));
    }

    [HttpDelete("departments/{id:int}")]
    public async Task<IActionResult> DeleteDepartment(int id)
    {
        var dept = await _db.Departments.FirstOrDefaultAsync(x => x.Id == id);
        if (dept == null) return NotFound();

        var hasUsage = await _db.Users.AnyAsync(x => x.DepartmentId == id)
            || await _db.MenuPagePermissions.AnyAsync(x => x.DepartmentId == id);
        if (hasUsage) return BadRequest(new { message = "Department is in use and cannot be deleted" });

        _db.Departments.Remove(dept);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

