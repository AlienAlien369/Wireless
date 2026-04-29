namespace RSSBWireless.API.Models;

public static class AssetStatus
{
    public const string Available = "Available";
    public const string Issued    = "Issued";
    public const string Broken    = "Broken";
}

public static class IssueStatus
{
    public const string Issued   = "Issued";
    public const string Returned = "Returned";
    public const string Partial  = "Partial";
}

public static class AssetTypeCodes
{
    public const string WirelessSet = "wireless-set";
    public const string Kit         = "kit";
    public const string Charger     = "charger";
}

public static class Roles
{
    public const string SuperAdmin = "SUPER_ADMIN";
    public const string CenterHead = "Center Head";
    public const string Admin      = "Admin";
    public const string Sewadaar   = "Sewadaar";
}
