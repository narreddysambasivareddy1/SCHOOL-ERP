using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Services;

public class NotificationService(AppDbContext db, IConfiguration config, ILogger<NotificationService> log) : INotificationService
{
    public async Task<int> DispatchAsync(NotificationDispatchRequest request, CancellationToken ct = default)
    {
        if (request.Recipients.Count == 0 || request.Channels.Count == 0) return 0;

        var settings = await db.IntegrationSettings
            .Where(s => s.SchoolId == request.SchoolId && s.TenantId == request.TenantId)
            .ToListAsync(ct);

        var count = 0;
        foreach (var recipient in request.Recipients)
        {
            foreach (var channel in request.Channels)
            {
                var (providerKey, address) = Resolve(channel, recipient);
                if (string.IsNullOrWhiteSpace(address) && channel != NotificationChannel.InApp)
                    continue;

                var setting = settings.FirstOrDefault(s => s.ProviderKey == providerKey);
                var sandbox = setting?.IsSandbox != false
                    || string.Equals(config["Integrations:Mode"], "Sandbox", StringComparison.OrdinalIgnoreCase);
                var enabled = setting?.IsEnabled ?? channel == NotificationChannel.InApp;

                var msg = new NotificationMessage
                {
                    TenantId = request.TenantId,
                    SchoolId = request.SchoolId,
                    Title = request.Title,
                    Body = request.Body,
                    Channel = channel,
                    RecipientRef = $"{recipient.Ref}|{address}",
                    TemplateKey = request.TemplateKey,
                    Provider = providerKey,
                    Status = enabled ? (sandbox ? "SandboxSent" : "Queued") : "Skipped",
                    SentAt = enabled ? DateTime.UtcNow : null,
                    ProviderMessageId = enabled ? $"dummy_{channel.ToString().ToLowerInvariant()}_{Guid.NewGuid():N}" : null,
                    ErrorDetails = enabled
                        ? (sandbox ? "Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials." : null)
                        : "Channel disabled in school integrations."
                };
                db.NotificationMessages.Add(msg);
                count++;
            }
        }

        await db.SaveChangesAsync(ct);
        log.LogInformation("Dispatched {Count} notification rows for {Template} school {SchoolId}",
            count, request.TemplateKey, request.SchoolId);
        return count;
    }

    private static (string ProviderKey, string? Address) Resolve(NotificationChannel channel, NotificationRecipient recipient) =>
        channel switch
        {
            NotificationChannel.Email => ("email", recipient.Email),
            NotificationChannel.Sms => ("sms", recipient.Phone),
            NotificationChannel.WhatsApp => ("whatsapp", recipient.Phone),
            NotificationChannel.WebPush => ("fcm", recipient.Ref),
            _ => ("inapp", recipient.Ref)
        };
}
