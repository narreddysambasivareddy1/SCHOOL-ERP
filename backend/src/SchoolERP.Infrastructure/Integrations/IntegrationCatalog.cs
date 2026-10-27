using System.Text.Json;
using SchoolERP.Domain.Entities;

namespace SchoolERP.Infrastructure.Integrations;

public static class IntegrationCatalog
{
    public static readonly IReadOnlyList<IntegrationDefinition> Defaults =
    [
        new("email", "Transactional email (SMTP)", """
            {
              "provider": "smtp",
              "host": "smtp.school-placeholder.invalid",
              "port": 587,
              "username": "noreply@school-placeholder.invalid",
              "password": "REPLACE_WITH_SCHOOL_SMTP_PASSWORD",
              "fromName": "Bright Future International School",
              "fromAddress": "noreply@school-placeholder.invalid",
              "useStartTls": true
            }
            """),
        new("sms", "SMS gateway", """
            {
              "provider": "msg91",
              "apiKey": "DUMMY_SMS_API_KEY_REPLACE_ME",
              "senderId": "SCHERP",
              "dltTemplateId": "DUMMY_DLT_TEMPLATE_ID",
              "countryCode": "91"
            }
            """),
        new("whatsapp", "WhatsApp Business (Meta Cloud)", """
            {
              "provider": "meta_cloud",
              "phoneNumberId": "000000000000000",
              "businessAccountId": "000000000000000",
              "accessToken": "DUMMY_WHATSAPP_ACCESS_TOKEN_REPLACE_ME",
              "templateName": "school_notice"
            }
            """),
        new("google_maps", "Google Maps Platform", """
            {
              "apiKey": "DUMMY_GOOGLE_MAPS_API_KEY_REPLACE_ME",
              "mapId": "DEMO_MAP_ID",
              "libraries": "places,geometry"
            }
            """),
        new("google_calendar", "Google Calendar / Workspace", """
            {
              "clientId": "dummy-google-client-id.apps.googleusercontent.com",
              "clientSecret": "DUMMY_GOOGLE_CLIENT_SECRET_REPLACE_ME",
              "calendarId": "primary"
            }
            """),
        new("payments", "Online fees (Razorpay test)", """
            {
              "provider": "razorpay",
              "keyId": "rzp_test_DUMMYKEYID",
              "keySecret": "DUMMY_RAZORPAY_KEY_SECRET_REPLACE_ME"
            }
            """),
        new("fcm", "Web / mobile push (FCM)", """
            {
              "projectId": "schoolerp-dummy",
              "serverKey": "DUMMY_FCM_SERVER_KEY_REPLACE_ME"
            }
            """)
    ];

    public static IntegrationSetting CreateSetting(Guid tenantId, Guid schoolId, IntegrationDefinition def) =>
        new()
        {
            TenantId = tenantId,
            SchoolId = schoolId,
            ProviderKey = def.Key,
            ProviderName = def.Name,
            IsEnabled = true,
            IsSandbox = true,
            ConfigJson = Compact(def.DummyConfigJson)
        };

    public static object ParseConfig(string configJson)
    {
        try
        {
            return JsonSerializer.Deserialize<object>(string.IsNullOrWhiteSpace(configJson) ? "{}" : configJson) ?? new { };
        }
        catch
        {
            return new { raw = "(invalid json)" };
        }
    }

    public static object MaskConfig(string configJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(configJson) ? "{}" : configJson);
            return MaskElement(doc.RootElement);
        }
        catch
        {
            return new { raw = "(invalid json)" };
        }
    }

    private static object MaskElement(JsonElement el)
    {
        if (el.ValueKind == JsonValueKind.Object)
        {
            var dict = new Dictionary<string, object?>();
            foreach (var p in el.EnumerateObject())
                dict[p.Name] = IsSecret(p.Name) ? MaskValue(p.Value.ToString()) : Unwrap(p.Value);
            return dict;
        }
        return Unwrap(el);
    }

    private static object Unwrap(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.String => el.GetString() ?? string.Empty,
        JsonValueKind.Number => el.TryGetInt64(out var n) ? n : el.GetDouble(),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.Object => MaskElement(el),
        JsonValueKind.Array => el.EnumerateArray().Select(Unwrap).ToArray(),
        JsonValueKind.Null or JsonValueKind.Undefined => string.Empty,
        _ => string.Empty
    };

    private static bool IsSecret(string name)
    {
        var n = name.ToLowerInvariant();
        return n.Contains("password") || n.Contains("secret") || n.Contains("token")
            || n.Contains("apikey") || n == "key" || n.EndsWith("key") || n.Contains("serverkey");
    }

    private static string MaskValue(string value)
    {
        if (string.IsNullOrEmpty(value) || value.Length < 6) return "••••";
        return $"{value[..3]}••••{value[^4..]}";
    }

    private static string Compact(string json) =>
        JsonSerializer.Serialize(JsonSerializer.Deserialize<JsonElement>(json));
}

public record IntegrationDefinition(string Key, string Name, string DummyConfigJson);
