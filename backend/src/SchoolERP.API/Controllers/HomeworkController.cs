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
            .Where(h => h.TenantId == tenantId && h.SchoolId == schoolId && h.IsPublished)
            .Include(h => h.TeacherAssignment)
            .AsQueryable();

        if (sectionId.HasValue)
            query = query.Where(h => h.TeacherAssignment!.SectionId == sectionId.Value);

        Guid? myStudentId = null;
        if (User.IsInRole("Student"))
        {
            var userId = StudentAccess.UserId(User);
            if (userId is not null)
                myStudentId = await db.Students.Where(s => s.UserId == userId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted)
                    .Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
        }

        var rows = await query.OrderByDescending(h => h.DueDate)
            .Select(h => new { h.Id, h.Title, h.IssueDate, h.DueDate, submissionCount = h.Submissions.Count, submitted = myStudentId != null && h.Submissions.Any(s => s.StudentId == myStudentId) })
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

        var homework = await db.Homeworks.FirstOrDefaultAsync(h => h.Id == homeworkId && h.SchoolId == schoolId && h.TenantId == tenantId && h.IsPublished, ct);
        if (homework is null) return NotFound();
        var exists = await db.HomeworkSubmissions.AnyAsync(s => s.HomeworkId == homeworkId && s.StudentId == studentId, ct);
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

        // Verify teacher owns this assignment
        var assignment = await db.TeacherAssignments
            .FirstOrDefaultAsync(a => a.Id == req.TeacherAssignmentId && a.TenantId == tenantId && a.CanSetHomework, ct);
        if (assignment is null) return Forbid();

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
            .Where(sg => sg.TenantId == tenantId && sg.ReceivesNotifications && sg.Student!.SchoolId == schoolId
                && sg.Student.Enrollments.Any(en => en.SectionId == assignment.SectionId && en.EffectiveTo == null))
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
