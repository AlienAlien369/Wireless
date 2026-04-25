namespace RSSBWireless.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RSSBWireless.API.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductConfigController : ControllerBase
{
    private readonly ProductConfigService _config;
    private readonly AccessScopeService _scope;

    public ProductConfigController(ProductConfigService config, AccessScopeService scope)
    {
        _config = config;
        _scope = scope;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await _scope.RequireAdminUiAsync(User);
        return Ok(_config.GetSnapshot());
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] ProductConfigSnapshot dto)
    {
        await _scope.RequireAdminUiAsync(User);
        var next = _config.Update(dto);
        return Ok(next);
    }
}
