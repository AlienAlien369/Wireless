namespace RSSBWireless.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Helpers;
using RSSBWireless.API.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly QrCodeHelper _qr;
    public InventoryController(AppDbContext db, QrCodeHelper qr) { _db = db; _qr = qr; }

    // ─── Wireless Sets ────────────────────────────────────────────────────────
    [HttpGet("wireless-sets")]
    public async Task<IActionResult> GetSets([FromQuery] string? brand, [FromQuery] string? status)
    {
        var q = _db.WirelessSets.AsQueryable();
        if (!string.IsNullOrEmpty(brand)) q = q.Where(w => w.Brand == brand);
        if (!string.IsNullOrEmpty(status)) q = q.Where(w => w.Status == status);
        var list = await q.OrderBy(w => w.Brand).ThenBy(w => w.ItemNumber)
            .Select(w => new WirelessSetDto(w.Id, w.ItemNumber, w.Brand, w.Status, w.Remarks, w.QrCodeUrl, w.CreatedAt))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("wireless-sets/{id}")]
    public async Task<IActionResult> GetSet(int id)
    {
        var w = await _db.WirelessSets.FindAsync(id);
        if (w == null) return NotFound();
        return Ok(new WirelessSetDto(w.Id, w.ItemNumber, w.Brand, w.Status, w.Remarks, w.QrCodeUrl, w.CreatedAt));
    }

    [HttpGet("wireless-sets/by-number/{number}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSetByNumber(string number)
    {
        var w = await _db.WirelessSets.FirstOrDefaultAsync(x => x.ItemNumber == number);
        if (w == null) return NotFound();

        // Find current issue
        var issue = await _db.IssueItems
            .Include(ii => ii.Issue).ThenInclude(i => i.Incharge)
            .Include(ii => ii.Issue).ThenInclude(i => i.Visit)
            .Where(ii => ii.WirelessSetId == w.Id && !ii.IsReturned)
            .OrderByDescending(ii => ii.Issue.IssuedAt)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            SetNumber = w.ItemNumber,
            Brand = w.Brand,
            Status = w.Status,
            IssuedTo = issue?.Issue?.Incharge?.Name,
            BadgeNumber = issue?.Issue?.Incharge?.BadgeNumber,
            MobileNumber = issue?.Issue?.Incharge?.MobileNumber,
            VisitName = issue?.Issue?.Visit?.Name
        });
    }

    [HttpPost("wireless-sets"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSet([FromBody] WirelessSetCreateDto dto)
    {
        if (await _db.WirelessSets.AnyAsync(w => w.ItemNumber == dto.ItemNumber))
            return BadRequest(new { message = "Item number already exists" });

        var ws = new WirelessSet { ItemNumber = dto.ItemNumber, Brand = dto.Brand, Remarks = dto.Remarks };

        if (dto.Brand == "Kenwood")
            ws.QrCodeUrl = $"data:image/png;base64,{_qr.GenerateQrCodeBase64(dto.ItemNumber)}";

        _db.WirelessSets.Add(ws);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSet), new { id = ws.Id },
            new WirelessSetDto(ws.Id, ws.ItemNumber, ws.Brand, ws.Status, ws.Remarks, ws.QrCodeUrl, ws.CreatedAt));
    }

    [HttpPut("wireless-sets/{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSet(int id, [FromBody] WirelessSetUpdateDto dto)
    {
        var ws = await _db.WirelessSets.FindAsync(id);
        if (ws == null) return NotFound();
        ws.ItemNumber = dto.ItemNumber; ws.Brand = dto.Brand;
        ws.Status = dto.Status; ws.Remarks = dto.Remarks;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("wireless-sets/{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSet(int id)
    {
        var ws = await _db.WirelessSets.FindAsync(id);
        if (ws == null) return NotFound();
        _db.WirelessSets.Remove(ws);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Chargers ─────────────────────────────────────────────────────────────
    [HttpGet("chargers")]
    public async Task<IActionResult> GetChargers([FromQuery] string? brand)
    {
        var q = _db.Chargers.AsQueryable();
        if (!string.IsNullOrEmpty(brand)) q = q.Where(c => c.Brand == brand);
        var list = await q.Select(c => new ChargerDto(c.Id, c.ItemNumber, c.Brand, c.Status, c.Remarks, c.CreatedAt)).ToListAsync();
        return Ok(list);
    }

    [HttpPost("chargers"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCharger([FromBody] ChargerCreateDto dto)
    {
        var ch = new Charger { ItemNumber = dto.ItemNumber, Brand = dto.Brand, Remarks = dto.Remarks };
        _db.Chargers.Add(ch);
        await _db.SaveChangesAsync();
        return Ok(new ChargerDto(ch.Id, ch.ItemNumber, ch.Brand, ch.Status, ch.Remarks, ch.CreatedAt));
    }

    [HttpDelete("chargers/{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCharger(int id)
    {
        var ch = await _db.Chargers.FindAsync(id);
        if (ch == null) return NotFound();
        _db.Chargers.Remove(ch);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Kits ─────────────────────────────────────────────────────────────────
    [HttpGet("kits")]
    public async Task<IActionResult> GetKits()
    {
        var list = await _db.Kits.Select(k => new KitDto(k.Id, k.ItemNumber, k.Status, k.Remarks, k.CreatedAt)).ToListAsync();
        return Ok(list);
    }

    [HttpPost("kits"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateKit([FromBody] KitCreateDto dto)
    {
        var kit = new Kit { ItemNumber = dto.ItemNumber, Remarks = dto.Remarks };
        _db.Kits.Add(kit);
        await _db.SaveChangesAsync();
        return Ok(new KitDto(kit.Id, kit.ItemNumber, kit.Status, kit.Remarks, kit.CreatedAt));
    }

    [HttpDelete("kits/{id}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteKit(int id)
    {
        var kit = await _db.Kits.FindAsync(id);
        if (kit == null) return NotFound();
        _db.Kits.Remove(kit);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("wireless-sets/generate-qr-codes"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> GenerateAllQrCodes()
    {
        var sets = await _db.WirelessSets
            .Where(w => w.Brand == "Kenwood" && w.QrCodeUrl == null)
            .ToListAsync();

        foreach (var ws in sets)
            ws.QrCodeUrl = $"data:image/png;base64,{_qr.GenerateQrCodeBase64(ws.ItemNumber)}";

        await _db.SaveChangesAsync();
        return Ok(new { updated = sets.Count });
    }

}
