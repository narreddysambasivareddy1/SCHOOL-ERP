using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Infrastructure.Data;
using System.Security.Claims;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin")]
public class AuditController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? entityType, [FromQuery] string? actor,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        if (pageSize > 200) pageSize = 200;
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);

        var query = db.AuditEvents.Where(e => e.TenantId == tenantId).AsQueryable();
        if (!string.IsNullOrWhiteSpace(entityType)) query = query.Where(e => e.EntityType == entityType);
        if (!string.IsNullOrWhiteSpace(actor)) query = query.Where(e => e.Actor.Contains(actor));
        if (from.HasValue) query = query.Where(e => e.OccurredAt >= from.Value);
        if (to.HasValue) query = query.Where(e => e.OccurredAt <= to.Value);

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(e => e.OccurredAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(e => new { e.Id, e.Actor, e.Action, e.EntityType, e.EntityId, e.OccurredAt, e.IpAddress })
            .ToListAsync(ct);

        return Ok(new { items, totalCount = total, page, pageSize });
    }
}
