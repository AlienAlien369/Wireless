namespace RSSBWireless.API.Controllers;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RSSBWireless.API.DTOs;
using RSSBWireless.API.Helpers;
using RSSBWireless.API.Models;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtHelper _jwt;

    public AuthController(UserManager<ApplicationUser> userManager, JwtHelper jwt)
    {
        _userManager = userManager; _jwt = jwt;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByNameAsync(dto.Username);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return Unauthorized(new { message = "Invalid credentials" });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is inactive" });

        return Ok(new AuthResponseDto(_jwt.GenerateToken(user), user.UserName!, user.Role, user.FullName));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var user = new ApplicationUser
        {
            UserName = dto.Username,
            Email = $"{dto.Username}@rssb.local",
            FullName = dto.FullName,
            Role = dto.Role,
            BadgeNumber = dto.BadgeNumber
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { message = "User created successfully" });
    }
}
