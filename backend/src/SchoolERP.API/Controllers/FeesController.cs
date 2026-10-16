using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        var payments = await db.Payments
            .Where(p => p.SchoolId == schoolId && p.StudentId == studentId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new { p.Id, p.Amount, p.Status, p.Method, p.ReceiptNumber, p.PaidAt })
            .ToListAsync(ct);
        return Ok(payments);
    }

    [HttpPost("record")]
    [Authorize(Roles = "SchoolAdmin,Accountant")]
    public async Task<IActionResult> RecordPayment(Guid schoolId, [FromBody] RecordPaymentRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";

        var count = await db.Payments.CountAsync(p => p.SchoolId == schoolId, ct);
        var receipt = $"RCT-{DateTime.UtcNow.Year}-{count + 1:D4}";

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
        return Ok(new { payment.Id, payment.ReceiptNumber, payment.Amount, payment.Status });
    }

    [HttpPost("online-order")]
    public async Task<IActionResult> CreateOnlineOrder(Guid schoolId, [FromBody] OnlineOrderRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
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
            keyId = "rzp_test_DUMMYKEYID",
            message = "Sandbox payment order. Replace payments keyId/keySecret when the school merchant account is ready."
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
