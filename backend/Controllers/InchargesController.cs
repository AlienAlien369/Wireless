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
public class InchargesController : ControllerBase
{
    private readonly AppDbContext _db;
    public InchargesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Incharges.OrderBy(i => i.Name)
            .Select(i => new InchargeDto(i.Id, i.Name, i.BadgeNumber, i.MobileNumber, i.GroupName, i.IsActive))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var i = await _db.Incharges.FindAsync(id);
        if (i == null) return NotFound();
        return Ok(new InchargeDto(i.Id, i.Name, i.BadgeNumber, i.MobileNumber, i.GroupName, i.IsActive));
    }

    [HttpGet("badge/{badge}")]
    public async Task<IActionResult> GetByBadge(string badge)
    {
        var i = await _db.Incharges.FirstOrDefaultAsync(x => x.BadgeNumber == badge);
        if (i == null) return NotFound();
        return Ok(new InchargeDto(i.Id, i.Name, i.BadgeNumber, i.MobileNumber, i.GroupName, i.IsActive));
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] InchargeCreateDto dto)
    {
        if (await _db.Incharges.AnyAsync(x => x.BadgeNumber == dto.BadgeNumber))
            return BadRequest(new { message = "Badge number already exists" });

        var incharge = new Incharge
        {
            Name = dto.Name, BadgeNumber = dto.BadgeNumber,
            MobileNumber = dto.MobileNumber, GroupName = dto.GroupName
        };
        _db.Incharges.Add(incharge);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = incharge.Id },
            new InchargeDto(incharge.Id, incharge.Name, incharge.BadgeNumber, incharge.MobileNumber, incharge.GroupName, incharge.IsActive));
    }

    [HttpPut("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] InchargeUpdateDto dto)
    {
        var i = await _db.Incharges.FindAsync(id);
        if (i == null) return NotFound();
        i.Name = dto.Name; i.BadgeNumber = dto.BadgeNumber;
        i.MobileNumber = dto.MobileNumber; i.GroupName = dto.GroupName; i.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var i = await _db.Incharges.FindAsync(id);
        if (i == null) return NotFound();
        _db.Incharges.Remove(i);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
