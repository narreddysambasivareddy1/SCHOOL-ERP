using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.API.Authorization;
using SchoolERP.Domain.Entities;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record UpdateSchoolRequest(string Name, string? PrimaryColor, string TimeZone, string DefaultLanguage, string Locale, string Currency);
public record SaveAcademicYearRequest(string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent);
public record SaveClassRequest(string Name, int SortOrder);
public record SaveSectionRequest(string Name, int Capacity);
public record SaveSubjectRequest(string Name, string Code, bool IsLanguage);

[ApiController]
[Route("api/schools")]
[Authorize]
public class SchoolsController(AppDbContext db) : ControllerBase
{
    [HttpPut("{schoolId}")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> Update(Guid schoolId, [FromBody] UpdateSchoolRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { error = "School name is required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var school = await db.Schools.FirstOrDefaultAsync(s => s.Id == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);
        if (school is null) return NotFound();
        school.Name = req.Name.Trim();
        school.PrimaryColor = string.IsNullOrWhiteSpace(req.PrimaryColor) ? school.PrimaryColor : req.PrimaryColor.Trim();
        school.TimeZone = string.IsNullOrWhiteSpace(req.TimeZone) ? school.TimeZone : req.TimeZone.Trim();
        school.DefaultLanguage = string.IsNullOrWhiteSpace(req.DefaultLanguage) ? school.DefaultLanguage : req.DefaultLanguage.Trim();
        school.Locale = string.IsNullOrWhiteSpace(req.Locale) ? school.Locale : req.Locale.Trim();
        school.Currency = string.IsNullOrWhiteSpace(req.Currency) ? school.Currency : req.Currency.Trim();
        await db.SaveChangesAsync(ct);
        return Ok(new { school.Id, school.Name, school.PrimaryColor, school.TimeZone, school.DefaultLanguage, school.Locale, school.Currency });
    }

    [HttpGet("{schoolId}")]
    public async Task<IActionResult> Get(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var school = await db.Schools
            .Where(s => s.Id == schoolId && s.TenantId == tenantId)
            .Select(s => new { s.Id, s.Name, s.LogoUrl, s.PrimaryColor, s.TimeZone, s.DefaultLanguage, s.Locale, s.Currency })
            .FirstOrDefaultAsync(ct);
        return school is null ? NotFound() : Ok(school);
    }

    [HttpPost("{schoolId}/academic-years")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> CreateYear(Guid schoolId, [FromBody] SaveAcademicYearRequest req, CancellationToken ct)
    {
        var error = ValidateYear(req);
        if (error is not null) return BadRequest(new { error });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        if (!await SchoolExists(schoolId, tenantId, ct)) return NotFound();
        if (req.IsCurrent)
            await ClearCurrentYear(schoolId, tenantId, ct);
        var year = new AcademicYear
        {
            TenantId = tenantId, SchoolId = schoolId, Name = req.Name.Trim(),
            StartDate = req.StartDate, EndDate = req.EndDate, IsCurrent = req.IsCurrent
        };
        db.AcademicYears.Add(year);
        await db.SaveChangesAsync(ct);
        return Ok(new { year.Id, year.Name, year.StartDate, year.EndDate, year.IsCurrent });
    }

    [HttpPut("{schoolId}/academic-years/{id:guid}")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> UpdateYear(Guid schoolId, Guid id, [FromBody] SaveAcademicYearRequest req, CancellationToken ct)
    {
        var error = ValidateYear(req);
        if (error is not null) return BadRequest(new { error });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var year = await db.AcademicYears.FirstOrDefaultAsync(y => y.Id == id && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        if (year is null) return NotFound();
        if (req.IsCurrent) await ClearCurrentYear(schoolId, tenantId, ct);
        year.Name = req.Name.Trim();
        year.StartDate = req.StartDate;
        year.EndDate = req.EndDate;
        year.IsCurrent = req.IsCurrent;
        await db.SaveChangesAsync(ct);
        return Ok(new { year.Id, year.Name, year.StartDate, year.EndDate, year.IsCurrent });
    }

    [HttpPost("{schoolId}/classes")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> CreateClass(Guid schoolId, [FromBody] SaveClassRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { error = "Class name is required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        if (!await SchoolExists(schoolId, tenantId, ct)) return NotFound();
        var row = new Class { TenantId = tenantId, SchoolId = schoolId, Name = req.Name.Trim(), SortOrder = req.SortOrder };
        db.Classes.Add(row);
        await db.SaveChangesAsync(ct);
        return Ok(new { row.Id, row.Name, row.SortOrder });
    }

    [HttpPut("{schoolId}/classes/{id:guid}")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> UpdateClass(Guid schoolId, Guid id, [FromBody] SaveClassRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { error = "Class name is required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var row = await db.Classes.FirstOrDefaultAsync(c => c.Id == id && c.SchoolId == schoolId && c.TenantId == tenantId, ct);
        if (row is null) return NotFound();
        row.Name = req.Name.Trim();
        row.SortOrder = req.SortOrder;
        await db.SaveChangesAsync(ct);
        return Ok(new { row.Id, row.Name, row.SortOrder });
    }

    [HttpPost("{schoolId}/classes/{classId:guid}/sections")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> CreateSection(Guid schoolId, Guid classId, [FromBody] SaveSectionRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Capacity <= 0)
            return BadRequest(new { error = "Section name and a capacity above zero are required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var cls = await db.Classes.FirstOrDefaultAsync(c => c.Id == classId && c.SchoolId == schoolId && c.TenantId == tenantId, ct);
        if (cls is null) return NotFound();
        var row = new Section { TenantId = tenantId, ClassId = cls.Id, Name = req.Name.Trim(), Capacity = req.Capacity };
        db.Sections.Add(row);
        await db.SaveChangesAsync(ct);
        return Ok(new { row.Id, row.Name, row.Capacity, row.ClassId });
    }

    [HttpPut("{schoolId}/sections/{id:guid}")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> UpdateSection(Guid schoolId, Guid id, [FromBody] SaveSectionRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Capacity <= 0)
            return BadRequest(new { error = "Section name and a capacity above zero are required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var row = await db.Sections.FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId && s.Class!.SchoolId == schoolId && s.Class.TenantId == tenantId, ct);
        if (row is null) return NotFound();
        row.Name = req.Name.Trim();
        row.Capacity = req.Capacity;
        await db.SaveChangesAsync(ct);
        return Ok(new { row.Id, row.Name, row.Capacity });
    }

    [HttpPost("{schoolId}/subjects")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> CreateSubject(Guid schoolId, [FromBody] SaveSubjectRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Code))
            return BadRequest(new { error = "Subject name and code are required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        if (!await SchoolExists(schoolId, tenantId, ct)) return NotFound();
        var row = new Subject { TenantId = tenantId, SchoolId = schoolId, Name = req.Name.Trim(), Code = req.Code.Trim(), IsLanguage = req.IsLanguage };
        db.Subjects.Add(row);
        await db.SaveChangesAsync(ct);
        return Ok(new { row.Id, row.Name, row.Code, row.IsLanguage });
    }

    [HttpPut("{schoolId}/subjects/{id:guid}")]
    [Authorize(Roles = RoleNames.Leadership)]
    public async Task<IActionResult> UpdateSubject(Guid schoolId, Guid id, [FromBody] SaveSubjectRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Code))
            return BadRequest(new { error = "Subject name and code are required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var row = await db.Subjects.FirstOrDefaultAsync(s => s.Id == id && s.SchoolId == schoolId && s.TenantId == tenantId, ct);
        if (row is null) return NotFound();
        row.Name = req.Name.Trim();
        row.Code = req.Code.Trim();
        row.IsLanguage = req.IsLanguage;
        await db.SaveChangesAsync(ct);
        return Ok(new { row.Id, row.Name, row.Code, row.IsLanguage });
    }

    private static string? ValidateYear(SaveAcademicYearRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return "Academic year name is required.";
        if (req.EndDate <= req.StartDate) return "The end date must be after the start date.";
        return null;
    }

    private async Task<bool> SchoolExists(Guid schoolId, Guid tenantId, CancellationToken ct) =>
        await db.Schools.AnyAsync(s => s.Id == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);

    private async Task ClearCurrentYear(Guid schoolId, Guid tenantId, CancellationToken ct)
    {
        var current = await db.AcademicYears.Where(y => y.SchoolId == schoolId && y.TenantId == tenantId && y.IsCurrent).ToListAsync(ct);
        foreach (var year in current) year.IsCurrent = false;
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

    [HttpGet("{schoolId}/designations")]
    [Authorize(Roles = RoleNames.Hr)]
    public async Task<IActionResult> GetDesignations(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var rows = await db.Designations
            .Where(d => d.SchoolId == schoolId && d.TenantId == tenantId)
            .OrderBy(d => d.Name)
            .Select(d => new { d.Id, d.Name })
            .ToListAsync(ct);
        return Ok(rows);
    }
}
