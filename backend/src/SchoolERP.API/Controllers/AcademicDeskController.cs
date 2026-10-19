using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Services;

namespace SchoolERP.API.Controllers;

public record AssignSubstituteRequest(Guid SubstituteEmployeeId);
public record LessonDayDto(int DayOfWeek, string Topic);
public record SaveLessonPlanRequest(Guid AcademicYearId, DateOnly WeekStart, Guid ClassId, Guid SectionId, Guid SubjectId, Guid? EmployeeId, IReadOnlyList<LessonDayDto> Days);
public record SaveDiaryRequest(Guid AcademicYearId, DateOnly Date, Guid ClassId, Guid SectionId, Guid? SubjectId, Guid? EmployeeId, string? Notes, string? Homework);

[ApiController]
[Authorize]
public class AcademicDeskController(AcademicOpsService ops, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet("api/schools/{schoolId}/ops-today")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> OpsToday(Guid schoolId, [FromQuery] Guid academicYearId, CancellationToken ct)
        => Ok(await ops.OpsTodayAsync(schoolId, Tenant(), academicYearId, DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5)), ct));

    [HttpGet("api/schools/{schoolId}/substitutions")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Substitutions(Guid schoolId, [FromQuery] DateOnly? date, CancellationToken ct)
        => Ok(await ops.SubstitutionsAsync(schoolId, Tenant(), date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5)), ct));

    [HttpGet("api/schools/{schoolId}/substitutions/available")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Available(Guid schoolId, [FromQuery] Guid academicYearId, [FromQuery] DateOnly date, [FromQuery] Guid periodId, CancellationToken ct)
        => Ok(await ops.AvailableTeachersAsync(schoolId, Tenant(), academicYearId, date, periodId, ct));

    [HttpPost("api/schools/{schoolId}/substitutions/{id:guid}/assign")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Assign(Guid schoolId, Guid id, [FromBody] AssignSubstituteRequest body, CancellationToken ct)
    {
        try { await ops.AssignSubstituteAsync(schoolId, Tenant(), id, body.SubstituteEmployeeId, ct); return Ok(new { assigned = true }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("api/schools/{schoolId}/lesson-plans")]
    public async Task<IActionResult> Plans(Guid schoolId, [FromQuery] DateOnly weekStart, [FromQuery] Guid? sectionId, CancellationToken ct)
        => Ok(await ops.LessonPlansAsync(schoolId, Tenant(), weekStart, sectionId, ct));

    [HttpPost("api/schools/{schoolId}/lesson-plans")]
    [Authorize(Roles = "SchoolAdmin,Teacher")]
    public async Task<IActionResult> SavePlan(Guid schoolId, [FromBody] SaveLessonPlanRequest body, CancellationToken ct)
    {
        var employeeId = body.EmployeeId ?? await RequireEmployee(schoolId, ct);
        if (employeeId is null) return BadRequest(new { error = "Link your login to a staff record, or choose a teacher." });
        try
        {
            return Ok(await ops.SaveLessonPlanAsync(schoolId, Tenant(), body.AcademicYearId, body.WeekStart, body.ClassId, body.SectionId,
                body.SubjectId, employeeId.Value, body.Days.Select(d => (d.DayOfWeek, d.Topic)).ToList(), Actor(), ct));
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("api/schools/{schoolId}/diaries")]
    public async Task<IActionResult> Diaries(Guid schoolId, [FromQuery] DateOnly date, [FromQuery] Guid? sectionId, CancellationToken ct)
        => Ok(await ops.DiariesAsync(schoolId, Tenant(), date, sectionId, ct));

    [HttpPost("api/schools/{schoolId}/diaries")]
    [Authorize(Roles = "SchoolAdmin,Teacher")]
    public async Task<IActionResult> SaveDiary(Guid schoolId, [FromBody] SaveDiaryRequest body, CancellationToken ct)
    {
        var employeeId = body.EmployeeId ?? await RequireEmployee(schoolId, ct);
        if (employeeId is null) return BadRequest(new { error = "Link your login to a staff record." });
        return Ok(await ops.SaveDiaryAsync(schoolId, Tenant(), body.AcademicYearId, body.Date, body.ClassId, body.SectionId,
            body.SubjectId, employeeId.Value, DiaryEntryMode.Digital, body.Notes, body.Homework, null, null, Actor(), ct));
    }

    [HttpPost("api/schools/{schoolId}/diaries/scan")]
    [Authorize(Roles = "SchoolAdmin,Teacher")]
    [RequestSizeLimit(8_000_000)]
    public async Task<IActionResult> ScanDiary(Guid schoolId, [FromForm] Guid academicYearId, [FromForm] DateOnly date,
        [FromForm] Guid classId, [FromForm] Guid sectionId, [FromForm] Guid? subjectId, IFormFile file, CancellationToken ct)
    {
        var employeeId = await RequireEmployee(schoolId, ct);
        if (employeeId is null) return BadRequest(new { error = "Link your login to a staff record." });
        if (file is null || file.Length == 0) return BadRequest(new { error = "Upload a scanned diary image or PDF." });
        var dir = Path.Combine(env.ContentRootPath, "uploads", Tenant().ToString(), schoolId.ToString(), "diaries");
        Directory.CreateDirectory(dir);
        var safe = $"diary-{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
        await using (var stream = System.IO.File.Create(Path.Combine(dir, safe)))
            await file.CopyToAsync(stream, ct);
        var relative = Path.Combine(Tenant().ToString(), schoolId.ToString(), "diaries", safe);
        return Ok(await ops.SaveDiaryAsync(schoolId, Tenant(), academicYearId, date, classId, sectionId, subjectId,
            employeeId.Value, DiaryEntryMode.Scan, null, null, file.FileName, relative, Actor(), ct));
    }

    [HttpGet("api/schools/{schoolId}/diaries/compliance")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> Compliance(Guid schoolId, [FromQuery] Guid academicYearId, [FromQuery] DateOnly? date, CancellationToken ct)
        => Ok(await ops.ComplianceAsync(schoolId, Tenant(), academicYearId, date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5)), ct));

    [HttpPost("api/schools/{schoolId}/diaries/remind")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> Remind(Guid schoolId, [FromQuery] Guid academicYearId, [FromQuery] DateOnly? date, CancellationToken ct)
    {
        var n = await ops.RemindPendingAsync(schoolId, Tenant(), academicYearId, date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5)), ct);
        return Ok(new { reminded = n });
    }

    private async Task<Guid?> RequireEmployee(Guid schoolId, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId)) return null;
        var emp = await ops.EmployeeForUserAsync(schoolId, userId, ct);
        return emp?.Id;
    }

    private Guid Tenant() => Guid.Parse(User.FindFirstValue("tid")!);
    private string Actor() => User.FindFirstValue(ClaimTypes.Email) ?? "staff";
}
