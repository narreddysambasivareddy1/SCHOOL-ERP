using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/schools/{schoolId}/dashboard")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(Guid schoolId, [FromQuery] Guid academicYearId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTime.UtcNow;

        var studentCount = await db.StudentEnrollments
            .Where(e => e.TenantId == tenantId && e.AcademicYearId == academicYearId
                && e.EffectiveTo == null)
            .Join(db.Students.Where(s => s.SchoolId == schoolId),
                e => e.StudentId, s => s.Id, (e, s) => e)
            .CountAsync(ct);

        var staffCount = await db.Employees
            .CountAsync(e => e.TenantId == tenantId && e.SchoolId == schoolId
                && e.Status == EmployeeStatus.Active, ct);

        var todaySessions = await db.AttendanceSessions
            .Include(s => s.Records)
            .Where(s => s.TenantId == tenantId && s.SchoolId == schoolId && s.Date == today)
            .ToListAsync(ct);

        int totalRecords = todaySessions.SelectMany(s => s.Records).Count();
        int presentRecords = todaySessions.SelectMany(s => s.Records)
            .Count(r => r.Code == AttendanceCode.Present || r.Code == AttendanceCode.Late);
        double attendancePct = totalRecords > 0 ? Math.Round((double)presentRecords / totalRecords * 100, 1) : 0;

        var feeTotal = await db.Payments
            .Where(p => p.TenantId == tenantId && p.SchoolId == schoolId
                && p.Status == PaymentStatus.Successful
                && p.PaidAt.HasValue
                && p.PaidAt.Value.Month == now.Month
                && p.PaidAt.Value.Year == now.Year)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0;

        var enquiryNew = await db.Enquiries.CountAsync(e =>
            e.TenantId == tenantId && e.SchoolId == schoolId && e.Status == EnquiryStatus.New, ct);
        var enquiryOpen = await db.Enquiries.CountAsync(e =>
            e.TenantId == tenantId && e.SchoolId == schoolId
            && e.Status != EnquiryStatus.Converted && e.Status != EnquiryStatus.Rejected, ct);

        var from = today.AddDays(-6);
        var week = await db.AttendanceSessions
            .Where(s => s.TenantId == tenantId && s.SchoolId == schoolId && s.Date >= from && s.Date <= today)
            .SelectMany(s => s.Records.Select(r => new { s.Date, r.Code }))
            .ToListAsync(ct);
        var attendanceTrend = week
            .GroupBy(x => x.Date)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var total = g.Count();
                var present = g.Count(x => x.Code == AttendanceCode.Present || x.Code == AttendanceCode.Late);
                return new { date = g.Key, pct = total == 0 ? 0 : Math.Round((double)present / total * 100, 1) };
            })
            .ToList();

        return Ok(new
        {
            studentCount,
            staffCount,
            attendancePct,
            attendanceMarked = totalRecords > 0,
            feeCollectedThisMonth = feeTotal,
            enquiryNew,
            enquiryOpen,
            attendanceTrend
        });
    }
}
