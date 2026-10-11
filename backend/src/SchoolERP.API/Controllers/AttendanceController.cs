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
public class AttendanceController(AppDbContext db, Application.Interfaces.IAuditService audit) : ControllerBase
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
}
