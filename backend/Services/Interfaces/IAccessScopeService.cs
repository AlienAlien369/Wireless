namespace RSSBWireless.API.Services.Interfaces;

using System.Security.Claims;

public interface IAccessScopeService
{
    Task<AccessScope?> GetScopeAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default);
    Task<AccessScope> RequireAdminUiAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default);
    void EnsureCenterAccess(AccessScope scope, int centerId);
    void EnsureDepartmentAccess(AccessScope scope, int? departmentId);
}
