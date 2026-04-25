namespace RSSBWireless.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Helpers;
using RSSBWireless.API.Models;
using RSSBWireless.API.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AccessScopeService _scope;
    private readonly QrCodeHelper _qr;
    public AssetsController(AppDbContext db, AccessScopeService scope, QrCodeHelper qr) { _db = db; _scope = scope; _qr = qr; }

    [HttpGet("types")]
    public async Task<IActionResult> GetTypes([FromQuery] int? centerId)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var q = _db.AssetTypes.Include(x => x.Center).AsQueryable();
        if (centerId != null) q = q.Where(x => x.CenterId == centerId);
        if (!scope.IsGlobalAdmin && scope.CenterId != null) q = q.Where(x => x.CenterId == scope.CenterId);

        var list = await q.OrderBy(x => x.Name)
            .Select(x => new AssetTypeDto(x.Id, x.CenterId, x.Code, x.Name, x.TrackingMode, x.IsActive))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("types")]
    public async Task<IActionResult> CreateType([FromBody] AssetTypeCreateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        _scope.EnsureCenterAccess(scope, dto.CenterId);
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

    [HttpPut("types/{id:int}")]
    public async Task<IActionResult> UpdateType(int id, [FromBody] AssetTypeUpdateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var t = await _db.AssetTypes.FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        _scope.EnsureCenterAccess(scope, t.CenterId);

        var code = (dto.Code ?? "").Trim().ToLowerInvariant();
        var name = (dto.Name ?? "").Trim();
        var tracking = (dto.TrackingMode ?? "").Trim();
        if (string.IsNullOrWhiteSpace(code)) return BadRequest(new { message = "Code is required" });
        if (string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "Name is required" });
        if (tracking != "Individual" && tracking != "Group") return BadRequest(new { message = "TrackingMode must be Individual or Group" });
        if (await _db.AssetTypes.AnyAsync(x => x.Id != id && x.CenterId == t.CenterId && x.Code == code))
            return BadRequest(new { message = "Asset type code already exists" });

        t.Code = code;
        t.Name = name;
        t.TrackingMode = tracking;
        t.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new AssetTypeDto(t.Id, t.CenterId, t.Code, t.Name, t.TrackingMode, t.IsActive));
    }

    [HttpDelete("types/{id:int}")]
    public async Task<IActionResult> DeleteType(int id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var t = await _db.AssetTypes.FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        _scope.EnsureCenterAccess(scope, t.CenterId);

        if (await _db.Assets.AnyAsync(x => x.AssetTypeId == id))
            return BadRequest(new { message = "Asset type has items and cannot be deleted" });

        _db.AssetTypes.Remove(t);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetAssets([FromQuery] int centerId, [FromQuery] int? assetTypeId, [FromQuery] string? status)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        _scope.EnsureCenterAccess(scope, centerId);
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
                BuildRemarksWithQr(x)
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsset([FromBody] AssetCreateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        _scope.EnsureCenterAccess(scope, dto.CenterId);
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

        return Ok(new AssetDto(a.Id, a.CenterId, a.AssetTypeId, type.Code, type.Name, a.ItemNumber, a.Brand, a.Status, BuildRemarksWithQr(a)));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAsset(int id, [FromBody] AssetUpdateDto dto)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var a = await _db.Assets.Include(x => x.AssetType).FirstOrDefaultAsync(x => x.Id == id);
        if (a == null) return NotFound();
        _scope.EnsureCenterAccess(scope, a.CenterId);
        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            var status = dto.Status.Trim();
            if (status != "Available" && status != "Issued" && status != "Broken")
                return BadRequest(new { message = "Invalid status" });
            a.Status = status;
        }

        var itemNumber = string.IsNullOrWhiteSpace(dto.ItemNumber) ? null : dto.ItemNumber.Trim();
        if (itemNumber != null && await _db.Assets.AnyAsync(x => x.Id != id && x.CenterId == a.CenterId && x.AssetTypeId == a.AssetTypeId && x.ItemNumber == itemNumber))
            return BadRequest(new { message = "ItemNumber already exists for this type" });

        a.ItemNumber = itemNumber;
        a.Brand = string.IsNullOrWhiteSpace(dto.Brand) ? null : dto.Brand.Trim();
        a.Remarks = string.IsNullOrWhiteSpace(dto.Remarks) ? null : dto.Remarks.Trim();
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAsset(int id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var a = await _db.Assets.FirstOrDefaultAsync(x => x.Id == id);
        if (a == null) return NotFound();
        _scope.EnsureCenterAccess(scope, a.CenterId);

        if (await _db.IssueItems.AnyAsync(x => x.AssetId == id && !x.IsReturned))
            return BadRequest(new { message = "Asset is currently issued and cannot be deleted" });

        _db.Assets.Remove(a);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:int}/qr")]
    public async Task<IActionResult> GetAssetQr(int id)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var asset = await _db.Assets.Include(x => x.AssetType).FirstOrDefaultAsync(x => x.Id == id);
        if (asset == null) return NotFound();
        _scope.EnsureCenterAccess(scope, asset.CenterId);

        var qrValue = $"AST-{asset.CenterId}-{asset.AssetTypeId}-{asset.Id}";
        var qrImageBase64 = _qr.GenerateQrCodeBase64(qrValue);
        return Ok(new
        {
            assetId = asset.Id,
            qrValue,
            qrImage = $"data:image/png;base64,{qrImageBase64}"
        });
    }

    [HttpGet("scan/{qrValue}")]
    public async Task<IActionResult> FindByQr(string qrValue)
    {
        var scope = await _scope.RequireAdminUiAsync(User);
        var parts = (qrValue ?? "").Split('-', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 4 || !string.Equals(parts[0], "AST", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Invalid QR value" });

        if (!int.TryParse(parts[1], out var centerId) || !int.TryParse(parts[3], out var assetId))
            return BadRequest(new { message = "Invalid QR value" });

        _scope.EnsureCenterAccess(scope, centerId);

        var asset = await _db.Assets.Include(x => x.AssetType)
            .FirstOrDefaultAsync(x => x.Id == assetId && x.CenterId == centerId);
        if (asset == null) return NotFound();

        return Ok(new AssetDto(asset.Id, asset.CenterId, asset.AssetTypeId, asset.AssetType.Code, asset.AssetType.Name, asset.ItemNumber, asset.Brand, asset.Status, BuildRemarksWithQr(asset)));
    }

    private static string? BuildRemarksWithQr(Asset a)
    {
        var qrValue = $"AST-{a.CenterId}-{a.AssetTypeId}-{a.Id}";
        if (string.IsNullOrWhiteSpace(a.Remarks)) return $"QR:{qrValue}";
        return a.Remarks.Contains("QR:", StringComparison.OrdinalIgnoreCase) ? a.Remarks : $"{a.Remarks} | QR:{qrValue}";
    }
}

