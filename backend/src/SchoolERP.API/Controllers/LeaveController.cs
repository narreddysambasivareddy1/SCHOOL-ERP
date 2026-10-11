using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record ApplyLeaveRequest(Guid EmployeeId, Guid LeaveTypeId, DateOnly FromDate, DateOnly ToDate, string? Reason);

[ApiController]
[Route("api/schools/{schoolId}/leave")]
[Authorize]
public class LeaveController(AppDbContext db, Application.Interfaces.IAuditService audit) : ControllerBase
{
    [HttpGet("types")]
    public async Task<IActionResult> GetTypes(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var types = await db.LeaveTypes
            .Where(l => l.SchoolId == schoolId && l.TenantId == tenantId)
            .Select(l => new { l.Id, l.Name, l.MaxDaysPerYear, l.IsCarryForward })
            .ToListAsync(ct);
        return Ok(types);
    }

    [HttpPost("apply")]
    public async Task<IActionResult> Apply(Guid schoolId, [FromBody] ApplyLeaveRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";

        var leave = new LeaveRequest
        {
            TenantId = tenantId, EmployeeId = req.EmployeeId,
            LeaveTypeId = req.LeaveTypeId, FromDate = req.FromDate,
            ToDate = req.ToDate, Reason = req.Reason,
            Status = "Pending", CreatedBy = actor
        };
        db.LeaveRequests.Add(leave);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "LeaveApplied", "LeaveRequest", leave.Id.ToString(),
            newValues: new { req.EmployeeId, req.FromDate, req.ToDate });
        return Ok(new { leave.Id, leave.Status });
    }

    [HttpPost("{leaveId}/approve")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Approve(Guid schoolId, Guid leaveId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var leave = await db.LeaveRequests.FirstOrDefaultAsync(l => l.Id == leaveId && l.TenantId == tenantId, ct);
        if (leave is null) return NotFound();
        if (leave.Status != "Pending") return Conflict(new { error = "Leave is not in Pending status." });
        leave.Status = "Approved";
        leave.ApprovedBy = actor;
        leave.ApprovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "LeaveApproved", "LeaveRequest", leaveId.ToString());
        return Ok(new { leaveId, status = "Approved" });
    }

    [HttpPost("{leaveId}/reject")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Reject(Guid schoolId, Guid leaveId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var leave = await db.LeaveRequests.FirstOrDefaultAsync(l => l.Id == leaveId && l.TenantId == tenantId, ct);
        if (leave is null) return NotFound();
        leave.Status = "Rejected";
        leave.ApprovedBy = actor;
        leave.ApprovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "LeaveRejected", "LeaveRequest", leaveId.ToString());
        return Ok(new { leaveId, status = "Rejected" });
    }

    [HttpGet("requests")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> GetRequests(Guid schoolId, [FromQuery] string? status, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var query = db.LeaveRequests
            .Where(l => l.TenantId == tenantId)
            .Include(l => l.Employee)
            .Include(l => l.LeaveType)
            .AsQueryable();
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
}
