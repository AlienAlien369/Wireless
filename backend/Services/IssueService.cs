namespace RSSBWireless.API.Services;

using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Models;
using RSSBWireless.API.Helpers;
using RSSBWireless.API.Services.Interfaces;

public class IssueService : IIssueService
{
    private readonly AppDbContext _db;
    private readonly SmsHelper _sms;
    private readonly IConfiguration _config;
    private readonly ILogger<IssueService> _logger;

    public IssueService(
        AppDbContext db, 
        SmsHelper sms, 
        IConfiguration config,
        ILogger<IssueService> logger)
    {
        _db = db;
        _sms = sms;
        _config = config;
        _logger = logger;
    }

    public async Task<IssueResponseDto> CreateIssueAsync(IssueCreateDto dto, string issuedBy, int? centerId, int? departmentId, CancellationToken cancellationToken = default)
    {
        var issue = new Issue
        {
            CenterId = centerId,
            DepartmentId = departmentId,
            VisitId = dto.VisitId,
            InchargeId = dto.InchargeId,
            IsGroupIssue = dto.IsGroupIssue,
            GroupName = dto.GroupName,
            GroupSetCount = dto.GroupSetCount,
            IssuedBy = issuedBy,
            Remarks = dto.Remarks
        };

        _db.Issues.Add(issue);
        await _db.SaveChangesAsync(cancellationToken);

        // Add line items and mark assets as Issued
        foreach (var item in dto.Items)
        {
            var ii = new IssueItem { IssueId = issue.Id, ItemType = item.ItemType };

            if (item.AssetId.HasValue)
            {
                ii.AssetId = item.AssetId;
                var a = await _db.Assets.FindAsync(new object?[] { item.AssetId }, cancellationToken);
                if (a != null) a.Status = AssetStatus.Issued;
            }

            _db.IssueItems.Add(ii);
        }
        await _db.SaveChangesAsync(cancellationToken);

        // Send SMS if requested
        if (dto.SendSms)
        {
            await SendIssueSmsAsync(issue, dto);
        }

        return await GetIssueByIdAsync(issue.Id, centerId, departmentId, false, cancellationToken);
    }

private async Task SendIssueSmsAsync(Issue issue, IssueCreateDto dto)
{
    try
    {
        var incharge = await _db.Incharges.FindAsync(dto.InchargeId);
        var visit = await _db.Visits.FindAsync(dto.VisitId);
        
        if (incharge == null || visit == null || string.IsNullOrEmpty(incharge.MobileNumber))
        {
            _logger.LogWarning("Cannot send SMS: Incharge or Visit not found, or no mobile number");
            return;
        }

        var itemCount = dto.Items.Count > 0 ? dto.Items.Count.ToString() : (dto.GroupSetCount?.ToString() ?? "1");
        var msg = $"RSSB Asset Team:\n" +
                  $"Asset(s) issued to you for {visit.Name}.\n" +
                  $"Please return after seva.";

        _logger.LogInformation("Attempting to send SMS to {MobileNumber}", incharge.MobileNumber);
        
        var (success, err) = await _sms.SendSmsAsync(incharge.MobileNumber, msg);

        _logger.LogInformation("SMS Result for {MobileNumber}: Success={Success}, Error={Error}", 
            incharge.MobileNumber, success, err ?? "null");

        var log = new SmsLog
        {
            IssueId = issue.Id,
            MobileNumber = incharge.MobileNumber,
            Message = msg,
            Status = success ? "Sent" : "Failed",
            ErrorMessage = err
        };
        
        _db.SmsLogs.Add(log);
        await _db.SaveChangesAsync(cancellationToken: default);

        if (!success)
        {
            _logger.LogError("Failed to send SMS to {MobileNumber}: {Error}", 
                incharge.MobileNumber, err);
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in SendIssueSmsAsync");
        
        // Still log the error to database
        var errorLog = new SmsLog
        {
            IssueId = issue.Id,
            MobileNumber = "unknown",
            Message = "SMS sending failed",
            Status = "Failed",
            ErrorMessage = ex.Message
        };
        _db.SmsLogs.Add(errorLog);
        await _db.SaveChangesAsync(cancellationToken: default);
    }
}
    // ... rest of your existing methods remain unchanged ...
    public async Task<IssueResponseDto> GetIssueByIdAsync(int id, int? centerId = null, int? departmentId = null, bool strictDepartment = false, CancellationToken cancellationToken = default)
    {
        var issue = await _db.Issues
            .AsNoTracking()
            .Include(i => i.Visit)
            .Include(i => i.Incharge)
            .Include(i => i.Items).ThenInclude(ii => ii.Asset).ThenInclude(a => a!.AssetType)
            .Include(i => i.SmsLogs)
            .FirstOrDefaultAsync(i =>
                i.Id == id &&
                (centerId == null || i.CenterId == centerId) &&
                (!strictDepartment || departmentId == null || i.DepartmentId == departmentId || i.DepartmentId == null),
                cancellationToken)
            ?? throw new KeyNotFoundException("Issue not found");

        return MapToDto(issue);
    }

    public async Task<List<IssueResponseDto>> GetIssuesByVisitAsync(int visitId, int? centerId = null, int? departmentId = null, bool strictDepartment = false, CancellationToken cancellationToken = default)
    {
        var issues = await _db.Issues
            .AsNoTracking()
            .Include(i => i.Visit).Include(i => i.Incharge)
            .Include(i => i.Items).ThenInclude(ii => ii.Asset).ThenInclude(a => a!.AssetType)
            .Include(i => i.SmsLogs)
            .Where(i =>
                i.VisitId == visitId &&
                (centerId == null || i.CenterId == centerId) &&
                (!strictDepartment || departmentId == null || i.DepartmentId == departmentId || i.DepartmentId == null))
            .OrderByDescending(i => i.IssuedAt)
            .ToListAsync(cancellationToken);

        return issues.Select(MapToDto).ToList();
    }

    public async Task ReturnIssueAsync(int issueId, List<int> returnedItemIds, bool sendSms = false, CancellationToken cancellationToken = default)
    {
        var issue = await _db.Issues
            .Include(i => i.Items)
            .Include(i => i.Incharge)
            .Include(i => i.Visit)
            .FirstOrDefaultAsync(i => i.Id == issueId, cancellationToken)
            ?? throw new KeyNotFoundException("Issue not found");

        foreach (var itemId in returnedItemIds)
        {
            var item = issue.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null) continue;
            item.IsReturned = true;
            item.ReturnedAt = DateTime.UtcNow;

            if (item.AssetId.HasValue)
            {
                var a = await _db.Assets.FindAsync(new object?[] { item.AssetId }, cancellationToken);
                if (a != null) a.Status = AssetStatus.Available;
            }
        }

        var allReturned = issue.Items.All(i => i.IsReturned);
        issue.Status = allReturned ? IssueStatus.Returned : IssueStatus.Partial;
        if (allReturned) issue.ReturnedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        if (sendSms && issue.Incharge != null && !string.IsNullOrWhiteSpace(issue.Incharge.MobileNumber))
        {
            var msg = $"AssetHub: Assets received for visit {issue.Visit?.Name}. Status: {issue.Status}.";
            var (success, err) = await _sms.SendSmsAsync(issue.Incharge.MobileNumber, msg);
            _db.SmsLogs.Add(new SmsLog
            {
                IssueId = issue.Id,
                MobileNumber = issue.Incharge.MobileNumber,
                Message = msg,
                Status = success ? "Sent" : "Failed",
                ErrorMessage = err
            });
            await _db.SaveChangesAsync(cancellationToken);
        }
    }

    private static IssueResponseDto MapToDto(Issue i) => new()
    {
        Id = i.Id,
        VisitId = i.VisitId,
        VisitName = i.Visit?.Name ?? "",
        InchargeId = i.InchargeId,
        InchargeName = i.Incharge?.Name ?? "",
        InchargeBadge = i.Incharge?.BadgeNumber ?? "",
        InchargeMobile = i.Incharge?.MobileNumber ?? "",
        IsGroupIssue = i.IsGroupIssue,
        GroupName = i.GroupName,
        GroupSetCount = i.GroupSetCount,
        IssuedBy = i.IssuedBy,
        IssuedAt = i.IssuedAt,
        ReturnedAt = i.ReturnedAt,
        Status = i.Status,
        Remarks = i.Remarks,
        Items = i.Items.Select(ii => new IssueItemResponseDto
        {
            Id = ii.Id,
            ItemType = ii.ItemType,
            AssetId = ii.AssetId,
            ItemNumber = ii.Asset?.ItemNumber ?? ii.Asset?.AssetType?.Name,
            Brand = ii.Asset?.Brand,
            IsReturned = ii.IsReturned,
            ReturnedAt = ii.ReturnedAt,
            ReturnRemarks = ii.ReturnRemarks
        }).ToList(),
        SmsLogs = i.SmsLogs.Select(s => new SmsLogDto
        {
            Id = s.Id,
            MobileNumber = s.MobileNumber,
            Message = s.Message,
            Status = s.Status,
            ErrorMessage = s.ErrorMessage,
            SentAt = s.SentAt
        }).ToList()
    };
}
