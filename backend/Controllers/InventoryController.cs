namespace RSSBWireless.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Helpers;
using RSSBWireless.API.Models;
using RSSBWireless.API.Services;
using RSSBWireless.API.Services.Interfaces;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly QrCodeHelper _qr;
    private readonly IAccessScopeService _scope;
    private readonly ProductConfigService _config;
    public InventoryController(AppDbContext db, QrCodeHelper qr, IAccessScopeService scope, ProductConfigService config) { _db = db; _qr = qr; _scope = scope; _config = config; }

    // ─── Wireless Sets ────────────────────────────────────────────────────────
    [HttpGet("wireless-sets")]
    public async Task<IActionResult> GetSets([FromQuery] string? brand, [FromQuery] string? status, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var q = _db.WirelessSets.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(brand)) q = q.Where(w => w.Brand == brand);
        if (!string.IsNullOrEmpty(status)) q = q.Where(w => w.Status == status);
        var list = await q.OrderBy(w => w.Brand).ThenBy(w => w.ItemNumber)
            .Select(w => new WirelessSetDto(w.Id, w.ItemNumber, w.Brand, w.Status, w.Remarks, w.QrCodeUrl, w.CreatedAt))
            .ToListAsync(cancellationToken);
        return Ok(list);
    }

    [HttpGet("wireless-sets/{id}")]
    public async Task<IActionResult> GetSet(int id, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var w = await _db.WirelessSets.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (w == null) return NotFound();
        return Ok(new WirelessSetDto(w.Id, w.ItemNumber, w.Brand, w.Status, w.Remarks, w.QrCodeUrl, w.CreatedAt));
    }

    [HttpGet("wireless-sets/by-number/{number}")]
    public async Task<IActionResult> GetSetByNumber(string number, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var w = await _db.WirelessSets.AsNoTracking().FirstOrDefaultAsync(x => x.ItemNumber == number, cancellationToken);
        if (w == null) return NotFound();

        // Find current issue
        var issue = await _db.IssueItems
            .AsNoTracking()
            .Include(ii => ii.Issue).ThenInclude(i => i.Incharge)
            .Include(ii => ii.Issue).ThenInclude(i => i.Visit)
            .Where(ii => ii.WirelessSetId == w.Id && !ii.IsReturned)
            .OrderByDescending(ii => ii.Issue.IssuedAt)
            .FirstOrDefaultAsync(cancellationToken);

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

    [HttpPost("wireless-sets")]
    public async Task<IActionResult> CreateSet([FromBody] WirelessSetCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        if (await _db.WirelessSets.AnyAsync(w => w.ItemNumber == dto.ItemNumber, cancellationToken))
            return BadRequest(new { message = "Item number already exists" });

        var ws = new WirelessSet { ItemNumber = dto.ItemNumber, Brand = dto.Brand, Remarks = dto.Remarks };

        if (dto.Brand == "Kenwood")
            ws.QrCodeUrl = $"data:image/png;base64,{_qr.GenerateQrCodeBase64(dto.ItemNumber)}";

        _db.WirelessSets.Add(ws);
        await _db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetSet), new { id = ws.Id },
            new WirelessSetDto(ws.Id, ws.ItemNumber, ws.Brand, ws.Status, ws.Remarks, ws.QrCodeUrl, ws.CreatedAt));
    }

    [HttpPut("wireless-sets/{id}")]
    public async Task<IActionResult> UpdateSet(int id, [FromBody] WirelessSetUpdateDto dto, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var ws = await _db.WirelessSets.FindAsync(new object?[] { id }, cancellationToken);
        if (ws == null) return NotFound();
        ws.ItemNumber = dto.ItemNumber; ws.Brand = dto.Brand;
        ws.Status = dto.Status; ws.Remarks = dto.Remarks;
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("wireless-sets/{id}")]
    public async Task<IActionResult> DeleteSet(int id, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var ws = await _db.WirelessSets.FindAsync(new object?[] { id }, cancellationToken);
        if (ws == null) return NotFound();
        _db.WirelessSets.Remove(ws);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    // ─── Chargers ─────────────────────────────────────────────────────────────
    [HttpGet("chargers")]
    public async Task<IActionResult> GetChargers([FromQuery] string? brand, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var q = _db.Chargers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(brand)) q = q.Where(c => c.Brand == brand);
        var list = await q.Select(c => new ChargerDto(c.Id, c.ItemNumber, c.Brand, c.Status, c.Remarks, c.CreatedAt)).ToListAsync(cancellationToken);
        return Ok(list);
    }

    [HttpPost("chargers")]
    public async Task<IActionResult> CreateCharger([FromBody] ChargerCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var ch = new Charger { ItemNumber = dto.ItemNumber, Brand = dto.Brand, Remarks = dto.Remarks };
        _db.Chargers.Add(ch);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new ChargerDto(ch.Id, ch.ItemNumber, ch.Brand, ch.Status, ch.Remarks, ch.CreatedAt));
    }

    [HttpDelete("chargers/{id}")]
    public async Task<IActionResult> DeleteCharger(int id, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var ch = await _db.Chargers.FindAsync(new object?[] { id }, cancellationToken);
        if (ch == null) return NotFound();
        _db.Chargers.Remove(ch);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    // ─── Kits ─────────────────────────────────────────────────────────────────
    [HttpGet("kits")]
    public async Task<IActionResult> GetKits(CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var list = await _db.Kits.AsNoTracking().Select(k => new KitDto(k.Id, k.ItemNumber, k.Status, k.Remarks, k.CreatedAt)).ToListAsync(cancellationToken);
        return Ok(list);
    }

    [HttpPost("kits")]
    public async Task<IActionResult> CreateKit([FromBody] KitCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var kit = new Kit { ItemNumber = dto.ItemNumber, Remarks = dto.Remarks };
        _db.Kits.Add(kit);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new KitDto(kit.Id, kit.ItemNumber, kit.Status, kit.Remarks, kit.CreatedAt));
    }

    [HttpDelete("kits/{id}")]
    public async Task<IActionResult> DeleteKit(int id, CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var kit = await _db.Kits.FindAsync(new object?[] { id }, cancellationToken);
        if (kit == null) return NotFound();
        _db.Kits.Remove(kit);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("wireless-sets/generate-qr-codes")]
    public async Task<IActionResult> GenerateAllQrCodes(CancellationToken cancellationToken = default)
    {
        if (!_config.GetSnapshot().FeatureFlags.LegacyWirelessEnabled) return NotFound();
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var sets = await _db.WirelessSets
            .Where(w => w.Brand == "Kenwood" && w.QrCodeUrl == null)
            .ToListAsync(cancellationToken);

        foreach (var ws in sets)
            ws.QrCodeUrl = $"data:image/png;base64,{_qr.GenerateQrCodeBase64(ws.ItemNumber)}";

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { updated = sets.Count });
    }

}
