namespace RSSBWireless.API.Models;

// ─── Visit ───────────────────────────────────────────────────────────────────
public class Visit
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; } = DateTime.UtcNow;
    public string? Remarks { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
    public ICollection<Breakage> Breakages { get; set; } = new List<Breakage>();
}

// ─── Incharge ─────────────────────────────────────────────────────────────────
public class Incharge
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string BadgeNumber { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? GroupName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
}

// ─── WirelessSet ─────────────────────────────────────────────────────────────
public class WirelessSet
{
    public int Id { get; set; }
    public string ItemNumber { get; set; } = string.Empty;        // e.g. KW-21
    public string Brand { get; set; } = string.Empty;             // Kenwood | Vertel | Aspera
    public string Status { get; set; } = "Available";             // Available | Issued | Broken
    public string? Remarks { get; set; }
    public string? QrCodeUrl { get; set; }                        // Kenwood only
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<IssueItem> IssueItems { get; set; } = new List<IssueItem>();
    public ICollection<Breakage> Breakages { get; set; } = new List<Breakage>();
}

// ─── Charger ─────────────────────────────────────────────────────────────────
public class Charger
{
    public int Id { get; set; }
    public string? ItemNumber { get; set; }                       // Aspera has no number
    public string Brand { get; set; } = string.Empty;
    public string Status { get; set; } = "Available";
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<IssueItem> IssueItems { get; set; } = new List<IssueItem>();
}

// ─── Kit (Earphone – Kenwood Only) ───────────────────────────────────────────
public class Kit
{
    public int Id { get; set; }
    public string ItemNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "Available";
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<IssueItem> IssueItems { get; set; } = new List<IssueItem>();
}

// ─── Issue (Header) ──────────────────────────────────────────────────────────
public class Issue
{
    public int Id { get; set; }
    public int VisitId { get; set; }
    public Visit Visit { get; set; } = null!;
    public int InchargeId { get; set; }
    public Incharge Incharge { get; set; } = null!;

    // For Vertel/Aspera group issuance
    public bool IsGroupIssue { get; set; } = false;
    public string? GroupName { get; set; }
    public int? GroupSetCount { get; set; }

    public string IssuedBy { get; set; } = string.Empty;          // Admin username
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReturnedAt { get; set; }
    public string Status { get; set; } = "Issued";                // Issued | Returned | Partial

    public string? Remarks { get; set; }

    // Collector (if another sewadar picks up)
    public int? CollectorId { get; set; }
    public Collector? Collector { get; set; }

    public ICollection<IssueItem> Items { get; set; } = new List<IssueItem>();
    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
    public ICollection<SmsLog> SmsLogs { get; set; } = new List<SmsLog>();
}

// ─── IssueItem (Line Items) ───────────────────────────────────────────────────
public class IssueItem
{
    public int Id { get; set; }
    public int IssueId { get; set; }
    public Issue Issue { get; set; } = null!;

    public string ItemType { get; set; } = string.Empty;          // WirelessSet | Charger | Kit

    public int? WirelessSetId { get; set; }
    public WirelessSet? WirelessSet { get; set; }

    public int? ChargerId { get; set; }
    public Charger? Charger { get; set; }

    public int? KitId { get; set; }
    public Kit? Kit { get; set; }

    public bool IsReturned { get; set; } = false;
    public DateTime? ReturnedAt { get; set; }
    public string? ReturnRemarks { get; set; }
}

// ─── Breakage ────────────────────────────────────────────────────────────────
public class Breakage
{
    public int Id { get; set; }
    public int VisitId { get; set; }
    public Visit Visit { get; set; } = null!;

    public int? WirelessSetId { get; set; }
    public WirelessSet? WirelessSet { get; set; }

    public string ItemNumber { get; set; } = string.Empty;
    public string BreakageReason { get; set; } = string.Empty;
    public string ReportedBy { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
}

// ─── Collector ───────────────────────────────────────────────────────────────
public class Collector
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string BadgeNumber { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
}

// ─── Photo ───────────────────────────────────────────────────────────────────
public class Photo
{
    public int Id { get; set; }
    public int IssueId { get; set; }
    public Issue Issue { get; set; } = null!;
    public string ImageUrl { get; set; } = string.Empty;          // Cloudinary URL
    public string? PublicId { get; set; }                         // Cloudinary public ID
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

// ─── SmsLog ───────────────────────────────────────────────────────────────────
public class SmsLog
{
    public int Id { get; set; }
    public int IssueId { get; set; }
    public Issue Issue { get; set; } = null!;
    public string MobileNumber { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;            // Sent | Failed
    public string? ErrorMessage { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
