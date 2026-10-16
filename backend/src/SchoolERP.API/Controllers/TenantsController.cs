using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/tenants")]
public class TenantsController(AppDbContext db) : ControllerBase
{
    [HttpGet("resolve/{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> Resolve(string code, CancellationToken ct)
    {
        var slug = code.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(slug)) return BadRequest(new { error = "School code is required" });

        var tenant = await db.Tenants
            .AsNoTracking()
            .Where(t => t.Slug == slug && t.IsActive && !t.IsDeleted)
            .Select(t => new
            {
                tenantId = t.Id,
                slug = t.Slug,
                tenantName = t.Name,
                school = t.Schools
                    .Where(s => !s.IsDeleted)
                    .Select(s => new
                    {
                        s.Id,
                        s.Name,
                        s.LogoUrl,
                        s.PrimaryColor,
                        s.Locale,
                        s.Currency,
                        s.TimeZone,
                        s.DefaultLanguage
                    })
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(ct);

        if (tenant?.school is null) return NotFound(new { error = "School not found" });
        return Ok(tenant);
    }
}
