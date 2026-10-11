using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record RecordPaymentRequest(Guid StudentId, decimal Amount, string Method, string? Reference);

[ApiController]
[Route("api/schools/{schoolId}/fees")]
[Authorize]
public class FeesController(AppDbContext db, Application.Interfaces.IAuditService audit) : ControllerBase
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

        return Ok(new { payment.Id, payment.ReceiptNumber, payment.Amount, payment.Status });
    }
}
