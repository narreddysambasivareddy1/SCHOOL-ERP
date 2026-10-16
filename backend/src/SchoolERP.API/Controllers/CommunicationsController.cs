using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record SendAnnouncementRequest(string Title, string Body, string Audience, IEnumerable<string> Channels);

[ApiController]
[Route("api/schools/{schoolId}/communications")]
[Authorize]
public class CommunicationsController(AppDbContext db, INotificationService notifications, IAuditService audit) : ControllerBase
{
    [HttpGet("announcements")]
    public async Task<IActionResult> Announcements(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var items = await db.SchoolAnnouncements
            .Where(a => a.SchoolId == schoolId && a.TenantId == tenantId)
            .OrderByDescending(a => a.PublishedAt)
            .Select(a => new { a.Id, a.Title, a.Body, a.Audience, a.Channels, a.PublishedAt, a.PublishedBy })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("outbox")]
    [Authorize(Roles = "SchoolAdmin,Teacher")]
    public async Task<IActionResult> Outbox(Guid schoolId, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        take = Math.Clamp(take, 1, 200);
        var items = await db.NotificationMessages
            .Where(n => n.SchoolId == schoolId && n.TenantId == tenantId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .Select(n => new
            {
                n.Id, n.Title, n.Channel, n.Status, n.RecipientRef, n.Provider,
                n.ProviderMessageId, n.TemplateKey, n.SentAt, n.ErrorDetails
            })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost("announcements")]
    [Authorize(Roles = "SchoolAdmin,Teacher")]
    public async Task<IActionResult> Send(Guid schoolId, [FromBody] SendAnnouncementRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.Body))
            return BadRequest(new { error = "Title and body are required." });

        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var channels = ParseChannels(req.Channels);
        var recipients = await ResolveAudience(tenantId, schoolId, req.Audience, ct);

        var announcement = new SchoolAnnouncement
        {
            TenantId = tenantId, SchoolId = schoolId,
            Title = req.Title.Trim(), Body = req.Body.Trim(),
            Audience = req.Audience, Channels = string.Join(",", channels),
            PublishedAt = DateTime.UtcNow, PublishedBy = actor, CreatedBy = actor
        };
        db.SchoolAnnouncements.Add(announcement);
        await db.SaveChangesAsync(ct);

        var dispatched = await notifications.DispatchAsync(new NotificationDispatchRequest(
            tenantId, schoolId, announcement.Title, announcement.Body, channels, recipients, "announcement"), ct);

        await audit.LogAsync(tenantId, actor, "AnnouncementSent", "SchoolAnnouncement", announcement.Id.ToString(),
            newValues: new { announcement.Audience, dispatched });

        return Ok(new { announcement.Id, recipients = recipients.Count, dispatched, sandbox = true });
    }

    private static List<NotificationChannel> ParseChannels(IEnumerable<string> raw)
    {
        var list = new List<NotificationChannel>();
        foreach (var c in raw)
        {
            if (Enum.TryParse<NotificationChannel>(c, true, out var ch) && !list.Contains(ch))
                list.Add(ch);
        }
        if (list.Count == 0) list.Add(NotificationChannel.InApp);
        return list;
    }

    private async Task<List<NotificationRecipient>> ResolveAudience(Guid tenantId, Guid schoolId, string audience, CancellationToken ct)
    {
        var key = (audience ?? "All").Trim().ToLowerInvariant();
        if (key.Contains("staff") || key.Contains("teacher"))
        {
            return await db.Employees
                .Where(e => e.SchoolId == schoolId && e.TenantId == tenantId)
                .Select(e => new NotificationRecipient(e.Id.ToString(), e.Email, e.Phone, e.FirstName + " " + e.LastName))
                .ToListAsync(ct);
        }

        if (key.Contains("student"))
        {
            return await db.Students
                .Where(s => s.SchoolId == schoolId && s.TenantId == tenantId)
                .Select(s => new NotificationRecipient(s.Id.ToString(), s.User != null ? s.User.Email : null, null, s.FirstName + " " + s.LastName))
                .ToListAsync(ct);
        }

        return await db.StudentGuardians
            .Where(sg => sg.TenantId == tenantId && sg.ReceivesNotifications && sg.Student!.SchoolId == schoolId)
            .Select(sg => new NotificationRecipient(
                sg.GuardianId.ToString(),
                sg.Guardian!.Email,
                sg.Guardian.Phone,
                sg.Guardian.FirstName + " " + sg.Guardian.LastName))
            .ToListAsync(ct);
    }
}
