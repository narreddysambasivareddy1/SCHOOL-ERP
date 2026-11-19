using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.API.Authorization;
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
    [Authorize(Roles = RoleNames.AttendanceStaff)]
    public async Task<IActionResult> Mark(Guid schoolId, [FromBody] MarkAttendanceRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var entries = req.Entries?.ToList() ?? [];
        if (entries.Count == 0) return BadRequest(new { error = "Select at least one student." });
        if (entries.Select(e => e.StudentId).Distinct().Count() != entries.Count)
            return BadRequest(new { error = "Duplicate students in this attendance list." });

        if (!await BelongsToSchool(schoolId, tenantId, req.AcademicYearId, req.ClassId, req.SectionId, ct))
            return BadRequest(new { error = "Class, section, or academic year does not belong to this school." });

        if (!StudentAccess.IsLeadership(User) && !StudentAccess.InRole(User, "AttendanceOfficer"))
        {
            var userId = StudentAccess.UserId(User);
            var assigned = userId is not null && await db.TeacherAssignments.AnyAsync(a =>
                a.TenantId == tenantId && a.IsActive && a.CanTakeAttendance
                && a.AcademicYearId == req.AcademicYearId
                && a.ClassId == req.ClassId && a.SectionId == req.SectionId
                && a.Employee!.UserId == userId && a.Employee.SchoolId == schoolId && a.Employee.TenantId == tenantId
                && a.Class!.SchoolId == schoolId && a.Class.TenantId == tenantId
                && a.Section!.TenantId == tenantId && a.Section.ClassId == a.ClassId, ct);
            if (!assigned) return Forbid();
        }

        var studentIds = entries.Select(e => e.StudentId).ToList();
        var enrolledIds = await db.StudentEnrollments
            .Where(e => studentIds.Contains(e.StudentId) && e.TenantId == tenantId && e.EffectiveTo == null
                && e.AcademicYearId == req.AcademicYearId && e.ClassId == req.ClassId && e.SectionId == req.SectionId
                && e.Student!.SchoolId == schoolId && e.Student.TenantId == tenantId && !e.Student.IsDeleted
                && e.Class!.SchoolId == schoolId && e.Class.TenantId == tenantId
                && e.Section!.TenantId == tenantId && e.Section.ClassId == e.ClassId)
            .Select(e => e.StudentId)
            .Distinct()
            .ToListAsync(ct);
        if (enrolledIds.Count != studentIds.Count)
            return BadRequest(new { error = "One or more students are not enrolled in this section." });

        var existing = await db.AttendanceSessions.AnyAsync(s =>
            s.TenantId == tenantId && s.SchoolId == schoolId && s.ClassId == req.ClassId &&
            s.SectionId == req.SectionId && s.Date == req.Date, ct);
        if (existing)
            return Conflict(new { error = "Attendance already marked for this session. Use correction workflow." });

        var session = new AttendanceSession
        {
            TenantId = tenantId, SchoolId = schoolId,
            AcademicYearId = req.AcademicYearId, ClassId = req.ClassId,
            SectionId = req.SectionId, Date = req.Date, MarkedBy = actor,
            Records = entries.Select(e => new StudentAttendance
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
                .Where(sg => sg.TenantId == tenantId && sg.Guardian!.TenantId == tenantId
                    && absentIds.Contains(sg.StudentId) && sg.ReceivesNotifications
                    && sg.Student!.SchoolId == schoolId && sg.Student.TenantId == tenantId)
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
    [Authorize(Roles = RoleNames.AttendanceStaff)]
    public async Task<IActionResult> Get(Guid schoolId, [FromQuery] Guid classId,
        [FromQuery] Guid sectionId, [FromQuery] DateOnly date, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var classInSchool = await db.Classes.AnyAsync(c => c.Id == classId && c.SchoolId == schoolId && c.TenantId == tenantId, ct);
        var sectionInClass = await db.Sections.AnyAsync(s =>
            s.Id == sectionId && s.ClassId == classId && s.TenantId == tenantId && s.Class!.SchoolId == schoolId && s.Class.TenantId == tenantId, ct);
        if (!classInSchool || !sectionInClass) return NotFound();

        var session = await db.AttendanceSessions
            .Include(s => s.Records).ThenInclude(r => r.Student)
            .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.SchoolId == schoolId &&
                s.ClassId == classId && s.SectionId == sectionId && s.Date == date, ct);

        if (session is null) return NotFound();

        return Ok(new
        {
            session.Id, session.Date, session.MarkedBy,
            records = session.Records
                .Where(r => r.TenantId == tenantId && r.Student != null && r.Student.TenantId == tenantId && r.Student.SchoolId == schoolId && !r.Student.IsDeleted)
                .Select(r => new
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
        if (!await StudentAccess.CanReadStudent(db, User, schoolId, tenantId, studentId, ct))
            return Forbid();
        var records = await db.StudentAttendances
            .Where(r => r.TenantId == tenantId && r.StudentId == studentId
                && r.Student!.SchoolId == schoolId && r.Student.TenantId == tenantId
                && r.Session!.TenantId == tenantId && r.Session.SchoolId == schoolId
                && r.Session.Date >= from && r.Session.Date <= to)
            .Select(r => new { r.Session!.Date, r.Code })
            .ToListAsync(ct);

        var total = records.Count;
        var present = records.Count(r => r.Code == AttendanceCode.Present || r.Code == AttendanceCode.Late);
        var pct = total > 0 ? Math.Round((double)present / total * 100, 1) : 0;
        return Ok(new { total, present, percentage = pct, records });
    }

    private async Task<bool> BelongsToSchool(Guid schoolId, Guid tenantId, Guid academicYearId, Guid classId, Guid sectionId, CancellationToken ct)
    {
        var yearOk = await db.AcademicYears.AnyAsync(y => y.Id == academicYearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        var classOk = await db.Classes.AnyAsync(c => c.Id == classId && c.SchoolId == schoolId && c.TenantId == tenantId, ct);
        var sectionOk = await db.Sections.AnyAsync(s =>
            s.Id == sectionId && s.ClassId == classId && s.TenantId == tenantId
            && s.Class!.SchoolId == schoolId && s.Class.TenantId == tenantId, ct);
        return yearOk && classOk && sectionOk;
    }
}
