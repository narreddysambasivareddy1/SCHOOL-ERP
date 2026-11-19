using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.API.Authorization;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record RecordPaymentRequest(Guid StudentId, decimal Amount, string Method, string? Reference);
public record OnlineOrderRequest(Guid StudentId, decimal Amount);

[ApiController]
[Route("api/schools/{schoolId}/fees")]
[Authorize]
public class FeesController(AppDbContext db, Application.Interfaces.IAuditService audit, Application.Interfaces.INotificationService notifications) : ControllerBase
{
    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetStudentPayments(Guid schoolId, Guid studentId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        if (!await StudentAccess.CanReadStudent(db, User, schoolId, tenantId, studentId, ct))
            return Forbid();

        var payments = await db.Payments
            .Where(p => p.SchoolId == schoolId && p.TenantId == tenantId && p.StudentId == studentId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new { p.Id, p.Amount, p.Status, p.Method, p.ReceiptNumber, p.PaidAt })
            .ToListAsync(ct);
        return Ok(payments.Select(p => new
        {
            p.Id, p.Amount, status = p.Status.ToString(), p.Method, p.ReceiptNumber, p.PaidAt
        }));
    }

    [HttpGet("student/{studentId}/schedule")]
    public async Task<IActionResult> Schedule(Guid schoolId, Guid studentId, [FromQuery] Guid academicYearId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        if (!await StudentAccess.CanReadStudent(db, User, schoolId, tenantId, studentId, ct))
            return Forbid();

        var classId = await db.StudentEnrollments
            .Where(e => e.StudentId == studentId && e.AcademicYearId == academicYearId && e.TenantId == tenantId && e.EffectiveTo == null)
            .Select(e => (Guid?)e.ClassId)
            .FirstOrDefaultAsync(ct);
        if (classId is null) return Ok(new { items = Array.Empty<object>(), total = 0m });

        var items = await db.FeeStructures
            .Where(f => f.SchoolId == schoolId && f.TenantId == tenantId && f.AcademicYearId == academicYearId && f.ClassId == classId)
            .Select(f => new { category = f.FeeCategory!.Name, f.Amount })
            .ToListAsync(ct);
        return Ok(new { items, total = items.Sum(i => i.Amount) });
    }

    [HttpPost("record")]
    [Authorize(Roles = RoleNames.FeesStaff)]
    public async Task<IActionResult> RecordPayment(Guid schoolId, [FromBody] RecordPaymentRequest req, CancellationToken ct)
    {
        if (req.Amount <= 0) return BadRequest(new { error = "Amount must be greater than zero." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var studentOk = await db.Students.AnyAsync(s =>
            s.Id == req.StudentId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);
        if (!studentOk) return BadRequest(new { error = "Student was not found in this school." });

        var receipt = $"RCT-{DateTime.UtcNow:yyyyMMddHHmmss}-{req.StudentId.ToString()[..8]}";

        var payment = new Payment
        {
            TenantId = tenantId, SchoolId = schoolId,
            StudentId = req.StudentId, Amount = req.Amount,
            Method = req.Method, Status = PaymentStatus.Successful,
            ReceiptNumber = receipt, PaidAt = DateTime.UtcNow,
            CreatedBy = actor
        };

        db.Payments.Add(payment);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "PaymentRecorded", "Payment", payment.Id.ToString(),
            newValues: new { payment.Amount, payment.Method, payment.ReceiptNumber });

        await NotifyPaymentAsync(tenantId, schoolId, req.StudentId, payment.Amount, payment.ReceiptNumber, ct);
        return Ok(new { payment.Id, payment.ReceiptNumber, payment.Amount, status = payment.Status.ToString() });
    }

    [HttpPost("online-order")]
    [Authorize(Roles = RoleNames.FeesStaff)]
    public async Task<IActionResult> CreateOnlineOrder(Guid schoolId, [FromBody] OnlineOrderRequest req, CancellationToken ct)
    {
        if (req.Amount <= 0) return BadRequest(new { error = "Amount must be greater than zero." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var studentOk = await db.Students.AnyAsync(s =>
            s.Id == req.StudentId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);
        if (!studentOk) return BadRequest(new { error = "Student was not found in this school." });
        var payCfg = await db.IntegrationSettings
            .FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.ProviderKey == "payments", ct);

        var orderId = $"order_sandbox_{Guid.NewGuid():N}";
        var payment = new Payment
        {
            TenantId = tenantId, SchoolId = schoolId, StudentId = req.StudentId,
            Amount = req.Amount, Method = "Online (sandbox)", Status = PaymentStatus.Initiated,
            GatewayOrderId = orderId, CreatedBy = actor
        };
        db.Payments.Add(payment);
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            paymentId = payment.Id,
            orderId,
            amount = req.Amount,
            sandbox = payCfg?.IsSandbox != false,
            message = "Sandbox payment order. A live charge starts only after the school merchant account is connected."
        });
    }

    private async Task NotifyPaymentAsync(Guid tenantId, Guid schoolId, Guid studentId, decimal amount, string? receipt, CancellationToken ct)
    {
        var recipients = await db.StudentGuardians
            .Where(sg => sg.StudentId == studentId && sg.ReceivesNotifications)
            .Select(sg => new Application.Interfaces.NotificationRecipient(
                sg.GuardianId.ToString(), sg.Guardian!.Email, sg.Guardian.Phone,
                sg.Guardian.FirstName + " " + sg.Guardian.LastName))
            .ToListAsync(ct);
        if (recipients.Count == 0) return;
        await notifications.DispatchAsync(new Application.Interfaces.NotificationDispatchRequest(
            tenantId, schoolId, "Fee receipt",
            $"Payment of {amount} recorded. Receipt {receipt}.",
            [NotificationChannel.Email, NotificationChannel.Sms, NotificationChannel.InApp],
            recipients, "fees.receipt"), ct);
    }
}
