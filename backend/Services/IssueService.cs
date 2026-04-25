namespace RSSBWireless.API.Services;

using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Models;
using RSSBWireless.API.Helpers;

public class IssueService
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

    public async Task<IssueResponseDto> CreateIssueAsync(IssueCreateDto dto, string issuedBy, int? centerId, int? departmentId)
    {
        // Handle collector
        Collector? collector = null;
        if (dto.Collector != null)
        {
            collector = new Collector
            {
                Name = dto.Collector.Name,
                BadgeNumber = dto.Collector.BadgeNumber,
                PhoneNumber = dto.Collector.PhoneNumber
            };
            _db.Collectors.Add(collector);
            await _db.SaveChangesAsync();
        }

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
            Remarks = dto.Remarks,
            CollectorId = collector?.Id
        };

        _db.Issues.Add(issue);
        await _db.SaveChangesAsync();

        // Add line items and mark sets as Issued
        foreach (var item in dto.Items)
        {
            var ii = new IssueItem { IssueId = issue.Id, ItemType = item.ItemType };

            if (item.ItemType == "WirelessSet" && item.WirelessSetId.HasValue)
            {
                ii.WirelessSetId = item.WirelessSetId;
                var ws = await _db.WirelessSets.FindAsync(item.WirelessSetId);
                if (ws != null) ws.Status = "Issued";
            }
            else if (item.ItemType == "Charger" && item.ChargerId.HasValue)
            {
                ii.ChargerId = item.ChargerId;
                var ch = await _db.Chargers.FindAsync(item.ChargerId);
                if (ch != null) ch.Status = "Issued";
            }
            else if (item.ItemType == "Kit" && item.KitId.HasValue)
            {
                ii.KitId = item.KitId;
                var kit = await _db.Kits.FindAsync(item.KitId);
                if (kit != null) kit.Status = "Issued";
            }
            else if (item.AssetId.HasValue)
            {
                ii.AssetId = item.AssetId;
                var a = await _db.Assets.FindAsync(item.AssetId);
                if (a != null) a.Status = "Issued";
            }

            _db.IssueItems.Add(ii);
        }
        await _db.SaveChangesAsync();

        // Send SMS if requested
        if (dto.SendSms)
        {
            await SendIssueSmsAsync(issue, dto);
        }

        return await GetIssueByIdAsync(issue.Id, centerId, departmentId, false);
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

        var setNumbers = dto.Items
            .Where(i => i.ItemType == "WirelessSet" && i.WirelessSetId.HasValue)
            .Select(i => _db.WirelessSets.Find(i.WirelessSetId)?.ItemNumber ?? "")
            .Where(n => !string.IsNullOrEmpty(n))
            .ToList();

        var setsText = setNumbers.Any() 
            ? string.Join(", ", setNumbers) 
            : $"{dto.GroupSetCount} sets";

        var msg = $"RSSB Wireless Team:\n" +
                  $"Wireless Set(s) {setsText} has been issued to you for {visit.Name}.\n" +
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
        await _db.SaveChangesAsync();

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
        await _db.SaveChangesAsync();
    }
}
    // ... rest of your existing methods remain unchanged ...
    public async Task<IssueResponseDto> GetIssueByIdAsync(int id, int? centerId = null, int? departmentId = null, bool strictDepartment = false)
    {
        var issue = await _db.Issues
            .Include(i => i.Visit)
            .Include(i => i.Incharge)
            .Include(i => i.Collector)
            .Include(i => i.Items).ThenInclude(ii => ii.WirelessSet)
            .Include(i => i.Items).ThenInclude(ii => ii.Charger)
            .Include(i => i.Items).ThenInclude(ii => ii.Kit)
            .Include(i => i.Items).ThenInclude(ii => ii.Asset).ThenInclude(a => a!.AssetType)
            .Include(i => i.Photos)
            .Include(i => i.SmsLogs)
            .FirstOrDefaultAsync(i =>
                i.Id == id &&
                (centerId == null || i.CenterId == centerId) &&
                (!strictDepartment || departmentId == null || i.DepartmentId == departmentId || i.DepartmentId == null))
            ?? throw new KeyNotFoundException("Issue not found");

        return MapToDto(issue);
    }

    public async Task<List<IssueResponseDto>> GetIssuesByVisitAsync(int visitId, int? centerId = null, int? departmentId = null, bool strictDepartment = false)
    {
        var issues = await _db.Issues
            .Include(i => i.Visit).Include(i => i.Incharge).Include(i => i.Collector)
            .Include(i => i.Items).ThenInclude(ii => ii.WirelessSet)
            .Include(i => i.Items).ThenInclude(ii => ii.Charger)
            .Include(i => i.Items).ThenInclude(ii => ii.Kit)
            .Include(i => i.Items).ThenInclude(ii => ii.Asset).ThenInclude(a => a!.AssetType)
            .Include(i => i.Photos)
            .Include(i => i.SmsLogs)
            .Where(i =>
                i.VisitId == visitId &&
                (centerId == null || i.CenterId == centerId) &&
                (!strictDepartment || departmentId == null || i.DepartmentId == departmentId || i.DepartmentId == null))
            .OrderByDescending(i => i.IssuedAt)
            .ToListAsync();

        return issues.Select(MapToDto).ToList();
    }

    public async Task ReturnIssueAsync(int issueId, List<int> returnedItemIds)
    {
        var issue = await _db.Issues.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == issueId)
            ?? throw new KeyNotFoundException("Issue not found");

        foreach (var itemId in returnedItemIds)
        {
            var item = issue.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null) continue;
            item.IsReturned = true;
            item.ReturnedAt = DateTime.UtcNow;

            if (item.WirelessSetId.HasValue)
            {
                var ws = await _db.WirelessSets.FindAsync(item.WirelessSetId);
                if (ws != null) ws.Status = "Available";
            }
            if (item.ChargerId.HasValue)
            {
                var ch = await _db.Chargers.FindAsync(item.ChargerId);
                if (ch != null) ch.Status = "Available";
            }
            if (item.KitId.HasValue)
            {
                var kit = await _db.Kits.FindAsync(item.KitId);
                if (kit != null) kit.Status = "Available";
            }
            if (item.AssetId.HasValue)
            {
                var a = await _db.Assets.FindAsync(item.AssetId);
                if (a != null) a.Status = "Available";
            }
        }

        var allReturned = issue.Items.All(i => i.IsReturned);
        issue.Status = allReturned ? "Returned" : "Partial";
        if (allReturned) issue.ReturnedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
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
        Collector = i.Collector == null ? null : new CollectorDto(
            i.Collector.Id, 
            i.Collector.Name, 
            i.Collector.BadgeNumber, 
            i.Collector.PhoneNumber),
        Items = i.Items.Select(ii => new IssueItemResponseDto
        {
            Id = ii.Id,
            ItemType = ii.ItemType,
            WirelessSetId = ii.WirelessSetId,
            ChargerId = ii.ChargerId,
            KitId = ii.KitId,
            AssetId = ii.AssetId,
            ItemNumber = ii.WirelessSet?.ItemNumber ?? ii.Charger?.ItemNumber ?? ii.Kit?.ItemNumber ?? ii.Asset?.ItemNumber ?? ii.Asset?.AssetType?.Name,
            Brand = ii.WirelessSet?.Brand ?? ii.Charger?.Brand ?? ii.Asset?.Brand,
            IsReturned = ii.IsReturned,
            ReturnedAt = ii.ReturnedAt
        }).ToList(),
        PhotoUrls = i.Photos.Select(p => p.ImageUrl).ToList(),
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
