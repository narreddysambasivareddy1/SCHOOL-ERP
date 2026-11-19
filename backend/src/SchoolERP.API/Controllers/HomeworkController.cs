using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.API.Authorization;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record CreateHomeworkRequest(Guid TeacherAssignmentId, string Title, string? Instructions, DateOnly IssueDate, DateOnly DueDate);

[ApiController]
[Route("api/schools/{schoolId}/homework")]
[Authorize]
public class HomeworkController(AppDbContext db, INotificationService notifications) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid schoolId, [FromQuery] Guid? sectionId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var query = db.Homeworks
            .Where(h => h.TenantId == tenantId && h.SchoolId == schoolId && h.IsPublished
                && h.TeacherAssignment!.TenantId == tenantId
                && h.TeacherAssignment.Class!.SchoolId == schoolId
                && h.TeacherAssignment.Class.TenantId == tenantId
                && h.TeacherAssignment.Employee!.SchoolId == schoolId
                && h.TeacherAssignment.Employee.TenantId == tenantId)
            .AsQueryable();

        if (sectionId.HasValue)
        {
            var sectionInSchool = await db.Sections.AnyAsync(s =>
                s.Id == sectionId.Value && s.TenantId == tenantId && s.Class!.SchoolId == schoolId && s.Class.TenantId == tenantId, ct);
            if (!sectionInSchool) return NotFound();
            query = query.Where(h => h.TeacherAssignment!.SectionId == sectionId.Value);
        }

        var staff = StudentAccess.IsLeadership(User) || StudentAccess.InRole(User, "Teacher") || StudentAccess.InRole(User, "AttendanceOfficer");
        Guid? myStudentId = null;
        if (!staff)
        {
            var userId = StudentAccess.UserId(User);
            if (userId is null) return Unauthorized();
            List<Guid> sectionIds;
            if (StudentAccess.InRole(User, "Student"))
            {
                myStudentId = await db.Students.Where(s => s.UserId == userId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted)
                    .Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
                sectionIds = await db.StudentEnrollments
                    .Where(e => e.TenantId == tenantId && e.EffectiveTo == null
                        && e.Student!.UserId == userId && e.Student.SchoolId == schoolId && e.Student.TenantId == tenantId
                        && e.Class!.SchoolId == schoolId && e.Class.TenantId == tenantId
                        && e.Section!.TenantId == tenantId && e.Section.ClassId == e.ClassId)
                    .Select(e => e.SectionId)
                    .Distinct()
                    .ToListAsync(ct);
            }
            else if (StudentAccess.InRole(User, "Parent"))
            {
                sectionIds = await db.StudentEnrollments
                    .Where(e => e.TenantId == tenantId && e.EffectiveTo == null
                        && e.Student!.SchoolId == schoolId && e.Student.TenantId == tenantId
                        && e.Class!.SchoolId == schoolId && e.Class.TenantId == tenantId
                        && e.Student.Guardians.Any(sg => sg.TenantId == tenantId && sg.Guardian!.UserId == userId && sg.Guardian.TenantId == tenantId))
                    .Select(e => e.SectionId)
                    .Distinct()
                    .ToListAsync(ct);
            }
            else return Forbid();

            query = query.Where(h => sectionIds.Contains(h.TeacherAssignment!.SectionId));
        }
        else if (StudentAccess.InRole(User, "Student"))
        {
            var userId = StudentAccess.UserId(User);
            if (userId is not null)
                myStudentId = await db.Students.Where(s => s.UserId == userId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted)
                    .Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
        }

        var rows = await query.OrderByDescending(h => h.DueDate)
            .Select(h => new { h.Id, h.Title, h.IssueDate, h.DueDate, submissionCount = h.Submissions.Count(s => s.TenantId == tenantId), submitted = myStudentId != null && h.Submissions.Any(s => s.StudentId == myStudentId && s.TenantId == tenantId) })
            .ToListAsync(ct);
        return Ok(rows);
    }

    [HttpPost("{homeworkId:guid}/submit")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Submit(Guid schoolId, Guid homeworkId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var userId = StudentAccess.UserId(User);
        if (userId is null) return Unauthorized();
        var studentId = await db.Students.Where(s => s.UserId == userId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted)
            .Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
        if (studentId is null) return Forbid();

        var homework = await db.Homeworks
            .Include(h => h.TeacherAssignment)
            .FirstOrDefaultAsync(h => h.Id == homeworkId && h.SchoolId == schoolId && h.TenantId == tenantId && h.IsPublished, ct);
        if (homework?.TeacherAssignment is null || homework.TeacherAssignment.TenantId != tenantId)
            return NotFound();

        var assignmentInSchool = await db.Classes.AnyAsync(c =>
            c.Id == homework.TeacherAssignment.ClassId && c.SchoolId == schoolId && c.TenantId == tenantId, ct)
            && await db.Employees.AnyAsync(e =>
                e.Id == homework.TeacherAssignment.EmployeeId && e.SchoolId == schoolId && e.TenantId == tenantId, ct);
        if (!assignmentInSchool) return NotFound();

        var enrolled = await db.StudentEnrollments.AnyAsync(e =>
            e.StudentId == studentId && e.TenantId == tenantId && e.EffectiveTo == null
            && e.SectionId == homework.TeacherAssignment.SectionId
            && e.ClassId == homework.TeacherAssignment.ClassId
            && e.AcademicYearId == homework.TeacherAssignment.AcademicYearId
            && e.Student!.SchoolId == schoolId && e.Student.TenantId == tenantId
            && e.Class!.SchoolId == schoolId && e.Class.TenantId == tenantId
            && e.Section!.TenantId == tenantId && e.Section.ClassId == e.ClassId, ct);
        if (!enrolled) return Forbid();

        var exists = await db.HomeworkSubmissions.AnyAsync(s =>
            s.TenantId == tenantId && s.HomeworkId == homeworkId && s.StudentId == studentId, ct);
        if (exists) return Conflict(new { error = "This homework is already submitted." });

        db.HomeworkSubmissions.Add(new HomeworkSubmission
        {
            TenantId = tenantId, HomeworkId = homeworkId, StudentId = studentId.Value, SubmittedAt = DateTime.UtcNow,
            CreatedBy = User.FindFirstValue(ClaimTypes.Email)
        });
        await db.SaveChangesAsync(ct);
        return Ok(new { homeworkId, submitted = true });
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Teaching)]
    public async Task<IActionResult> Create(Guid schoolId, [FromBody] CreateHomeworkRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";

        var assignment = await (
            from a in db.TeacherAssignments
            join emp in db.Employees on a.EmployeeId equals emp.Id
            join cls in db.Classes on a.ClassId equals cls.Id
            join sec in db.Sections on a.SectionId equals sec.Id
            join sub in db.Subjects on a.SubjectId equals sub.Id
            join year in db.AcademicYears on a.AcademicYearId equals year.Id
            where a.Id == req.TeacherAssignmentId
                && a.TenantId == tenantId && emp.TenantId == tenantId && cls.TenantId == tenantId
                && sec.TenantId == tenantId && sub.TenantId == tenantId && year.TenantId == tenantId
                && a.IsActive && a.CanSetHomework
                && emp.SchoolId == schoolId && cls.SchoolId == schoolId && sub.SchoolId == schoolId && year.SchoolId == schoolId
                && sec.ClassId == cls.Id
            select a).FirstOrDefaultAsync(ct);
        if (assignment is null) return Forbid();

        if (!StudentAccess.IsLeadership(User))
        {
            var userId = StudentAccess.UserId(User);
            var owns = userId is not null && await db.Employees.AnyAsync(e =>
                e.Id == assignment.EmployeeId && e.UserId == userId && e.SchoolId == schoolId && e.TenantId == tenantId, ct);
            if (!owns) return Forbid();
        }

        var hw = new Homework
        {
            TenantId = tenantId, SchoolId = schoolId,
            TeacherAssignmentId = req.TeacherAssignmentId,
            Title = req.Title, Instructions = req.Instructions,
            IssueDate = req.IssueDate, DueDate = req.DueDate,
            IsPublished = true, CreatedBy = actor
        };

        db.Homeworks.Add(hw);
        await db.SaveChangesAsync(ct);

        var recipients = await db.StudentGuardians
            .Where(sg => sg.TenantId == tenantId && sg.Guardian!.TenantId == tenantId && sg.ReceivesNotifications
                && sg.Student!.SchoolId == schoolId && sg.Student.TenantId == tenantId
                && sg.Student.Enrollments.Any(en => en.TenantId == tenantId && en.SectionId == assignment.SectionId && en.EffectiveTo == null))
            .Select(sg => new NotificationRecipient(
                sg.GuardianId.ToString(), sg.Guardian!.Email, sg.Guardian.Phone,
                sg.Guardian.FirstName + " " + sg.Guardian.LastName))
            .ToListAsync(ct);
        await notifications.DispatchAsync(new NotificationDispatchRequest(
            tenantId, schoolId, "New homework",
            $"{hw.Title} is due {hw.DueDate:dd MMM yyyy}.",
            [NotificationChannel.InApp, NotificationChannel.Email],
            recipients, "homework.published"), ct);

        return CreatedAtAction(nameof(GetAll), new { schoolId }, new { hw.Id, hw.Title, hw.DueDate });
    }
}
