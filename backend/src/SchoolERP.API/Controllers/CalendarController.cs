using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.API.Authorization;
using SchoolERP.Domain.Entities;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record SaveCalendarEventRequest(string Title, string? Description, DateOnly EventDate, string? Kind, bool RequiresConsent);

[ApiController]
[Route("api/schools/{schoolId:guid}/calendar")]
[Authorize]
public class CalendarController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid schoolId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var schoolOk = await db.Schools.AnyAsync(s => s.Id == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);
        if (!schoolOk) return NotFound();
        var query = db.CalendarEvents.Where(e => e.TenantId == tenantId && e.SchoolId == schoolId && !e.IsDeleted);
        if (from is not null) query = query.Where(e => e.EventDate >= from);
        if (to is not null) query = query.Where(e => e.EventDate <= to);
        var items = await query.OrderBy(e => e.EventDate)
            .Select(e => new { e.Id, e.Title, e.Description, e.EventDate, e.Kind, e.RequiresConsent })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Leadership + ",Teacher")]
    public async Task<IActionResult> Create(Guid schoolId, [FromBody] SaveCalendarEventRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Title)) return BadRequest(new { error = "A title is required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var schoolOk = await db.Schools.AnyAsync(s => s.Id == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);
        if (!schoolOk) return NotFound();
        var kind = string.IsNullOrWhiteSpace(req.Kind) ? "Event" : req.Kind.Trim();
        if (kind is not ("Event" or "Holiday" or "Activity"))
            return BadRequest(new { error = "Kind must be Event, Holiday, or Activity." });
        var item = new CalendarEvent
        {
            TenantId = tenantId,
            SchoolId = schoolId,
            Title = req.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
            EventDate = req.EventDate,
            Kind = kind,
            RequiresConsent = req.RequiresConsent,
            CreatedBy = User.FindFirstValue("email") ?? User.FindFirstValue(ClaimTypes.Email)
        };
        db.CalendarEvents.Add(item);
        await db.SaveChangesAsync(ct);
        return Ok(new { item.Id, item.Title, item.EventDate, item.Kind, item.RequiresConsent });
    }
}
