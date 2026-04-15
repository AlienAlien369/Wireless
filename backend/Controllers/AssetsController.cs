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
public class AssetsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AssetsController(AppDbContext db) => _db = db;

    [HttpGet("types")]
    public async Task<IActionResult> GetTypes([FromQuery] int? centerId)
    {
        var q = _db.AssetTypes.Include(x => x.Center).AsQueryable();
        if (centerId != null) q = q.Where(x => x.CenterId == centerId);

        var list = await q.OrderBy(x => x.Name)
            .Select(x => new AssetTypeDto(x.Id, x.CenterId, x.Code, x.Name, x.TrackingMode, x.IsActive))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("types")]
    public async Task<IActionResult> CreateType([FromBody] AssetTypeCreateDto dto)
    {
        var code = (dto.Code ?? "").Trim().ToLowerInvariant();
        var name = (dto.Name ?? "").Trim();
        var tracking = (dto.TrackingMode ?? "").Trim();
        if (string.IsNullOrWhiteSpace(code)) return BadRequest(new { message = "Code is required" });
        if (string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "Name is required" });
        if (tracking != "Individual" && tracking != "Group") return BadRequest(new { message = "TrackingMode must be Individual or Group" });
        if (!await _db.Centers.AnyAsync(x => x.Id == dto.CenterId)) return BadRequest(new { message = "Invalid centerId" });

        if (await _db.AssetTypes.AnyAsync(x => x.CenterId == dto.CenterId && x.Code == code))
            return BadRequest(new { message = "Asset type code already exists" });

        var t = new AssetType { CenterId = dto.CenterId, Code = code, Name = name, TrackingMode = tracking };
        _db.AssetTypes.Add(t);
        await _db.SaveChangesAsync();
        return Ok(new AssetTypeDto(t.Id, t.CenterId, t.Code, t.Name, t.TrackingMode, t.IsActive));
    }

    [HttpGet]
    public async Task<IActionResult> GetAssets([FromQuery] int centerId, [FromQuery] int? assetTypeId, [FromQuery] string? status)
    {
        var q = _db.Assets
            .Include(x => x.AssetType)
            .Where(x => x.CenterId == centerId)
            .AsQueryable();

        if (assetTypeId != null) q = q.Where(x => x.AssetTypeId == assetTypeId);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status);

        var list = await q.OrderBy(x => x.AssetType.Name).ThenBy(x => x.ItemNumber)
            .Select(x => new AssetDto(
                x.Id,
                x.CenterId,
                x.AssetTypeId,
                x.AssetType.Code,
                x.AssetType.Name,
                x.ItemNumber,
                x.Brand,
                x.Status,
                x.Remarks
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsset([FromBody] AssetCreateDto dto)
    {
        if (!await _db.Centers.AnyAsync(x => x.Id == dto.CenterId)) return BadRequest(new { message = "Invalid centerId" });
        var type = await _db.AssetTypes.FirstOrDefaultAsync(x => x.Id == dto.AssetTypeId && x.CenterId == dto.CenterId);
        if (type == null) return BadRequest(new { message = "Invalid assetTypeId" });

        var itemNumber = string.IsNullOrWhiteSpace(dto.ItemNumber) ? null : dto.ItemNumber.Trim();
        var brand = string.IsNullOrWhiteSpace(dto.Brand) ? null : dto.Brand.Trim();

        if (itemNumber != null && await _db.Assets.AnyAsync(x => x.CenterId == dto.CenterId && x.AssetTypeId == dto.AssetTypeId && x.ItemNumber == itemNumber))
            return BadRequest(new { message = "ItemNumber already exists for this type" });

        var a = new Asset
        {
            CenterId = dto.CenterId,
            AssetTypeId = dto.AssetTypeId,
            ItemNumber = itemNumber,
            Brand = brand,
            Remarks = string.IsNullOrWhiteSpace(dto.Remarks) ? null : dto.Remarks.Trim()
        };
        _db.Assets.Add(a);
        await _db.SaveChangesAsync();

        return Ok(new AssetDto(a.Id, a.CenterId, a.AssetTypeId, type.Code, type.Name, a.ItemNumber, a.Brand, a.Status, a.Remarks));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsset(int id, [FromBody] AssetUpdateDto dto)
    {
        var a = await _db.Assets.Include(x => x.AssetType).FirstOrDefaultAsync(x => x.Id == id);
        if (a == null) return NotFound();
        var status = (dto.Status ?? "").Trim();
        if (status != "Available" && status != "Issued" && status != "Broken")
            return BadRequest(new { message = "Invalid status" });

        a.Status = status;
        a.Remarks = string.IsNullOrWhiteSpace(dto.Remarks) ? null : dto.Remarks.Trim();
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

