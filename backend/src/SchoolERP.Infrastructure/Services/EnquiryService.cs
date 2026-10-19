using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Services;

public class EnquiryService(AppDbContext db, INotificationService notifications, IConfiguration config) : IEnquiryService
{
    public const int OtpWindowMinutes = 15;
    public const int MaxOtpRequests = 3;
    public const int OtpTtlMinutes = 5;

    public async Task<EnquiryOtpRequestResult> RequestOtpAsync(string schoolCode, EnquiryOtpRequest request, string ipAddress, CancellationToken ct = default)
    {
        var phone = NormalizePhone(request.Phone);
        if (phone.Length is < 10 or > 15) throw new InvalidOperationException("Enter a valid mobile number.");
        if (string.IsNullOrWhiteSpace(request.ParentName)) throw new InvalidOperationException("Parent name is required.");
        if (string.IsNullOrWhiteSpace(request.Message)) throw new InvalidOperationException("Message is required.");
        if (string.IsNullOrWhiteSpace(request.Email) || !IsValidEmail(request.Email))
            throw new InvalidOperationException("Enter a valid email address.");

        var school = await ResolveSchool(schoolCode, ct);
        var since = DateTime.UtcNow.AddMinutes(-OtpWindowMinutes);
        var recent = await db.EnquiryOtpChallenges.CountAsync(c =>
            c.SchoolId == school.SchoolId && c.CreatedAt >= since &&
            (c.Phone == phone || c.IpAddress == ipAddress), ct);
        if (recent >= MaxOtpRequests)
            throw new InvalidOperationException("Too many OTP requests. Try again after 15 minutes.");

        var kind = ParseKind(request.Kind);
        var otp = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var challenge = new EnquiryOtpChallenge
        {
            TenantId = school.TenantId,
            SchoolId = school.SchoolId,
            Phone = phone,
            IpAddress = ipAddress,
            CodeHash = BCrypt.Net.BCrypt.HashPassword(otp),
            ExpiresAt = DateTime.UtcNow.AddMinutes(OtpTtlMinutes),
            PayloadJson = JsonSerializer.Serialize(new EnquiryPayload(
                kind, request.ParentName, phone, request.Email, request.StudentName, request.GradeInterested, request.Message))
        };
        db.EnquiryOtpChallenges.Add(challenge);
        await db.SaveChangesAsync(ct);

        await notifications.DispatchAsync(new NotificationDispatchRequest(
            school.TenantId, school.SchoolId,
            "Enquiry verification OTP",
            $"Your Bright Future verification code is {otp}. It expires in {OtpTtlMinutes} minutes.",
            [NotificationChannel.Sms, NotificationChannel.WhatsApp],
            [new NotificationRecipient(phone, null, phone, request.ParentName)],
            "enquiry.otp"), ct);

        var sandbox = string.Equals(config["Integrations:Mode"], "Sandbox", StringComparison.OrdinalIgnoreCase);
        return new EnquiryOtpRequestResult(challenge.Id, challenge.ExpiresAt, sandbox ? otp : null);
    }

    public async Task<EnquiryListItem> VerifyOtpAsync(EnquiryVerifyRequest request, string ipAddress, CancellationToken ct = default)
    {
        var challenge = await db.EnquiryOtpChallenges.FirstOrDefaultAsync(c => c.Id == request.ChallengeId, ct);
        if (challenge is null || challenge.ConsumedAt is not null)
            throw new InvalidOperationException("OTP session not found. Request a new code.");
        if (challenge.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("OTP expired. Request a new code.");
        if (challenge.VerifyAttempts >= 5)
            throw new InvalidOperationException("Too many incorrect attempts. Request a new code.");

        challenge.VerifyAttempts++;
        if (!BCrypt.Net.BCrypt.Verify((request.Otp ?? "").Trim(), challenge.CodeHash))
        {
            await db.SaveChangesAsync(ct);
            throw new InvalidOperationException("Incorrect OTP.");
        }

        var payload = JsonSerializer.Deserialize<EnquiryPayload>(challenge.PayloadJson, JsonOpts)
            ?? throw new InvalidOperationException("Enquiry payload missing.");

        challenge.ConsumedAt = DateTime.UtcNow;
        var enquiry = new Enquiry
        {
            TenantId = challenge.TenantId,
            SchoolId = challenge.SchoolId,
            Kind = payload.Kind,
            Status = EnquiryStatus.New,
            ParentName = payload.ParentName,
            Phone = payload.Phone,
            Email = payload.Email,
            StudentName = payload.StudentName,
            GradeInterested = payload.GradeInterested,
            Message = payload.Message,
            Source = "Website",
            VerifiedAt = DateTime.UtcNow
        };
        enquiry.Activities.Add(new EnquiryActivity
        {
            TenantId = challenge.TenantId,
            ActorName = "OTP verification",
            Action = "Verified",
            NewStatus = nameof(EnquiryStatus.New),
            Note = $"Verified from IP {ipAddress}"
        });
        db.Enquiries.Add(enquiry);
        await db.SaveChangesAsync(ct);

        await AlertStaffAsync(enquiry, ct);
        return await MapItem(enquiry.Id, ct);
    }

    public async Task<IReadOnlyList<EnquiryListItem>> ListAsync(Guid schoolId, Guid tenantId, string? status, string? kind, CancellationToken ct = default)
    {
        var q = db.Enquiries.Where(e => e.SchoolId == schoolId && e.TenantId == tenantId);
        var statusKey = (status ?? "").Replace("Verified/New", "New", StringComparison.OrdinalIgnoreCase).Replace(" ", "");
        if (!string.IsNullOrWhiteSpace(statusKey) && Enum.TryParse<EnquiryStatus>(statusKey, true, out var st)
            && st != EnquiryStatus.Unverified)
            q = q.Where(e => e.Status == st);
        if (!string.IsNullOrWhiteSpace(kind) && Enum.TryParse<EnquiryKind>(kind, true, out var k))
            q = q.Where(e => e.Kind == k);

        var rows = await q.Include(e => e.AssignedTo).OrderByDescending(e => e.CreatedAt).Take(200).ToListAsync(ct);
        return rows.Select(Map).ToList();
    }

    public async Task<EnquiryDetail?> GetAsync(Guid schoolId, Guid tenantId, Guid enquiryId, CancellationToken ct = default)
    {
        var enquiry = await db.Enquiries.Include(e => e.AssignedTo)
            .FirstOrDefaultAsync(e => e.Id == enquiryId && e.SchoolId == schoolId && e.TenantId == tenantId, ct);
        if (enquiry is null) return null;
        var acts = await db.EnquiryActivities.Where(a => a.EnquiryId == enquiryId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new EnquiryActivityDto(a.Id, a.ActorName, a.Action, a.Note, a.OldStatus, a.NewStatus, a.CreatedAt))
            .ToListAsync(ct);
        return new EnquiryDetail(Map(enquiry), acts);
    }

    public async Task<EnquiryListItem> AssignAsync(Guid schoolId, Guid tenantId, Guid enquiryId, Guid assignedToUserId, Guid actorId, string actorName, CancellationToken ct = default)
    {
        var enquiry = await Require(schoolId, tenantId, enquiryId, ct);
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == assignedToUserId && u.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("Staff member not found.");
        enquiry.AssignedToUserId = user.Id;
        db.EnquiryActivities.Add(new EnquiryActivity
        {
            TenantId = tenantId, EnquiryId = enquiry.Id, ActorUserId = actorId, ActorName = actorName,
            Action = "Assigned", Note = $"Assigned to {user.FirstName} {user.LastName}"
        });
        await db.SaveChangesAsync(ct);
        return await MapItem(enquiry.Id, ct);
    }

    public async Task<EnquiryListItem> UpdateStatusAsync(Guid schoolId, Guid tenantId, Guid enquiryId, string status, DateOnly? followUpOn, Guid actorId, string actorName, CancellationToken ct = default)
    {
        var enquiry = await Require(schoolId, tenantId, enquiryId, ct);
        var statusKey = (status ?? "").Replace("Verified/New", "New", StringComparison.OrdinalIgnoreCase).Replace(" ", "");
        if (!Enum.TryParse<EnquiryStatus>(statusKey, true, out var next) || next is EnquiryStatus.Unverified)
            throw new InvalidOperationException("Invalid enquiry status.");
        var old = enquiry.Status.ToString();
        enquiry.Status = next;
        enquiry.FollowUpOn = followUpOn ?? enquiry.FollowUpOn;
        db.EnquiryActivities.Add(new EnquiryActivity
        {
            TenantId = tenantId, EnquiryId = enquiry.Id, ActorUserId = actorId, ActorName = actorName,
            Action = "StatusChange", OldStatus = old, NewStatus = next.ToString()
        });
        await db.SaveChangesAsync(ct);
        return await MapItem(enquiry.Id, ct);
    }

    public async Task AddNoteAsync(Guid schoolId, Guid tenantId, Guid enquiryId, string note, string action, Guid actorId, string actorName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(note)) throw new InvalidOperationException("Note is required.");
        var enquiry = await Require(schoolId, tenantId, enquiryId, ct);
        db.EnquiryActivities.Add(new EnquiryActivity
        {
            TenantId = tenantId, EnquiryId = enquiry.Id, ActorUserId = actorId, ActorName = actorName,
            Action = string.IsNullOrWhiteSpace(action) ? "Call" : action, Note = note.Trim()
        });
        await db.SaveChangesAsync(ct);
    }

    private async Task AlertStaffAsync(Enquiry enquiry, CancellationToken ct)
    {
        var staff = await db.Users.Where(u => u.TenantId == enquiry.TenantId && u.IsActive)
            .Select(u => new
            {
                u.Id, u.Email, u.FirstName, u.LastName,
                roles = u.UserRoles.Select(r => r.Role!.Name)
            })
            .ToListAsync(ct);
        var desk = staff.Where(u => u.roles.Any(r => r is "FrontOffice" or "SchoolAdmin" or "AdmissionOfficer")).ToList();
        var recipients = desk.Select(u => new NotificationRecipient(u.Id.ToString(), u.Email, config["Integrations:FrontOfficeDeskPhone"] ?? "+910000000000", $"{u.FirstName} {u.LastName}")).ToList();
        if (recipients.Count == 0) return;
        await notifications.DispatchAsync(new NotificationDispatchRequest(
            enquiry.TenantId, enquiry.SchoolId,
            $"New {enquiry.Kind} enquiry",
            $"{enquiry.ParentName} ({enquiry.Phone}) — {enquiry.Message}",
            [NotificationChannel.Email, NotificationChannel.WhatsApp, NotificationChannel.WebPush, NotificationChannel.InApp],
            recipients, "enquiry.verified"), ct);
    }

    private async Task<Enquiry> Require(Guid schoolId, Guid tenantId, Guid enquiryId, CancellationToken ct) =>
        await db.Enquiries.FirstOrDefaultAsync(e => e.Id == enquiryId && e.SchoolId == schoolId && e.TenantId == tenantId, ct)
        ?? throw new InvalidOperationException("Enquiry not found.");

    private async Task<EnquiryListItem> MapItem(Guid id, CancellationToken ct)
    {
        var e = await db.Enquiries.Include(x => x.AssignedTo).FirstAsync(x => x.Id == id, ct);
        return Map(e);
    }

    private static EnquiryListItem Map(Enquiry e) => new(
        e.Id, e.TenantId, e.SchoolId, e.Kind.ToString(), e.Status == EnquiryStatus.New ? "Verified/New" : e.Status.ToString(),
        e.ParentName, e.Phone, e.Email, e.StudentName, e.GradeInterested, e.Message, e.Source,
        e.AssignedToUserId, e.AssignedTo is null ? null : $"{e.AssignedTo.FirstName} {e.AssignedTo.LastName}",
        e.FollowUpOn, e.VerifiedAt, e.CreatedAt);

    private async Task<(Guid TenantId, Guid SchoolId)> ResolveSchool(string schoolCode, CancellationToken ct)
    {
        var slug = (schoolCode ?? "").Trim().ToLowerInvariant();
        var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive, ct)
            ?? throw new InvalidOperationException("School code not found.");
        var school = await db.Schools.AsNoTracking().FirstOrDefaultAsync(s => s.TenantId == tenant.Id, ct)
            ?? throw new InvalidOperationException("School not found.");
        return (tenant.Id, school.Id);
    }

    private static EnquiryKind ParseKind(string? kind)
    {
        var k = (kind ?? "").Trim();
        if (k.Contains("Fee", StringComparison.OrdinalIgnoreCase)) return EnquiryKind.Fees;
        if (k.Contains("General", StringComparison.OrdinalIgnoreCase) || k.Contains("Transport", StringComparison.OrdinalIgnoreCase))
            return EnquiryKind.General;
        return EnquiryKind.Admission;
    }

    private static string NormalizePhone(string? phone) =>
        new string((phone ?? "").Where(char.IsDigit).ToArray());

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email.Trim());
            return addr.Address.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase)
                   && email.Contains('.') && !email.Contains(' ');
        }
        catch
        {
            return false;
        }
    }

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private sealed record EnquiryPayload(EnquiryKind Kind, string ParentName, string Phone, string? Email, string? StudentName, string? GradeInterested, string Message);
}
