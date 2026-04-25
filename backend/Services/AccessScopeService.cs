namespace RSSBWireless.API.Services;

using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Data;

public class AccessScope
{
    public string UserId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Audience { get; set; } = "Incharge";
    public int? CenterId { get; set; }
    public int? DepartmentId { get; set; }
    public bool IsGlobalAdmin { get; set; }
    public bool IsCenterHead { get; set; }
}

public class AccessScopeService
{
    private readonly AppDbContext _db;
    private readonly ProductConfigService _config;

    public AccessScopeService(AppDbContext db, ProductConfigService config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AccessScope?> GetScopeAsync(ClaimsPrincipal user)
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return null;

        var appUser = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (appUser == null) return null;

        var roleName = (appUser.Role ?? string.Empty).Trim();
        var appRole = await _db.AppRoles.FirstOrDefaultAsync(x => x.Name == roleName && x.IsActive);
        var audience = appRole?.Audience ?? (string.Equals(roleName, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Incharge");
        var isCenterHead = _config.GetSnapshot().CenterHeadRoles.Any(x => string.Equals(x, roleName, StringComparison.OrdinalIgnoreCase));

        return new AccessScope
        {
            UserId = appUser.Id,
            Role = roleName,
            Audience = audience,
            CenterId = appUser.CenterId,
            DepartmentId = appUser.DepartmentId,
            IsGlobalAdmin = string.Equals(roleName, "Admin", StringComparison.OrdinalIgnoreCase),
            IsCenterHead = isCenterHead,
        };
    }

    public async Task<AccessScope> RequireAdminUiAsync(ClaimsPrincipal user)
    {
        var scope = await GetScopeAsync(user) ?? throw new UnauthorizedAccessException("Unauthorized");
        if (!string.Equals(scope.Audience, "Admin", StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Admin audience required");
        return scope;
    }

    public void EnsureCenterAccess(AccessScope scope, int centerId)
    {
        if (scope.IsGlobalAdmin) return;
        if (scope.CenterId == null || scope.CenterId.Value != centerId)
            throw new UnauthorizedAccessException("Cross-center access denied");
    }

    public void EnsureDepartmentAccess(AccessScope scope, int? departmentId)
    {
        if (scope.IsGlobalAdmin || scope.IsCenterHead) return;
        if (departmentId != null && scope.DepartmentId != departmentId)
            throw new UnauthorizedAccessException("Cross-department access denied");
    }
}
