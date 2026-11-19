using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.API.Authorization;
using SchoolERP.Application.DTOs;
using SchoolERP.Application.Interfaces;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/schools/{schoolId}/students")]
[Authorize]
public class StudentsController(IStudentService studentService, IAuditService auditService, AppDbContext db) : ControllerBase
{
    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Me(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var userId = StudentAccess.UserId(User);
        if (userId is null) return Unauthorized();
        var student = await db.Students.AsNoTracking()
            .Where(s => s.SchoolId == schoolId && s.TenantId == tenantId && s.UserId == userId && !s.IsDeleted)
            .Select(s => new { s.Id, s.StudentCode, s.FirstName, s.LastName })
            .FirstOrDefaultAsync(ct);
        return student is null ? NotFound() : Ok(student);
    }

    [HttpGet]
    [Authorize(Roles = RoleNames.StudentDirectory)]
    public async Task<IActionResult> GetAll(Guid schoolId, [FromQuery] Guid academicYearId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] string? search = null, CancellationToken ct = default)
    {
        if (pageSize > 100) pageSize = 100;
        var result = await studentService.GetStudentsAsync(schoolId, academicYearId, page, pageSize, search, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid schoolId, Guid id, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        if (!await StudentAccess.CanReadStudent(db, User, schoolId, tenantId, id, ct))
            return Forbid();
        var student = await studentService.GetStudentAsync(id, schoolId, ct);
        return student is null ? NotFound() : Ok(student);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.AdmissionsWrite)]
    public async Task<IActionResult> Create(Guid schoolId, [FromBody] CreateStudentRequest request, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        StudentDetailDto student;
        try
        {
            student = await studentService.CreateStudentAsync(request, schoolId, tenantId, actor, ct);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        await auditService.LogAsync(tenantId, actor, "StudentCreated", "Student", student.Id.ToString(),
            newValues: new { student.StudentCode, student.FirstName, student.LastName });
        return CreatedAtAction(nameof(Get), new { schoolId, id = student.Id }, student);
    }

    [HttpPost("{id:guid}/status")]
    [Authorize(Roles = RoleNames.AdmissionsWrite)]
    public async Task<IActionResult> Status(Guid schoolId, Guid id, [FromBody] StatusToggleRequest body, CancellationToken ct)
    {
        try
        {
            await studentService.SetStatusAsync(id, schoolId, body.Status, ct);
            return Ok(new { id, status = body.Status });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/photo")]
    [Authorize(Roles = RoleNames.AdmissionsWrite)]
    public async Task<IActionResult> Photo(Guid schoolId, Guid id, [FromBody] SetPhotoRequest body, CancellationToken ct)
    {
        try
        {
            await studentService.SetPhotoAsync(id, schoolId, body.PhotoUrl, ct);
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
