namespace RSSBWireless.API.Controllers;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Helpers;
using RSSBWireless.API.Services;
using RSSBWireless.API.Data;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IssuesController : ControllerBase
{
    private readonly IssueService _svc;
    private readonly AppDbContext _db;
    private readonly CloudinaryHelper _cloudinary;

    public IssuesController(IssueService svc, AppDbContext db, CloudinaryHelper cloudinary)
    {
        _svc = svc; _db = db; _cloudinary = cloudinary;
    }

    [HttpGet("visit/{visitId}")]
    public async Task<IActionResult> GetByVisit(int visitId)
        => Ok(await _svc.GetIssuesByVisitAsync(visitId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try { return Ok(await _svc.GetIssueByIdAsync(id)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpGet("incharge/{inchargeId}")]
    public async Task<IActionResult> GetByIncharge(int inchargeId)
    {
        var issues = await _db.Issues
            .Include(i => i.Visit).Include(i => i.Items).ThenInclude(ii => ii.WirelessSet)
            .Where(i => i.InchargeId == inchargeId)
            .OrderByDescending(i => i.IssuedAt)
            .ToListAsync();
        return Ok(issues);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] IssueCreateDto dto)
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? "admin";
        try
        {
            var result = await _svc.CreateIssueAsync(dto, username);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("{id}/return"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Return(int id, [FromBody] List<int> itemIds)
    {
        try
        {
            await _svc.ReturnIssueAsync(id, itemIds);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/photos"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadPhoto(int id, IFormFile file)
    {
        var issue = await _db.Issues.FindAsync(id);
        if (issue == null) return NotFound();

        var (url, publicId) = await _cloudinary.UploadImageAsync(file);
        var photo = new Photo { IssueId = id, ImageUrl = url, PublicId = publicId };
        _db.Photos.Add(photo);
        await _db.SaveChangesAsync();
        return Ok(new { url });
    }
}
