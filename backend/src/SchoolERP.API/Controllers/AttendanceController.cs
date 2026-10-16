using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record MarkAttendanceRequest(Guid AcademicYearId, Guid ClassId, Guid SectionId, DateOnly Date,
    IEnumerable<StudentAttendanceEntry> Entries);
public record StudentAttendanceEntry(Guid StudentId, AttendanceCode Code, string? Remarks);

[ApiController]
[Route("api/schools/{schoolId}/attendance")]
[Authorize]
public class AttendanceController(AppDbContext db, Application.Interfaces.IAuditService audit, Application.Interfaces.INotificationService notifications) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "SchoolAdmin,Teacher,AttendanceOfficer")]
    public async Task<IActionResult> Mark(Guid schoolId, [FromBody] MarkAttendanceRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";

        var existing = await db.AttendanceSessions.FirstOrDefaultAsync(s =>
            s.SchoolId == schoolId && s.ClassId == req.ClassId &&
            s.SectionId == req.SectionId && s.Date == req.Date, ct);

        if (existing is not null)
            return Conflict(new { error = "Attendance already marked for this session. Use correction workflow." });

        var session = new AttendanceSession
        {
            TenantId = tenantId, SchoolId = schoolId,
            AcademicYearId = req.AcademicYearId, ClassId = req.ClassId,
            SectionId = req.SectionId, Date = req.Date, MarkedBy = actor,
            Records = req.Entries.Select(e => new StudentAttendance
            {
                TenantId = tenantId, StudentId = e.StudentId,
                Code = e.Code, Remarks = e.Remarks, CreatedBy = actor
            }).ToList()
        };

        db.AttendanceSessions.Add(session);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "AttendanceMarked", "AttendanceSession", session.Id.ToString(),
            newValues: new { req.ClassId, req.SectionId, req.Date, Count = session.Records.Count });

        var absentIds = session.Records.Where(r => r.Code == AttendanceCode.Absent).Select(r => r.StudentId).ToList();
        if (absentIds.Count > 0)
        {
            var recipients = await db.StudentGuardians
                .Where(sg => absentIds.Contains(sg.StudentId) && sg.ReceivesNotifications)
                .Select(sg => new Application.Interfaces.NotificationRecipient(
                    sg.GuardianId.ToString(), sg.Guardian!.Email, sg.Guardian.Phone,
                    sg.Guardian.FirstName + " " + sg.Guardian.LastName))
                .ToListAsync(ct);
            await notifications.DispatchAsync(new Application.Interfaces.NotificationDispatchRequest(
                tenantId, schoolId, "Absence alert",
                $"Your child was marked absent on {req.Date:dd MMM yyyy}.",
                [NotificationChannel.Sms, NotificationChannel.WhatsApp, NotificationChannel.InApp],
                recipients, "attendance.absent"), ct);
        }

        return Ok(new { sessionId = session.Id, recordsMarked = session.Records.Count });
    }

    [HttpGet]
    public async Task<IActionResult> Get(Guid schoolId, [FromQuery] Guid classId,
        [FromQuery] Guid sectionId, [FromQuery] DateOnly date, CancellationToken ct)
    {
        var session = await db.AttendanceSessions
            .Include(s => s.Records).ThenInclude(r => r.Student)
            .FirstOrDefaultAsync(s => s.SchoolId == schoolId &&
                s.ClassId == classId && s.SectionId == sectionId && s.Date == date, ct);

        if (session is null) return NotFound();

        return Ok(new
        {
            session.Id, session.Date, session.MarkedBy,
            records = session.Records.Select(r => new
            {
                r.StudentId,
                studentName = $"{r.Student!.FirstName} {r.Student.LastName}",
                r.Code, r.Remarks
            })
        });
    }

    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetStudentAttendance(Guid schoolId, Guid studentId,
        [FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var records = await db.StudentAttendances
            .Include(r => r.Session)
            .Where(r => r.StudentId == studentId &&
                r.Session!.SchoolId == schoolId &&
                r.Session.TenantId == tenantId &&
                r.Session.Date >= from &&
                r.Session.Date <= to)
            .Select(r => new { r.Session!.Date, r.Code })
            .ToListAsync(ct);

        var total = records.Count;
        var present = records.Count(r => r.Code == AttendanceCode.Present || r.Code == AttendanceCode.Late);
        var pct = total > 0 ? Math.Round((double)present / total * 100, 1) : 0;
        return Ok(new { total, present, percentage = pct, records });
    }
}
