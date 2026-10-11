using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.DTOs;
using SchoolERP.Application.Interfaces;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, [FromHeader(Name = "X-Tenant-Id")] Guid tenantId, CancellationToken ct)
    {
        if (tenantId == Guid.Empty) return BadRequest(new { error = "X-Tenant-Id header is required" });
        var result = await authService.LoginAsync(request, tenantId, ct);
        if (result is null) return Unauthorized(new { error = "Invalid credentials" });
        return Ok(result);
    }
}
