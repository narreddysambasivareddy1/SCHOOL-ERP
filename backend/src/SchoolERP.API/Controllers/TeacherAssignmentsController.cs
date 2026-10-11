using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
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
        var list = await db.TeacherAssignments
            .Where(a => a.TenantId == tenantId && a.AcademicYearId == academicYearId && a.IsActive)
            .Include(a => a.Employee)
            .Include(a => a.Subject)
            .Include(a => a.Class)
            .Include(a => a.Section)
            .Select(a => new
            {
                a.Id,
                teacher = $"{a.Employee!.FirstName} {a.Employee.LastName}",
                employeeCode = a.Employee.EmployeeCode,
                subject = a.Subject!.Name,
                className = a.Class!.Name,
                sectionName = a.Section!.Name,
                a.CanTakeAttendance, a.CanSetHomework, a.CanEnterMarks, a.IsActive
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

        var exists = await db.TeacherAssignments.AnyAsync(a =>
            a.TenantId == tenantId && a.AcademicYearId == req.AcademicYearId &&
            a.EmployeeId == req.EmployeeId && a.SubjectId == req.SubjectId &&
            a.SectionId == req.SectionId && a.IsActive, ct);
        if (exists) return Conflict(new { error = "Assignment already exists for this teacher/subject/section/year." });

        var assignment = new TeacherAssignment
        {
            TenantId = tenantId, AcademicYearId = req.AcademicYearId,
            EmployeeId = req.EmployeeId, SubjectId = req.SubjectId,
            ClassId = req.ClassId, SectionId = req.SectionId,
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
        var a = await db.TeacherAssignments.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);
        if (a is null) return NotFound();
        a.IsActive = false;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "TeacherAssignmentDeactivated", "TeacherAssignment", id.ToString());
        return NoContent();
    }
}
