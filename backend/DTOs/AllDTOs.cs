namespace RSSBWireless.API.DTOs;

// ─── Auth ─────────────────────────────────────────────────────────────────────
public record LoginDto(string Username, string Password);
public record RegisterDto(string Username, string Password, string FullName, string Role, string? BadgeNumber);
public record AuthResponseDto(string Token, string Username, string Role, string FullName);

// ─── Visit ────────────────────────────────────────────────────────────────────
public record VisitCreateDto(string Name, string Location, DateTime VisitDate, string? Remarks);
public record VisitUpdateDto(string Name, string Location, DateTime VisitDate, string? Remarks, bool IsActive);
public record VisitDto(int Id, string Name, string Location, DateTime VisitDate, string? Remarks, bool IsActive, DateTime CreatedAt);

// ─── Incharge ─────────────────────────────────────────────────────────────────
public record InchargeCreateDto(string Name, string BadgeNumber, string MobileNumber, string? GroupName);
public record InchargeUpdateDto(string Name, string BadgeNumber, string MobileNumber, string? GroupName, bool IsActive);
public record InchargeDto(int Id, string Name, string BadgeNumber, string MobileNumber, string? GroupName, bool IsActive);

// ─── WirelessSet ──────────────────────────────────────────────────────────────
public record WirelessSetCreateDto(string ItemNumber, string Brand, string? Remarks);
public record WirelessSetUpdateDto(string ItemNumber, string Brand, string Status, string? Remarks);
public record WirelessSetDto(int Id, string ItemNumber, string Brand, string Status, string? Remarks, string? QrCodeUrl, DateTime CreatedAt);

// ─── Charger ──────────────────────────────────────────────────────────────────
public record ChargerCreateDto(string? ItemNumber, string Brand, string? Remarks);
public record ChargerDto(int Id, string? ItemNumber, string Brand, string Status, string? Remarks, DateTime CreatedAt);

// ─── Kit ──────────────────────────────────────────────────────────────────────
public record KitCreateDto(string ItemNumber, string? Remarks);
public record KitDto(int Id, string ItemNumber, string Status, string? Remarks, DateTime CreatedAt);

// ─── Issue ────────────────────────────────────────────────────────────────────
public class IssueCreateDto
{
    public int VisitId { get; set; }
    public int InchargeId { get; set; }
    public bool IsGroupIssue { get; set; }
    public string? GroupName { get; set; }
    public int? GroupSetCount { get; set; }
    public string? Remarks { get; set; }
    public List<IssueItemDto> Items { get; set; } = new();
    public CollectorCreateDto? Collector { get; set; }
    public bool SendSms { get; set; } = true;
}

public class IssueItemDto
{
    public string ItemType { get; set; } = string.Empty;
    public int? WirelessSetId { get; set; }
    public int? ChargerId { get; set; }
    public int? KitId { get; set; }
}

public class CollectorCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string BadgeNumber { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

public class IssueResponseDto
{
    public int Id { get; set; }
    public int VisitId { get; set; }
    public string VisitName { get; set; } = string.Empty;
    public int InchargeId { get; set; }
    public string InchargeName { get; set; } = string.Empty;
    public string InchargeBadge { get; set; } = string.Empty;
    public string InchargeMobile { get; set; } = string.Empty;
    public bool IsGroupIssue { get; set; }
    public string? GroupName { get; set; }
    public int? GroupSetCount { get; set; }
    public string IssuedBy { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime? ReturnedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public CollectorDto? Collector { get; set; }
    public List<IssueItemResponseDto> Items { get; set; } = new();
    public List<string> PhotoUrls { get; set; } = new();
    public List<SmsLogDto> SmsLogs { get; set; } = new();
}

public class IssueItemResponseDto
{
    public int Id { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public int? WirelessSetId { get; set; }
    public int? ChargerId { get; set; }
    public int? KitId { get; set; }
    public string? ItemNumber { get; set; }
    public string? Brand { get; set; }
    public bool IsReturned { get; set; }
    public DateTime? ReturnedAt { get; set; }
}

public record CollectorDto(int Id, string Name, string BadgeNumber, string PhoneNumber);

public class SmsLogDto
{
    public int Id { get; set; }
    public string MobileNumber { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public DateTime SentAt { get; set; }
}

// ─── Breakage ─────────────────────────────────────────────────────────────────
public class BreakageCreateDto
{
    public int VisitId { get; set; }
    public int? WirelessSetId { get; set; }
    public string ItemNumber { get; set; } = string.Empty;
    public string BreakageReason { get; set; } = string.Empty;
    public string ReportedBy { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

public class BreakageDto
{
    public int Id { get; set; }
    public int VisitId { get; set; }
    public string VisitName { get; set; } = string.Empty;
    public string ItemNumber { get; set; } = string.Empty;
    public string BreakageReason { get; set; } = string.Empty;
    public string ReportedBy { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public DateTime ReportedAt { get; set; }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
public class DashboardStatsDto
{
    public int TotalWirelessSets { get; set; }
    public int AvailableSets { get; set; }
    public int IssuedSets { get; set; }
    public int BrokenSets { get; set; }
    public int TotalIncharges { get; set; }
    public int ActiveVisits { get; set; }
    public int TodayIssues { get; set; }
    public int TotalBreakages { get; set; }
}

public class VisitWiseDashboardDto
{
    public int VisitId { get; set; }
    public string VisitName { get; set; } = string.Empty;
    public int TotalCurrentlyIssued { get; set; }
    public int KenwoodSetsCurrentlyIssued { get; set; }
    public int KenwoodSetsRemaining { get; set; }
    public int VertelSetsCurrentlyIssued { get; set; }
    public int VertelSetsRemaining { get; set; }
    public int AsperaSetsCurrentlyIssued { get; set; }
    public int AsperaSetsRemaining { get; set; }
    public int KenwoodChargersCurrentlyIssued { get; set; }
    public int KenwoodChargersRemaining { get; set; }
    public int VertelChargersCurrentlyIssued { get; set; }
    public int VertelChargersRemaining { get; set; }
    public int AsperaChargersCurrentlyIssued { get; set; }
    public int AsperaChargersRemaining { get; set; }
    public int KitsCurrentlyIssued { get; set; }
    public int KitsRemaining { get; set; }
}
