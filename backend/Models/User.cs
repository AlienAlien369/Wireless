// Models/User.cs
namespace RSSBWireless.API.Models;

using Microsoft.AspNetCore.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin"; // Admin | Incharge
    public string? BadgeNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
