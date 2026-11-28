using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.API.Authorization;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record RecordPaymentRequest(Guid StudentId, Guid AcademicYearId, decimal Amount, string Method, string? Reference);
public record FeeCategoryRequest(string Name);
public record UpsertFeeStructureRequest(Guid AcademicYearId, Guid ClassId, Guid FeeCategoryId, decimal Amount);
public record OnlineOrderRequest(Guid StudentId, Guid AcademicYearId, decimal Amount);

[ApiController]
[Route("api/schools/{schoolId}/fees")]
[Authorize]
public class FeesController(AppDbContext db, Application.Interfaces.IAuditService audit, Application.Interfaces.INotificationService notifications) : ControllerBase
{
    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetStudentPayments(Guid schoolId, Guid studentId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        if (!await StudentAccess.CanReadFees(db, User, schoolId, tenantId, studentId, ct))
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
        if (!await StudentAccess.CanReadFees(db, User, schoolId, tenantId, studentId, ct))
            return Forbid();

        var classId = await db.StudentEnrollments
            .Where(e => e.StudentId == studentId && e.AcademicYearId == academicYearId && e.TenantId == tenantId && e.EffectiveTo == null
                && e.Student!.SchoolId == schoolId && e.Student.TenantId == tenantId
                && e.Class!.SchoolId == schoolId && e.Class.TenantId == tenantId
                && e.Section!.TenantId == tenantId && e.Section.ClassId == e.ClassId)
            .Select(e => (Guid?)e.ClassId)
            .FirstOrDefaultAsync(ct);
        var yearOk = await db.AcademicYears.AnyAsync(y => y.Id == academicYearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        if (!yearOk) return NotFound();
        if (classId is null) return Ok(new { items = Array.Empty<object>(), total = 0m, paid = 0m, outstanding = 0m });

        var items = await db.FeeStructures
            .Where(f => f.SchoolId == schoolId && f.TenantId == tenantId && f.AcademicYearId == academicYearId && f.ClassId == classId
                && f.FeeCategory!.SchoolId == schoolId && f.FeeCategory.TenantId == tenantId)
            .Select(f => new { category = f.FeeCategory!.Name, f.Amount })
            .ToListAsync(ct);
        var scheduled = items.Sum(i => i.Amount);
        var paid = await db.Payments
            .Where(p => p.SchoolId == schoolId && p.TenantId == tenantId && p.StudentId == studentId
                && p.AcademicYearId == academicYearId && p.Status == PaymentStatus.Successful)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;
        return Ok(new { items, total = scheduled, paid, outstanding = scheduled - paid });
    }

    [HttpGet("categories")]
    [Authorize(Roles = RoleNames.FeesStaff)]
    public async Task<IActionResult> Categories(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var items = await db.FeeCategories
            .Where(c => c.SchoolId == schoolId && c.TenantId == tenantId && !c.IsDeleted)
            .OrderBy(c => c.Name)
            .Select(c => new { c.Id, c.Name })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost("categories")]
    [Authorize(Roles = RoleNames.FeesStaff)]
    public async Task<IActionResult> SaveCategory(Guid schoolId, [FromBody] FeeCategoryRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { error = "Fee category name is required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var name = req.Name.Trim();
        var exists = await db.FeeCategories.AnyAsync(c => c.SchoolId == schoolId && c.TenantId == tenantId && c.Name == name, ct);
        if (exists) return Conflict(new { error = "That fee category already exists." });
        var row = new FeeCategory { TenantId = tenantId, SchoolId = schoolId, Name = name };
        db.FeeCategories.Add(row);
        await db.SaveChangesAsync(ct);
        return Ok(new { row.Id, row.Name });
    }

    [HttpGet("structures")]
    [Authorize(Roles = RoleNames.FeesStaff)]
    public async Task<IActionResult> Structures(Guid schoolId, [FromQuery] Guid academicYearId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var yearOk = await db.AcademicYears.AnyAsync(y => y.Id == academicYearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        if (!yearOk) return NotFound();
        var items = await (
            from f in db.FeeStructures
            join c in db.Classes on f.ClassId equals c.Id
            where f.SchoolId == schoolId && f.TenantId == tenantId && f.AcademicYearId == academicYearId
                && c.SchoolId == schoolId && c.TenantId == tenantId
                && f.FeeCategory!.SchoolId == schoolId && f.FeeCategory.TenantId == tenantId
            select new { f.Id, f.ClassId, className = c.Name, f.FeeCategoryId, category = f.FeeCategory!.Name, f.Amount })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost("structures")]
    [Authorize(Roles = RoleNames.FeesStaff)]
    public async Task<IActionResult> SaveStructure(Guid schoolId, [FromBody] UpsertFeeStructureRequest req, CancellationToken ct)
    {
        if (req.Amount <= 0) return BadRequest(new { error = "Fee amount must be greater than zero." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var yearOk = await db.AcademicYears.AnyAsync(y => y.Id == req.AcademicYearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        var classOk = await db.Classes.AnyAsync(c => c.Id == req.ClassId && c.SchoolId == schoolId && c.TenantId == tenantId, ct);
        var categoryOk = await db.FeeCategories.AnyAsync(c => c.Id == req.FeeCategoryId && c.SchoolId == schoolId && c.TenantId == tenantId, ct);
        if (!yearOk || !classOk || !categoryOk)
            return BadRequest(new { error = "Year, class, or fee category does not belong to this school." });

        var row = await db.FeeStructures.FirstOrDefaultAsync(f =>
            f.TenantId == tenantId && f.SchoolId == schoolId && f.AcademicYearId == req.AcademicYearId
            && f.ClassId == req.ClassId && f.FeeCategoryId == req.FeeCategoryId, ct);
        if (row is null)
        {
            row = new FeeStructure
            {
                TenantId = tenantId, SchoolId = schoolId, AcademicYearId = req.AcademicYearId,
                ClassId = req.ClassId, FeeCategoryId = req.FeeCategoryId, Amount = req.Amount
            };
            db.FeeStructures.Add(row);
        }
        else row.Amount = req.Amount;
        await db.SaveChangesAsync(ct);
        return Ok(new { row.Id, row.Amount });
    }

    [HttpPost("record")]
    [Authorize(Roles = RoleNames.FeesStaff)]
    public async Task<IActionResult> RecordPayment(Guid schoolId, [FromBody] RecordPaymentRequest req, CancellationToken ct)
    {
        if (req.Amount <= 0) return BadRequest(new { error = "Amount must be greater than zero." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        if (!await StudentEnrolledInYear(schoolId, tenantId, req.StudentId, req.AcademicYearId, ct))
            return BadRequest(new { error = "Student is not enrolled in this academic year at this school." });

        var receipt = $"RCT-{DateTime.UtcNow:yyyyMMddHHmmss}-{req.StudentId.ToString()[..8]}";

        var payment = new Payment
        {
            TenantId = tenantId, SchoolId = schoolId,
            StudentId = req.StudentId, AcademicYearId = req.AcademicYearId, Amount = req.Amount,
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
        if (!await StudentEnrolledInYear(schoolId, tenantId, req.StudentId, req.AcademicYearId, ct))
            return BadRequest(new { error = "Student is not enrolled in this academic year at this school." });
        var payCfg = await db.IntegrationSettings
            .FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.ProviderKey == "payments", ct);

        var orderId = $"order_sandbox_{Guid.NewGuid():N}";
        var payment = new Payment
        {
            TenantId = tenantId, SchoolId = schoolId, StudentId = req.StudentId, AcademicYearId = req.AcademicYearId,
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

    private async Task<bool> StudentEnrolledInYear(Guid schoolId, Guid tenantId, Guid studentId, Guid academicYearId, CancellationToken ct)
    {
        var yearOk = await db.AcademicYears.AnyAsync(y => y.Id == academicYearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        if (!yearOk) return false;
        return await db.StudentEnrollments.AnyAsync(e =>
            e.StudentId == studentId && e.AcademicYearId == academicYearId && e.TenantId == tenantId && e.EffectiveTo == null
            && e.Student!.SchoolId == schoolId && e.Student.TenantId == tenantId && !e.Student.IsDeleted
            && e.Class!.SchoolId == schoolId && e.Class.TenantId == tenantId
            && e.Section!.TenantId == tenantId && e.Section.ClassId == e.ClassId, ct);
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
