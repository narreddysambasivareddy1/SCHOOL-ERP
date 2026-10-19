using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;

namespace SchoolERP.API.Controllers;

public record SavePeriodRequest(Guid AcademicYearId, Guid? Id, string Name, int SortOrder, string StartTime, string EndTime, string Band);
public record SaveSlotRequest(Guid AcademicYearId, Guid ClassId, Guid SectionId, int DayOfWeek, Guid PeriodId, Guid SubjectId, Guid EmployeeId, string? ElectiveGroup);
public record DiaryDeadlineRequest(string DiaryDeadline);

[ApiController]
[Route("api/schools/{schoolId}/timetable")]
[Authorize]
public class TimetableController(AcademicOpsService ops, AppDbContext db) : ControllerBase
{
    [HttpGet("settings")]
    public async Task<IActionResult> Settings(Guid schoolId, CancellationToken ct)
    {
        try
        {
            var s = await ops.SettingsAsync(schoolId, Tenant(), ct);
            return Ok(new { diaryDeadline = s.DiaryDeadline.ToString("HH:mm") });
        }
        catch (InvalidOperationException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPut("settings")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> SaveSettings(Guid schoolId, [FromBody] DiaryDeadlineRequest body, CancellationToken ct)
    {
        if (!TimeOnly.TryParse(body.DiaryDeadline, out var t)) return BadRequest(new { error = "Use HH:mm for the diary deadline." });
        try { return Ok(await ops.SaveSettingsAsync(schoolId, Tenant(), t, ct)); }
        catch (InvalidOperationException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("periods")]
    public async Task<IActionResult> Periods(Guid schoolId, [FromQuery] Guid academicYearId, CancellationToken ct)
    {
        try
        {
            await ops.EnsureDefaultPeriodsAsync(schoolId, Tenant(), academicYearId, ct);
            return Ok(await ops.PeriodsAsync(schoolId, academicYearId, Tenant(), ct));
        }
        catch (InvalidOperationException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("periods")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> SavePeriod(Guid schoolId, [FromBody] SavePeriodRequest body, CancellationToken ct)
    {
        if (!TimeOnly.TryParse(body.StartTime, out var start) || !TimeOnly.TryParse(body.EndTime, out var end))
            return BadRequest(new { error = "Start and end times must be HH:mm." });
        if (!Enum.TryParse<PeriodBand>(body.Band, true, out var band))
            return BadRequest(new { error = "Band must be Morning or Evening." });
        try
        {
            return Ok(await ops.SavePeriodAsync(schoolId, Tenant(), body.AcademicYearId, body.Id, body.Name, body.SortOrder, start, end, band, Actor(), ct));
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("grid")]
    public async Task<IActionResult> Grid(Guid schoolId, [FromQuery] Guid academicYearId, [FromQuery] Guid sectionId, [FromQuery] DateOnly? date, CancellationToken ct)
    {
        try
        {
            var visibleSections = await VisibleSectionsAsync(schoolId, date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5)), ct);
            if (visibleSections is not null && !visibleSections.Contains(sectionId)) return Forbid();
            await ops.EnsureDefaultPeriodsAsync(schoolId, Tenant(), academicYearId, ct);
            return Ok(await ops.GridAsync(schoolId, Tenant(), academicYearId, sectionId, date, ct));
        }
        catch (InvalidOperationException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("slots")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> Slot(Guid schoolId, [FromBody] SaveSlotRequest body, CancellationToken ct)
    {
        try
        {
            return Ok(await ops.UpsertSlotAsync(schoolId, Tenant(), body.AcademicYearId, body.ClassId, body.SectionId,
                body.DayOfWeek, body.PeriodId, body.SubjectId, body.EmployeeId, body.ElectiveGroup, Actor(), ct));
        }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpDelete("slots/{id:guid}")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> Clear(Guid schoolId, Guid id, CancellationToken ct)
    {
        try { await ops.ClearSlotAsync(schoolId, Tenant(), id, ct); return NoContent(); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    private Guid Tenant() => Guid.Parse(User.FindFirstValue("tid")!);
    private string Actor() => User.FindFirstValue(ClaimTypes.Email) ?? "staff";

    private async Task<List<Guid>?> VisibleSectionsAsync(Guid schoolId, DateOnly date, CancellationToken ct)
    {
        if (User.IsInRole("SchoolAdmin") || User.IsInRole("HRManager") ||
            User.IsInRole("PlatformSuperAdmin")) return null;
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId)) return [];
        var tenantId = Tenant();
        if (User.IsInRole("Teacher"))
            return await db.TeacherAssignments.Where(a => a.TenantId == tenantId && a.IsActive &&
                    a.Employee!.SchoolId == schoolId && a.Employee.UserId == userId)
                .Select(a => a.SectionId).Distinct().ToListAsync(ct);

        var enrollments = db.StudentEnrollments.Where(e => e.TenantId == tenantId &&
            e.Student!.SchoolId == schoolId && e.EffectiveFrom <= date &&
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
}
