using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.API.Authorization;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;

namespace SchoolERP.API.Controllers;

public record ApplyLeaveRequest(Guid EmployeeId, Guid LeaveTypeId, DateOnly FromDate, DateOnly ToDate, string? Reason);

[ApiController]
[Route("api/schools/{schoolId}/leave")]
[Authorize]
public class LeaveController(AppDbContext db, IAuditService audit, INotificationService notifications, AcademicOpsService ops) : ControllerBase
{
    [HttpGet("types")]
    public async Task<IActionResult> GetTypes(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        if (!await db.LeaveTypes.AnyAsync(l => l.SchoolId == schoolId && l.TenantId == tenantId, ct))
        {
            db.LeaveTypes.AddRange(
                new LeaveType { TenantId = tenantId, SchoolId = schoolId, Name = "Casual Leave", MaxDaysPerYear = 12 },
                new LeaveType { TenantId = tenantId, SchoolId = schoolId, Name = "Sick Leave", MaxDaysPerYear = 10 },
                new LeaveType { TenantId = tenantId, SchoolId = schoolId, Name = "Earned Leave", MaxDaysPerYear = 15, IsCarryForward = true });
            await db.SaveChangesAsync(ct);
        }
        var types = await db.LeaveTypes
            .Where(l => l.SchoolId == schoolId && l.TenantId == tenantId)
            .Select(l => new { l.Id, l.Name, l.MaxDaysPerYear, l.IsCarryForward })
            .ToListAsync(ct);
        return Ok(types);
    }

    [HttpPost("apply")]
    [Authorize(Roles = RoleNames.LeaveApply)]
    public async Task<IActionResult> Apply(Guid schoolId, [FromBody] ApplyLeaveRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        if (req.FromDate > req.ToDate || req.ToDate.DayNumber - req.FromDate.DayNumber > 90)
            return BadRequest(new { error = "Leave dates must be valid and cannot span more than 91 days." });

        var employeeId = req.EmployeeId;
        var canApplyForOthers = User.IsInRole("SchoolAdmin") || User.IsInRole("PlatformSuperAdmin") || User.IsInRole("HRManager");
        if (canApplyForOthers && employeeId == Guid.Empty)
            return BadRequest(new { error = "Select the staff member this leave is for." });
        if (!canApplyForOthers)
        {
            if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId)) return Forbid();
            var ownEmployeeId = await db.Employees.Where(e => e.UserId == userId &&
                    e.SchoolId == schoolId && e.TenantId == tenantId)
                .Select(e => (Guid?)e.Id).FirstOrDefaultAsync(ct);
            if (ownEmployeeId is null || (employeeId != Guid.Empty && employeeId != ownEmployeeId))
                return Forbid();
            employeeId = ownEmployeeId.Value;
        }

        var valid = await db.Employees.AnyAsync(e => e.Id == employeeId &&
                e.SchoolId == schoolId && e.TenantId == tenantId && e.Status == EmployeeStatus.Active, ct)
            && await db.LeaveTypes.AnyAsync(l => l.Id == req.LeaveTypeId &&
                l.SchoolId == schoolId && l.TenantId == tenantId, ct);
        if (!valid) return BadRequest(new { error = "Employee or leave type is not valid for this school." });

        var leave = new LeaveRequest
        {
            TenantId = tenantId, EmployeeId = employeeId,
            LeaveTypeId = req.LeaveTypeId, FromDate = req.FromDate,
            ToDate = req.ToDate, Reason = req.Reason,
            Status = "Pending", CreatedBy = actor
        };
        db.LeaveRequests.Add(leave);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "LeaveApplied", "LeaveRequest", leave.Id.ToString(),
            newValues: new { EmployeeId = employeeId, req.FromDate, req.ToDate });
        return Ok(new { leave.Id, leave.Status });
    }

    [HttpPost("{leaveId}/approve")]
    [Authorize(Roles = RoleNames.LeaveDecide)]
    public async Task<IActionResult> Approve(Guid schoolId, Guid leaveId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var leave = await db.LeaveRequests.FirstOrDefaultAsync(l => l.Id == leaveId &&
            l.TenantId == tenantId && l.Employee!.SchoolId == schoolId &&
            l.Employee.TenantId == tenantId, ct);
        if (leave is null) return NotFound();
        if (leave.Status != "Pending") return Conflict(new { error = "Leave is not in Pending status." });
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        leave.Status = "Approved";
        leave.ApprovedBy = actor;
        leave.ApprovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        var opened = await ops.OpenSubstitutionsForLeaveAsync(schoolId, tenantId, leave, ct);
        await transaction.CommitAsync(ct);
        await audit.LogAsync(tenantId, actor, "LeaveApproved", "LeaveRequest", leaveId.ToString());
        await NotifyLeaveAsync(tenantId, schoolId, leave, "approved", ct);
        return Ok(new { leaveId, status = "Approved", substitutionsOpened = opened });
    }

    [HttpPost("{leaveId}/reject")]
    [Authorize(Roles = RoleNames.LeaveDecide)]
    public async Task<IActionResult> Reject(Guid schoolId, Guid leaveId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var leave = await db.LeaveRequests.FirstOrDefaultAsync(l => l.Id == leaveId &&
            l.TenantId == tenantId && l.Employee!.SchoolId == schoolId &&
            l.Employee.TenantId == tenantId, ct);
        if (leave is null) return NotFound();
        if (leave.Status != "Pending") return Conflict(new { error = "Leave is not in Pending status." });
        leave.Status = "Rejected";
        leave.ApprovedBy = actor;
        leave.ApprovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "LeaveRejected", "LeaveRequest", leaveId.ToString());
        await NotifyLeaveAsync(tenantId, schoolId, leave, "rejected", ct);
        return Ok(new { leaveId, status = "Rejected" });
    }

    [HttpGet("requests")]
    [Authorize(Roles = RoleNames.LeaveApply)]
    public async Task<IActionResult> GetRequests(Guid schoolId, [FromQuery] string? status, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var query = db.LeaveRequests
            .Where(l => l.TenantId == tenantId && l.Employee!.SchoolId == schoolId &&
                l.Employee.TenantId == tenantId)
            .Include(l => l.Employee)
            .Include(l => l.LeaveType)
            .AsQueryable();
        var canReviewAll = User.IsInRole("SchoolAdmin") || User.IsInRole("PlatformSuperAdmin") || User.IsInRole("HRManager");
        if (!canReviewAll)
        {
            var userId = StudentAccess.UserId(User);
            if (userId is null) return Forbid();
            query = query.Where(l => l.Employee!.UserId == userId);
        }
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(l => l.Status == status);
        var list = await query.OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.Id,
                employee = $"{l.Employee!.FirstName} {l.Employee.LastName}",
                leaveType = l.LeaveType!.Name,
                l.FromDate, l.ToDate, l.Status, l.Reason
            })
            .ToListAsync(ct);
        return Ok(list);
    }

    private async Task NotifyLeaveAsync(Guid tenantId, Guid schoolId, LeaveRequest leave, string outcome, CancellationToken ct)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == leave.EmployeeId &&
            e.TenantId == tenantId && e.SchoolId == schoolId, ct)
            ?? throw new InvalidOperationException("Leave employee was not found in this school.");
        await notifications.DispatchAsync(new NotificationDispatchRequest(
            tenantId, schoolId,
            $"Leave {outcome}",
            $"Your leave from {leave.FromDate:dd MMM} to {leave.ToDate:dd MMM} was {outcome}.",
            [NotificationChannel.Email, NotificationChannel.InApp],
            [new NotificationRecipient(employee.Id.ToString(), employee.Email, employee.Phone, $"{employee.FirstName} {employee.LastName}")],
            "leave.decision"), ct);
    }
}
