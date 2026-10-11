using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/schools")]
[Authorize]
public class SchoolsController(AppDbContext db) : ControllerBase
{
    [HttpGet("{schoolId}")]
    public async Task<IActionResult> Get(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var school = await db.Schools
            .Where(s => s.Id == schoolId && s.TenantId == tenantId)
            .Select(s => new { s.Id, s.Name, s.LogoUrl, s.PrimaryColor, s.TimeZone, s.DefaultLanguage })
            .FirstOrDefaultAsync(ct);
        return school is null ? NotFound() : Ok(school);
    }

    [HttpGet("{schoolId}/academic-years")]
    public async Task<IActionResult> GetAcademicYears(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var years = await db.AcademicYears
            .Where(a => a.SchoolId == schoolId && a.TenantId == tenantId)
            .OrderByDescending(a => a.StartDate)
            .Select(a => new { a.Id, a.Name, a.StartDate, a.EndDate, a.IsCurrent })
            .ToListAsync(ct);
        return Ok(years);
    }

    [HttpGet("{schoolId}/classes")]
    public async Task<IActionResult> GetClasses(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var classes = await db.Classes
            .Where(c => c.SchoolId == schoolId && c.TenantId == tenantId)
            .OrderBy(c => c.SortOrder)
            .Include(c => c.Sections)
            .Select(c => new
            {
                c.Id, c.Name, c.SortOrder,
                sections = c.Sections.OrderBy(s => s.Name).Select(s => new { s.Id, s.Name, s.Capacity })
            })
            .ToListAsync(ct);
        return Ok(classes);
    }

    [HttpGet("{schoolId}/subjects")]
    public async Task<IActionResult> GetSubjects(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var subjects = await db.Subjects
            .Where(s => s.SchoolId == schoolId && s.TenantId == tenantId)
            .OrderBy(s => s.Name)
            .Select(s => new { s.Id, s.Name, s.Code, s.IsLanguage })
            .ToListAsync(ct);
        return Ok(subjects);
    }

    [HttpGet("{schoolId}/departments")]
    public async Task<IActionResult> GetDepartments(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var depts = await db.Departments
            .Where(d => d.SchoolId == schoolId && d.TenantId == tenantId)
            .OrderBy(d => d.Name)
            .Select(d => new { d.Id, d.Name })
            .ToListAsync(ct);
        return Ok(depts);
    }
}
