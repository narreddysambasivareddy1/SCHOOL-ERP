using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;

namespace SchoolERP.API.Controllers;

public record AssignSubstituteRequest(Guid SubstituteEmployeeId);
public record LessonDayDto(int DayOfWeek, string Topic);
public record SaveLessonPlanRequest(Guid AcademicYearId, DateOnly WeekStart, Guid ClassId, Guid SectionId, Guid SubjectId, Guid? EmployeeId, IReadOnlyList<LessonDayDto> Days);
public record SaveDiaryRequest(Guid AcademicYearId, DateOnly Date, Guid ClassId, Guid SectionId, Guid? SubjectId, Guid? EmployeeId, string? Notes, string? Homework);

[ApiController]
[Authorize]
public class AcademicDeskController(AcademicOpsService ops, AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet("api/schools/{schoolId}/ops-today")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> OpsToday(Guid schoolId, [FromQuery] Guid academicYearId, CancellationToken ct)
    {
        try
        {
            return Ok(await ops.OpsTodayAsync(schoolId, Tenant(), academicYearId,
                DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5)), ct));
        }
        catch (InvalidOperationException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("api/schools/{schoolId}/substitutions")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Substitutions(Guid schoolId, [FromQuery] DateOnly? date, CancellationToken ct)
        => Ok(await ops.SubstitutionsAsync(schoolId, Tenant(), date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5)), ct));

    [HttpGet("api/schools/{schoolId}/substitutions/available")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Available(Guid schoolId, [FromQuery] Guid academicYearId, [FromQuery] DateOnly date, [FromQuery] Guid periodId, CancellationToken ct)
    {
        try { return Ok(await ops.AvailableTeachersAsync(schoolId, Tenant(), academicYearId, date, periodId, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("api/schools/{schoolId}/substitutions/{id:guid}/assign")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Assign(Guid schoolId, Guid id, [FromBody] AssignSubstituteRequest body, CancellationToken ct)
    {
        try { await ops.AssignSubstituteAsync(schoolId, Tenant(), id, body.SubstituteEmployeeId, ct); return Ok(new { assigned = true }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("api/schools/{schoolId}/lesson-plans")]
    public async Task<IActionResult> Plans(Guid schoolId, [FromQuery] DateOnly weekStart, [FromQuery] Guid? sectionId, CancellationToken ct)
    {
        var sections = await VisibleSectionsAsync(schoolId, weekStart, ct, includeWeek: true);
        if (sections is null) return Ok(await ops.LessonPlansAsync(schoolId, Tenant(), weekStart, sectionId, ct));
        if (sectionId is { } requested && !sections.Contains(requested)) return Forbid();
        if (sectionId is null && sections.Count == 0) return Ok(Array.Empty<object>());
        return Ok(await ops.LessonPlansAsync(schoolId, Tenant(), weekStart, sectionId, ct, sections));
    }

    [HttpPost("api/schools/{schoolId}/lesson-plans")]
    [Authorize(Roles = "SchoolAdmin,Teacher")]
    public async Task<IActionResult> SavePlan(Guid schoolId, [FromBody] SaveLessonPlanRequest body, CancellationToken ct)
    {
        if (body.Days is null || body.Days.Count > 6)
            return BadRequest(new { error = "Provide no more than six Monday–Saturday topics." });
        var employeeId = User.IsInRole("Teacher")
            ? await RequireEmployee(schoolId, ct)
            : body.EmployeeId;
        if (employeeId is null) return BadRequest(new { error = "Link your login to a staff record, or choose a teacher." });
        try
        {
            return Ok(await ops.SaveLessonPlanAsync(schoolId, Tenant(), body.AcademicYearId, body.WeekStart, body.ClassId, body.SectionId,
                body.SubjectId, employeeId.Value, body.Days.Select(d => (d.DayOfWeek, d.Topic)).ToList(),
                Actor(), User.IsInRole("SchoolAdmin") || User.IsInRole("PlatformSuperAdmin"), ct));
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("api/schools/{schoolId}/diaries")]
    public async Task<IActionResult> Diaries(Guid schoolId, [FromQuery] DateOnly date, [FromQuery] Guid? sectionId, CancellationToken ct)
    {
        var sections = await VisibleSectionsAsync(schoolId, date, ct);
        if (sections is null) return Ok(await ops.DiariesAsync(schoolId, Tenant(), date, sectionId, ct));
        if (sectionId is { } requested && !sections.Contains(requested)) return Forbid();
        if (sectionId is null && sections.Count == 0) return Ok(Array.Empty<object>());
        return Ok(await ops.DiariesAsync(schoolId, Tenant(), date, sectionId, ct, sections));
    }

    [HttpPost("api/schools/{schoolId}/diaries")]
    [Authorize(Roles = "SchoolAdmin,Teacher")]
    public async Task<IActionResult> SaveDiary(Guid schoolId, [FromBody] SaveDiaryRequest body, CancellationToken ct)
    {
        var employeeId = User.IsInRole("Teacher")
            ? await RequireEmployee(schoolId, ct)
            : body.EmployeeId;
        if (employeeId is null) return BadRequest(new { error = "Link your login to a staff record." });
        try
        {
            return Ok(await ops.SaveDiaryAsync(schoolId, Tenant(), body.AcademicYearId, body.Date, body.ClassId, body.SectionId,
                body.SubjectId, employeeId.Value, DiaryEntryMode.Digital, body.Notes, body.Homework, null, null, Actor(), ct));
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("api/schools/{schoolId}/diaries/scan")]
    [Authorize(Roles = "SchoolAdmin,Teacher")]
    [RequestSizeLimit(8_000_000)]
    public async Task<IActionResult> ScanDiary(Guid schoolId, [FromForm] Guid academicYearId, [FromForm] DateOnly date,
        [FromForm] Guid classId, [FromForm] Guid sectionId, [FromForm] Guid? subjectId,
        [FromForm] Guid? employeeId, IFormFile file, CancellationToken ct)
    {
        var submittingEmployeeId = User.IsInRole("Teacher")
            ? await RequireEmployee(schoolId, ct)
            : employeeId;
        if (submittingEmployeeId is null) return BadRequest(new { error = "Select an assigned teacher for this diary scan." });
        if (file is null || file.Length == 0 || file.Length > 8_000_000)
            return BadRequest(new { error = "Upload a non-empty diary image or PDF no larger than 8 MB." });
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".pdf" or ".png" or ".jpg" or ".jpeg" or ".webp") ||
            !await HasAllowedFileSignatureAsync(file, extension, ct))
            return BadRequest(new { error = "Only valid PDF, PNG, JPEG, or WebP diary scans are allowed." });
        var dir = Path.Combine(env.ContentRootPath, "private-uploads", Tenant().ToString(), schoolId.ToString(), "diaries");
        Directory.CreateDirectory(dir);
        var safe = $"diary-{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(dir, safe);
        await using (var stream = System.IO.File.Create(filePath))
            await file.CopyToAsync(stream, ct);
        var relative = Path.Combine(Tenant().ToString(), schoolId.ToString(), "diaries", safe);
        var saved = false;
        try
        {
            var result = await ops.SaveDiaryAsync(schoolId, Tenant(), academicYearId, date, classId, sectionId, subjectId,
                submittingEmployeeId.Value, DiaryEntryMode.Scan, null, null, file.FileName, relative, Actor(), ct);
            saved = true;
            return Ok(result);
        }
        finally
        {
            if (!saved && System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
        }
    }

    [HttpGet("api/schools/{schoolId}/diaries/{diaryId:guid}/scan")]
    public async Task<IActionResult> DiaryScan(Guid schoolId, Guid diaryId, CancellationToken ct)
    {
        var tenantId = Tenant();
        var diary = await db.ClassDiaries.FirstOrDefaultAsync(d =>
            d.Id == diaryId && d.SchoolId == schoolId && d.TenantId == tenantId, ct);
        if (diary?.RelativePath is null) return NotFound();
        var sections = await VisibleSectionsAsync(schoolId, diary.Date, ct);
        if (sections is not null && !sections.Contains(diary.SectionId)) return Forbid();

        var root = Path.GetFullPath(Path.Combine(env.ContentRootPath, "private-uploads"));
        var path = Path.GetFullPath(Path.Combine(root, diary.RelativePath));
        if (!path.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Invalid diary scan path." });
        if (!System.IO.File.Exists(path)) return NotFound();
        var contentType = Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
        return PhysicalFile(path, contentType, enableRangeProcessing: true);
    }

    [HttpGet("api/schools/{schoolId}/diaries/compliance")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> Compliance(Guid schoolId, [FromQuery] Guid academicYearId, [FromQuery] DateOnly? date, CancellationToken ct)
    {
        try { return Ok(await ops.ComplianceAsync(schoolId, Tenant(), academicYearId, date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5)), ct)); }
        catch (InvalidOperationException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("api/schools/{schoolId}/diaries/remind")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> Remind(Guid schoolId, [FromQuery] Guid academicYearId, [FromQuery] DateOnly? date, CancellationToken ct)
    {
        try
        {
            var n = await ops.RemindPendingAsync(schoolId, Tenant(), academicYearId, date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5)), ct);
            return Ok(new { reminded = n });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    private async Task<Guid?> RequireEmployee(Guid schoolId, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId)) return null;
        var emp = await ops.EmployeeForUserAsync(schoolId, Tenant(), userId, ct);
        return emp?.Id;
    }

    private async Task<List<Guid>?> VisibleSectionsAsync(
        Guid schoolId, DateOnly date, CancellationToken ct, bool includeWeek = false)
    {
        if (User.IsInRole("SchoolAdmin") || User.IsInRole("HRManager") ||
            User.IsInRole("PlatformSuperAdmin")) return null;
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId)) return [];
        var tenantId = Tenant();
        if (User.IsInRole("Teacher"))
        {
            return await db.TeacherAssignments.Where(a => a.TenantId == tenantId &&
                    a.IsActive && a.Employee!.SchoolId == schoolId && a.Employee.UserId == userId)
                .Select(a => a.SectionId).Distinct().ToListAsync(ct);
        }

        var rangeEnd = includeWeek ? date.AddDays(6) : date;
        var enrollments = db.StudentEnrollments.Where(e => e.TenantId == tenantId &&
            e.Student!.SchoolId == schoolId && e.EffectiveFrom <= rangeEnd &&
            (e.EffectiveTo == null || e.EffectiveTo >= date));
        if (User.IsInRole("Student"))
            return await enrollments.Where(e => e.Student!.UserId == userId)
                .Select(e => e.SectionId).Distinct().ToListAsync(ct);
        if (User.IsInRole("Parent"))
            return await enrollments.Where(e => db.StudentGuardians.Any(sg =>
                    sg.TenantId == tenantId && sg.StudentId == e.StudentId &&
                    sg.Guardian!.UserId == userId && sg.ReceivesNotifications))
                .Select(e => e.SectionId).Distinct().ToListAsync(ct);
        return [];
    }

    private static async Task<bool> HasAllowedFileSignatureAsync(IFormFile file, string extension, CancellationToken ct)
    {
        var header = new byte[12];
        await using var stream = file.OpenReadStream();
        var read = await stream.ReadAsync(header, ct);
        return extension switch
        {
            ".pdf" => read >= 5 && header.AsSpan(0, 5).SequenceEqual("%PDF-"u8),
            ".png" => read >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            ".jpg" or ".jpeg" => read >= 3 && header[0] == 0xff && header[1] == 0xd8 && header[2] == 0xff,
            ".webp" => read >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };
    }

    private Guid Tenant() => Guid.Parse(User.FindFirstValue("tid")!);
    private string Actor() => User.FindFirstValue(ClaimTypes.Email) ?? "staff";
}
