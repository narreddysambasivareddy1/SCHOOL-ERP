using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/schools/{schoolId}/teacher-assignments")]
[Authorize]
public class TeacherAssignmentsController(AppDbContext db, Application.Interfaces.IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid schoolId, [FromQuery] Guid academicYearId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var yearExists = await db.AcademicYears.AnyAsync(y =>
            y.Id == academicYearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        if (!yearExists) return NotFound(new { error = "Academic year not found for this school." });
        var list = await db.TeacherAssignments
            .Where(a => a.TenantId == tenantId && a.AcademicYearId == academicYearId &&
                a.Employee!.SchoolId == schoolId && a.IsActive)
            .Include(a => a.Employee)
            .Include(a => a.Subject)
            .Include(a => a.Class)
            .Include(a => a.Section)
            .Select(a => new
            {
                a.Id,
                a.EmployeeId, a.SubjectId, a.ClassId, a.SectionId,
                teacher = $"{a.Employee!.FirstName} {a.Employee.LastName}",
                employeeCode = a.Employee.EmployeeCode,
                subject = a.Subject!.Name,
                className = a.Class!.Name,
                sectionName = a.Section!.Name,
                a.CanTakeAttendance, a.CanSetHomework, a.CanEnterMarks, a.IsActive, a.PeriodSlot, a.ElectiveGroup
            })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> Create(Guid schoolId, [FromBody] Application.DTOs.CreateTeacherAssignmentRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";

        var valid = await db.AcademicYears.AnyAsync(y => y.Id == req.AcademicYearId &&
                y.SchoolId == schoolId && y.TenantId == tenantId, ct)
            && await db.Employees.AnyAsync(e => e.Id == req.EmployeeId && e.SchoolId == schoolId &&
                e.TenantId == tenantId && e.Status == EmployeeStatus.Active, ct)
            && await db.Subjects.AnyAsync(s => s.Id == req.SubjectId && s.SchoolId == schoolId &&
                s.TenantId == tenantId, ct)
            && await db.Classes.AnyAsync(c => c.Id == req.ClassId && c.SchoolId == schoolId &&
                c.TenantId == tenantId, ct)
            && await db.Sections.AnyAsync(s => s.Id == req.SectionId && s.TenantId == tenantId &&
                s.ClassId == req.ClassId, ct);
        if (!valid) return BadRequest(new { error = "The teacher, subject, class, section, or academic year is not valid for this school." });

        var existing = await db.TeacherAssignments.FirstOrDefaultAsync(a =>
            a.TenantId == tenantId && a.AcademicYearId == req.AcademicYearId &&
            a.EmployeeId == req.EmployeeId && a.SubjectId == req.SubjectId && a.SectionId == req.SectionId &&
            a.PeriodSlot == req.PeriodSlot && a.ElectiveGroup == req.ElectiveGroup, ct);
        if (existing is not null)
        {
            if (existing.IsActive)
                return Conflict(new { error = "Assignment already exists for this teacher/subject/section/period/group." });
            existing.IsActive = true;
            await db.SaveChangesAsync(ct);
            await audit.LogAsync(tenantId, actor, "TeacherAssignmentReactivated", "TeacherAssignment", existing.Id.ToString());
            return Ok(new { existing.Id, reactivated = true });
        }

        if (!string.IsNullOrWhiteSpace(req.PeriodSlot))
        {
            var clash = await db.TeacherAssignments.AnyAsync(a =>
                a.TenantId == tenantId && a.AcademicYearId == req.AcademicYearId &&
                a.EmployeeId == req.EmployeeId && a.IsActive && a.Employee!.SchoolId == schoolId &&
                a.PeriodSlot == req.PeriodSlot, ct);
            if (clash) return Conflict(new { error = $"Scheduling conflict: this teacher is already mapped to period {req.PeriodSlot}." });
        }

        var assignment = new TeacherAssignment
        {
            TenantId = tenantId, AcademicYearId = req.AcademicYearId,
            EmployeeId = req.EmployeeId, SubjectId = req.SubjectId,
            ClassId = req.ClassId, SectionId = req.SectionId,
            PeriodSlot = req.PeriodSlot, ElectiveGroup = req.ElectiveGroup,
            CreatedBy = actor
        };
        db.TeacherAssignments.Add(assignment);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "TeacherAssigned", "TeacherAssignment", assignment.Id.ToString(),
            newValues: new { req.EmployeeId, req.SubjectId, req.SectionId });
        return CreatedAtAction(nameof(GetAll), new { schoolId, academicYearId = req.AcademicYearId }, new { assignment.Id });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> Deactivate(Guid schoolId, Guid id, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var a = await db.TeacherAssignments.FirstOrDefaultAsync(x => x.Id == id &&
            x.TenantId == tenantId && x.Employee!.SchoolId == schoolId, ct);
        if (a is null) return NotFound();
        a.IsActive = false;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "TeacherAssignmentDeactivated", "TeacherAssignment", id.ToString());
        return NoContent();
    }
}
