namespace RSSBWireless.API.Services;

public class ProductConfigSnapshot
{
    public BrandingConfig Branding { get; set; } = new();
    public SmsConfig Sms { get; set; } = new();
    public FeatureFlagsConfig FeatureFlags { get; set; } = new();
    public List<string> CenterHeadRoles { get; set; } = new();
    public List<RoleDefaultConfig> RoleDefaults { get; set; } = new();
    public List<AssetVisibilityRuleConfig> AssetVisibilityRules { get; set; } = new();
    public List<DashboardWidgetConfig> DashboardWidgets { get; set; } = new();
}

public class BrandingConfig
{
    public string AppName { get; set; } = "AssetHub";
    public string DefaultCenterName { get; set; } = "Bhati Center";
}

public class SmsConfig
{
    public bool IssueEnabled { get; set; } = true;
    public bool ReceiveEnabled { get; set; } = true;
}

public class FeatureFlagsConfig
{
    public bool UnifiedAssetsEnabled { get; set; } = true;
    public bool LegacyWirelessEnabled { get; set; } = false;
    public bool QrAssetFlowEnabled { get; set; } = true;
}

public class RoleDefaultConfig
{
    public string Role { get; set; } = string.Empty;
    public bool SmsEnabled { get; set; } = true;
}

public class AssetVisibilityRuleConfig
{
    public int CenterId { get; set; }
    public int? DepartmentId { get; set; }
    public string Role { get; set; } = string.Empty;
    public int AssetTypeId { get; set; }
}

public class DashboardWidgetConfig
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}

public class ProductConfigService
{
    private readonly object _lock = new();
    private ProductConfigSnapshot _snapshot;

    public ProductConfigService(IConfiguration config)
    {
        _snapshot = new ProductConfigSnapshot();
        config.GetSection("ProductConfig").Bind(_snapshot);
        _snapshot.CenterHeadRoles ??= new List<string>();
        _snapshot.RoleDefaults ??= new List<RoleDefaultConfig>();
        _snapshot.AssetVisibilityRules ??= new List<AssetVisibilityRuleConfig>();
        _snapshot.DashboardWidgets ??= new List<DashboardWidgetConfig>();
    }

    public ProductConfigSnapshot GetSnapshot()
    {
        lock (_lock) return Clone(_snapshot);
    }

    public ProductConfigSnapshot Update(ProductConfigSnapshot next)
    {
        lock (_lock)
        {
            _snapshot = Clone(next);
            return Clone(_snapshot);
        }
    }

    public bool IsSmsEnabledForRole(string role)
    {
        var cfg = GetSnapshot();
        if (!cfg.Sms.IssueEnabled) return false;
        var roleCfg = cfg.RoleDefaults.FirstOrDefault(x => string.Equals(x.Role, role, StringComparison.OrdinalIgnoreCase));
        return roleCfg?.SmsEnabled ?? true;
    }

    private static ProductConfigSnapshot Clone(ProductConfigSnapshot src)
    {
        return new ProductConfigSnapshot
        {
            Branding = new BrandingConfig
            {
                AppName = src.Branding.AppName,
                DefaultCenterName = src.Branding.DefaultCenterName
            },
            Sms = new SmsConfig
            {
                IssueEnabled = src.Sms.IssueEnabled,
                ReceiveEnabled = src.Sms.ReceiveEnabled,
            },
            FeatureFlags = new FeatureFlagsConfig
            {
                UnifiedAssetsEnabled = src.FeatureFlags.UnifiedAssetsEnabled,
                LegacyWirelessEnabled = src.FeatureFlags.LegacyWirelessEnabled,
                QrAssetFlowEnabled = src.FeatureFlags.QrAssetFlowEnabled,
            },
            CenterHeadRoles = src.CenterHeadRoles.ToList(),
            RoleDefaults = src.RoleDefaults.Select(x => new RoleDefaultConfig { Role = x.Role, SmsEnabled = x.SmsEnabled }).ToList(),
            AssetVisibilityRules = src.AssetVisibilityRules.Select(x => new AssetVisibilityRuleConfig
            {
                CenterId = x.CenterId,
                DepartmentId = x.DepartmentId,
                Role = x.Role,
                AssetTypeId = x.AssetTypeId
            }).ToList(),
            DashboardWidgets = src.DashboardWidgets.Select(x => new DashboardWidgetConfig { Key = x.Key, Label = x.Label, Enabled = x.Enabled }).ToList(),
        };
    }
}
