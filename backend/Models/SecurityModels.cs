namespace RSSBWireless.API.Models;

public class AppRole
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. Admin, Incharge, Supervisor
    public string Audience { get; set; } = "Admin";  // Admin | Incharge (drives UI shell)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PasswordResetRequest
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public string OtpSalt { get; set; } = string.Empty;
    public string OtpHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }

    public bool SentToEmail { get; set; }
    public bool SentToPhone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

