namespace RSSBWireless.API.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Helpers;
using RSSBWireless.API.Models;
using System.Security.Cryptography;
using System.Text;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtHelper _jwt;
    private readonly AppDbContext _db;
    private readonly SmsHelper _sms;
    private readonly EmailHelper _email;

    public AuthController(UserManager<ApplicationUser> userManager, JwtHelper jwt, AppDbContext db, SmsHelper sms, EmailHelper email)
    {
        _userManager = userManager;
        _jwt = jwt;
        _db = db;
        _sms = sms;
        _email = email;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.Users
            .Include(x => x.Center)
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x => x.UserName == dto.Username);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return Unauthorized(new { message = "Invalid credentials" });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is inactive" });

        return Ok(new AuthResponseDto(
            _jwt.GenerateToken(user),
            user.UserName!,
            user.Role,
            user.FullName,
            user.CenterId,
            user.Center?.Name,
            user.DepartmentId,
            user.Department?.Name
        ));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var roleName = (dto.Role ?? "").Trim();
        if (!await _db.AppRoles.AnyAsync(x => x.Name == roleName && x.IsActive))
            return BadRequest(new { message = "Invalid role" });

        if (dto.CenterId != null && !await _db.Centers.AnyAsync(x => x.Id == dto.CenterId))
            return BadRequest(new { message = "Invalid centerId" });
        if (dto.DepartmentId != null && !await _db.Departments.AnyAsync(x => x.Id == dto.DepartmentId))
            return BadRequest(new { message = "Invalid departmentId" });

        var user = new ApplicationUser
        {
            UserName = dto.Username,
            Email = $"{dto.Username}@rssb.local",
            FullName = dto.FullName,
            Role = roleName,
            BadgeNumber = dto.BadgeNumber,
            CenterId = dto.CenterId,
            DepartmentId = dto.DepartmentId
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { message = "User created successfully" });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var identifier = (dto.Identifier ?? "").Trim();
        if (string.IsNullOrWhiteSpace(identifier)) return BadRequest(new { message = "Identifier is required" });

        var user = await _userManager.Users.FirstOrDefaultAsync(x =>
            x.UserName == identifier || x.Email == identifier || x.PhoneNumber == identifier);

        // Always respond OK to avoid account enumeration.
        if (user == null) return Ok(new { message = "If the account exists, an OTP has been sent." });

        // Basic throttling: max 3 OTPs per 15 minutes per user.
        var since = DateTime.UtcNow.AddMinutes(-15);
        var recentCount = await _db.PasswordResetRequests.CountAsync(x => x.UserId == user.Id && x.CreatedAt >= since);
        if (recentCount >= 3) return Ok(new { message = "If the account exists, an OTP has been sent." });

        var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(12));
        var hash = ComputeSha256($"{salt}:{otp}");

        var req = new PasswordResetRequest
        {
            UserId = user.Id,
            OtpSalt = salt,
            OtpHash = hash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            SentToEmail = false,
            SentToPhone = false
        };
        _db.PasswordResetRequests.Add(req);
        await _db.SaveChangesAsync();

        var sentAny = false;
        var msg = $"RSSB Wireless OTP: {otp}. Valid for 10 minutes.";

        if (!string.IsNullOrWhiteSpace(user.PhoneNumber))
        {
            var (success, _) = await _sms.SendSmsAsync(user.PhoneNumber, msg);
            req.SentToPhone = success;
            sentAny = sentAny || success;
        }

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            var (success, _) = await _email.SendEmailAsync(user.Email, "Password Reset OTP", msg);
            req.SentToEmail = success;
            sentAny = sentAny || success;
        }

        await _db.SaveChangesAsync();

        return Ok(new { message = sentAny ? "If the account exists, an OTP has been sent." : "If the account exists, an OTP has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var identifier = (dto.Identifier ?? "").Trim();
        var otp = (dto.Otp ?? "").Trim();
        if (string.IsNullOrWhiteSpace(identifier)) return BadRequest(new { message = "Identifier is required" });
        if (string.IsNullOrWhiteSpace(otp)) return BadRequest(new { message = "Otp is required" });
        if (string.IsNullOrWhiteSpace(dto.NewPassword)) return BadRequest(new { message = "NewPassword is required" });

        var user = await _userManager.Users.FirstOrDefaultAsync(x =>
            x.UserName == identifier || x.Email == identifier || x.PhoneNumber == identifier);
        if (user == null) return BadRequest(new { message = "Invalid OTP" });

        var now = DateTime.UtcNow;
        var req = await _db.PasswordResetRequests
            .Where(x => x.UserId == user.Id && x.UsedAt == null && x.ExpiresAt >= now)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (req == null) return BadRequest(new { message = "Invalid OTP" });

        var computed = ComputeSha256($"{req.OtpSalt}:{otp}");
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(req.OtpHash), Encoding.UTF8.GetBytes(computed)))
            return BadRequest(new { message = "Invalid OTP" });

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, resetToken, dto.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);

        req.UsedAt = now;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Password reset successfully" });
    }

    private static string ComputeSha256(string input)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToBase64String(bytes);
    }
}
