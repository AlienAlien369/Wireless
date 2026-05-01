namespace RSSBWireless.API.Models;

public class AssetType
{
    public int Id { get; set; }
    public int CenterId { get; set; }
    public Center Center { get; set; } = null!;

    public string Code { get; set; } = string.Empty; // stable key, e.g. "wheelchair"
    public string Name { get; set; } = string.Empty; // display label
    public string TrackingMode { get; set; } = "Individual"; // Individual | Group
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}

public class Asset
{
    public int Id { get; set; }
    public int CenterId { get; set; }
    public Center Center { get; set; } = null!;

    public int AssetTypeId { get; set; }
    public AssetType AssetType { get; set; } = null!;

    public string? ItemNumber { get; set; } // optional for unnumbered assets
    public string? Brand { get; set; }
    public string Status { get; set; } = "Available"; // Available | Issued | Broken
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<IssueItem> IssueItems { get; set; } = new List<IssueItem>();
}

