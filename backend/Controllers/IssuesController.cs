namespace RSSBWireless.API.Controllers;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Helpers;
using RSSBWireless.API.Services;
using RSSBWireless.API.Services.Interfaces;
using RSSBWireless.API.Data;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IssuesController : ControllerBase
{
    private readonly IIssueService _svc;
    private readonly AppDbContext _db;
    private readonly CloudinaryHelper _cloudinary;
    private readonly IAccessScopeService _scope;
    private readonly ProductConfigService _config;

    public IssuesController(IIssueService svc, AppDbContext db, CloudinaryHelper cloudinary, IAccessScopeService scope, ProductConfigService config)
    {
        _svc = svc; _db = db; _cloudinary = cloudinary; _scope = scope; _config = config;
    }

    [HttpGet("visit/{visitId}")]
    public async Task<IActionResult> GetByVisit(int visitId, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        return Ok(await _svc.GetIssuesByVisitAsync(visitId, scope.IsGlobalAdmin ? null : scope.CenterId, scope.DepartmentId, !scope.IsGlobalAdmin && !scope.IsCenterHead, cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        try { return Ok(await _svc.GetIssueByIdAsync(id, scope.IsGlobalAdmin ? null : scope.CenterId, scope.DepartmentId, !scope.IsGlobalAdmin && !scope.IsCenterHead, cancellationToken)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpGet("incharge/{inchargeId}")]
    public async Task<IActionResult> GetByIncharge(int inchargeId, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var issues = await _db.Issues
            .AsNoTracking()
            .Include(i => i.Visit).Include(i => i.Items).ThenInclude(ii => ii.WirelessSet)
            .Where(i => i.InchargeId == inchargeId &&
                (scope.IsGlobalAdmin || (scope.CenterId != null && i.CenterId == scope.CenterId)) &&
                (scope.IsGlobalAdmin || scope.IsCenterHead || scope.DepartmentId == null || i.DepartmentId == scope.DepartmentId))
            .OrderByDescending(i => i.IssuedAt)
            .ToListAsync(cancellationToken);
        return Ok(issues);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] IssueCreateDto dto, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var username = User.FindFirstValue(ClaimTypes.Name) ?? "admin";
        var canSendSmsByRole = _config.IsSmsEnabledForRole(scope.Role);
        try
        {
            var visit = await _db.Visits.FirstOrDefaultAsync(v => v.Id == dto.VisitId, cancellationToken);
            if (visit == null) return BadRequest(new { message = "Invalid visit" });
            var incharge = await _db.Incharges.FirstOrDefaultAsync(i => i.Id == dto.InchargeId, cancellationToken);
            if (incharge == null) return BadRequest(new { message = "Invalid incharge" });
            if (!scope.IsGlobalAdmin)
            {
                if (scope.CenterId == null) return Forbid();
                if (visit.CenterId != null && visit.CenterId != scope.CenterId) return Forbid();
                if (incharge.CenterId != null && incharge.CenterId != scope.CenterId) return Forbid();
                if (!scope.IsCenterHead && scope.DepartmentId != null)
                {
                    if (visit.DepartmentId != null && visit.DepartmentId != scope.DepartmentId) return Forbid();
                    if (incharge.DepartmentId != null && incharge.DepartmentId != scope.DepartmentId) return Forbid();
                }
            }

            dto.SendSms = dto.SendSms && canSendSmsByRole;
            var result = await _svc.CreateIssueAsync(dto, username, scope.CenterId, scope.IsCenterHead ? null : scope.DepartmentId, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("{id}/return")]
    public async Task<IActionResult> Return(int id, [FromBody] List<int> itemIds, CancellationToken cancellationToken = default)
    {
        var scope = await _scope.RequireAdminUiAsync(User, cancellationToken);
        var canSendSmsByRole = _config.IsSmsEnabledForRole(scope.Role);
        var cfg = _config.GetSnapshot();
        var issue = await _db.Issues.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (issue == null) return NotFound();
        if (!scope.IsGlobalAdmin)
        {
            if (scope.CenterId == null || issue.CenterId != scope.CenterId) return Forbid();
            if (!scope.IsCenterHead && scope.DepartmentId != null && issue.DepartmentId != scope.DepartmentId) return Forbid();
        }
        try
        {
            await _svc.ReturnIssueAsync(id, itemIds, cfg.Sms.ReceiveEnabled && canSendSmsByRole, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/photos")]
    public async Task<IActionResult> UploadPhoto(int id, IFormFile file, CancellationToken cancellationToken = default)
    {
        await _scope.RequireAdminUiAsync(User, cancellationToken);
        var issue = await _db.Issues.FindAsync(new object?[] { id }, cancellationToken);
        if (issue == null) return NotFound();

        var (url, publicId) = await _cloudinary.UploadImageAsync(file);
        var photo = new Photo { IssueId = id, ImageUrl = url, PublicId = publicId };
        _db.Photos.Add(photo);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { url });
    }
}
