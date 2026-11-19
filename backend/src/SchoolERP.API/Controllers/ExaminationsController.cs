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

public record CreateExamRequest(string Name, string? Term, Guid AcademicYearId);
public record MarkEntryRequest(Guid StudentId, Guid SubjectId, decimal? MarksObtained, decimal MaxMarks, bool IsAbsent, string? Remarks);

[ApiController]
[Route("api/schools/{schoolId}/examinations")]
[Authorize]
public class ExaminationsController(AppDbContext db, IAuditService audit, INotificationService notifications) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid schoolId, [FromQuery] Guid academicYearId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var exams = await db.Examinations
            .Where(e => e.TenantId == tenantId && e.SchoolId == schoolId && e.AcademicYearId == academicYearId)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new { e.Id, e.Name, e.Term, e.IsPublished, e.CreatedAt })
            .ToListAsync(ct);
        return Ok(exams);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Teaching)]
    public async Task<IActionResult> Create(Guid schoolId, [FromBody] CreateExamRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var exam = new Examination
        {
            TenantId = tenantId, SchoolId = schoolId,
            AcademicYearId = req.AcademicYearId, Name = req.Name,
            Term = req.Term, CreatedBy = actor
        };
        db.Examinations.Add(exam);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "ExaminationCreated", "Examination", exam.Id.ToString(), newValues: new { exam.Name, exam.Term });
        return CreatedAtAction(nameof(GetAll), new { schoolId, academicYearId = req.AcademicYearId }, new { exam.Id, exam.Name });
    }

    [HttpPost("{examId}/marks")]
    [Authorize(Roles = RoleNames.Teaching)]
    public async Task<IActionResult> EnterMarks(Guid schoolId, Guid examId, [FromBody] IEnumerable<MarkEntryRequest> entries, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var batch = entries?.ToList() ?? [];
        if (batch.Count == 0) return BadRequest(new { error = "Enter at least one mark." });

        var exam = await db.Examinations.FirstOrDefaultAsync(e => e.Id == examId && e.TenantId == tenantId && e.SchoolId == schoolId, ct);
        if (exam is null) return NotFound();
        if (exam.IsPublished) return Conflict(new { error = "Cannot edit marks on a published examination." });

        foreach (var entry in batch)
        {
            if (entry.MaxMarks <= 0) return BadRequest(new { error = "Maximum marks must be greater than zero." });
            if (!entry.IsAbsent && entry.MarksObtained is null) return BadRequest(new { error = "Marks are required unless the student is absent." });
            if (entry.MarksObtained is < 0 || entry.MarksObtained > entry.MaxMarks)
                return BadRequest(new { error = "Marks must be between zero and the maximum." });
            var studentOk = await db.Students.AnyAsync(s => s.Id == entry.StudentId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);
            var subjectOk = await db.Subjects.AnyAsync(s => s.Id == entry.SubjectId && s.SchoolId == schoolId && s.TenantId == tenantId, ct);
            if (!studentOk || !subjectOk) return BadRequest(new { error = "Student or subject is not in this school." });

            var existing = await db.MarkEntries.FirstOrDefaultAsync(m =>
                m.ExaminationId == examId && m.StudentId == entry.StudentId && m.SubjectId == entry.SubjectId, ct);
            if (existing is null)
            {
                db.MarkEntries.Add(new MarkEntry
                {
                    TenantId = tenantId, ExaminationId = examId,
                    StudentId = entry.StudentId, SubjectId = entry.SubjectId,
                    MarksObtained = entry.IsAbsent ? null : entry.MarksObtained,
                    MaxMarks = entry.MaxMarks, IsAbsent = entry.IsAbsent,
                    Remarks = entry.Remarks, CreatedBy = actor
                });
            }
            else
            {
                existing.MarksObtained = entry.IsAbsent ? null : entry.MarksObtained;
                existing.MaxMarks = entry.MaxMarks;
                existing.IsAbsent = entry.IsAbsent;
                existing.Remarks = entry.Remarks;
                existing.UpdatedBy = actor;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "MarksEntered", "Examination", examId.ToString(), newValues: new { count = batch.Count });
        return Ok(new { saved = batch.Count });
    }

    [HttpPost("{examId}/publish")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> Publish(Guid schoolId, Guid examId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var exam = await db.Examinations.FirstOrDefaultAsync(e => e.Id == examId && e.TenantId == tenantId && e.SchoolId == schoolId, ct);
        if (exam is null) return NotFound();
        if (exam.IsPublished) return Conflict(new { error = "Already published." });
        exam.IsPublished = true;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "ExaminationPublished", "Examination", examId.ToString());

        var recipients = await db.StudentGuardians
            .Where(sg => sg.TenantId == tenantId && sg.ReceivesNotifications && sg.Student!.SchoolId == schoolId)
            .Select(sg => new NotificationRecipient(
                sg.GuardianId.ToString(), sg.Guardian!.Email, sg.Guardian.Phone,
                sg.Guardian.FirstName + " " + sg.Guardian.LastName))
            .ToListAsync(ct);
        await notifications.DispatchAsync(new NotificationDispatchRequest(
            tenantId, schoolId, "Results published",
            $"{exam.Name} results are now available in the parent and student portals.",
            [NotificationChannel.InApp, NotificationChannel.Email, NotificationChannel.WhatsApp],
            recipients, "exam.published"), ct);

        return Ok(new { examId, published = true });
    }

    [HttpGet("{examId}/results/{studentId}")]
    public async Task<IActionResult> GetStudentResults(Guid schoolId, Guid examId, Guid studentId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var exam = await db.Examinations.FirstOrDefaultAsync(e => e.Id == examId && e.TenantId == tenantId && e.SchoolId == schoolId, ct);
        if (exam is null) return NotFound();
        if (!exam.IsPublished && !StudentAccess.IsResultsStaff(User))
            return Forbid();
        if (!await StudentAccess.CanReadStudent(db, User, schoolId, tenantId, studentId, ct))
            return Forbid();

        var marks = await db.MarkEntries
            .Where(m => m.ExaminationId == examId && m.StudentId == studentId)
            .Include(m => m.Subject)
            .Select(m => new { subject = m.Subject!.Name, m.MarksObtained, m.MaxMarks, m.IsAbsent, m.Remarks })
            .ToListAsync(ct);

        var total = marks.Sum(m => m.MarksObtained ?? 0);
        var maxTotal = marks.Sum(m => m.MaxMarks);
        var pct = maxTotal > 0 ? Math.Round(total / maxTotal * 100, 2) : 0;

        return Ok(new { examId, studentId, marks, total, maxTotal, percentage = pct });
    }
}
