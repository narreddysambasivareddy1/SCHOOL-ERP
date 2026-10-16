using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Integrations;

namespace SchoolERP.API.Controllers;

public record UpdateIntegrationRequest(bool IsEnabled, bool IsSandbox, string ConfigJson);
public record TestIntegrationRequest(string? RecipientEmail, string? RecipientPhone);

[ApiController]
[Route("api/schools/{schoolId}/integrations")]
[Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin")]
public class IntegrationsController(AppDbContext db, INotificationService notifications, IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        await EnsureDefaults(tenantId, schoolId, ct);
        var rows = await db.IntegrationSettings
            .Where(s => s.SchoolId == schoolId && s.TenantId == tenantId)
            .OrderBy(s => s.ProviderName)
            .ToListAsync(ct);
        var items = rows.Select(s => new
        {
            s.Id, s.ProviderKey, s.ProviderName, s.IsEnabled, s.IsSandbox,
            config = s.IsSandbox
                ? IntegrationCatalog.ParseConfig(s.ConfigJson)
                : IntegrationCatalog.MaskConfig(s.ConfigJson)
        });
        return Ok(items);
    }

    [HttpPut("{providerKey}")]
    public async Task<IActionResult> Update(Guid schoolId, string providerKey, [FromBody] UpdateIntegrationRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var setting = await db.IntegrationSettings
            .FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.TenantId == tenantId && s.ProviderKey == providerKey, ct);
        if (setting is null) return NotFound();

        setting.IsEnabled = req.IsEnabled;
        setting.IsSandbox = req.IsSandbox;
        if (!string.IsNullOrWhiteSpace(req.ConfigJson))
            setting.ConfigJson = req.ConfigJson;
        setting.UpdatedBy = actor;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "IntegrationUpdated", "IntegrationSetting", setting.Id.ToString(),
            newValues: new { providerKey, req.IsEnabled, req.IsSandbox });
        return Ok(new
        {
            setting.ProviderKey, setting.IsEnabled, setting.IsSandbox,
            config = setting.IsSandbox
                ? IntegrationCatalog.ParseConfig(setting.ConfigJson)
                : IntegrationCatalog.MaskConfig(setting.ConfigJson)
        });
    }

    [HttpPost("{providerKey}/test")]
    public async Task<IActionResult> Test(Guid schoolId, string providerKey, [FromBody] TestIntegrationRequest? req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var setting = await db.IntegrationSettings
            .FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.TenantId == tenantId && s.ProviderKey == providerKey, ct);
        if (setting is null) return NotFound();

        var channel = providerKey switch
        {
            "email" => NotificationChannel.Email,
            "sms" => NotificationChannel.Sms,
            "whatsapp" => NotificationChannel.WhatsApp,
            "fcm" => NotificationChannel.WebPush,
            _ => NotificationChannel.InApp
        };

        var sent = await notifications.DispatchAsync(new NotificationDispatchRequest(
            tenantId, schoolId,
            "Sandbox integration test",
            $"Test message from School ERP via {setting.ProviderName}. No live provider was called.",
            [channel],
            [new NotificationRecipient("test", req?.RecipientEmail ?? "parent@school.edu", req?.RecipientPhone ?? "+910000000000", "Sandbox recipient")],
            "integration.test"), ct);

        return Ok(new { sandbox = setting.IsSandbox, dispatched = sent, message = "Logged in notification outbox. Live send starts when sandbox is off and real keys are saved." });
    }

    private async Task EnsureDefaults(Guid tenantId, Guid schoolId, CancellationToken ct)
    {
        var existing = await db.IntegrationSettings
            .Where(s => s.SchoolId == schoolId)
            .Select(s => s.ProviderKey)
            .ToListAsync(ct);
        foreach (var def in IntegrationCatalog.Defaults.Where(d => !existing.Contains(d.Key)))
            db.IntegrationSettings.Add(IntegrationCatalog.CreateSetting(tenantId, schoolId, def));
        if (db.ChangeTracker.HasChanges())
            await db.SaveChangesAsync(ct);
    }
}
