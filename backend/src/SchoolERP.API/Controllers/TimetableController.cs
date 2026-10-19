using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Services;

namespace SchoolERP.API.Controllers;

public record SavePeriodRequest(Guid AcademicYearId, Guid? Id, string Name, int SortOrder, string StartTime, string EndTime, string Band);
public record SaveSlotRequest(Guid AcademicYearId, Guid ClassId, Guid SectionId, int DayOfWeek, Guid PeriodId, Guid SubjectId, Guid EmployeeId, string? ElectiveGroup);
public record DiaryDeadlineRequest(string DiaryDeadline);

[ApiController]
[Route("api/schools/{schoolId}/timetable")]
[Authorize]
public class TimetableController(AcademicOpsService ops) : ControllerBase
{
    [HttpGet("settings")]
    public async Task<IActionResult> Settings(Guid schoolId, CancellationToken ct)
    {
        var s = await ops.SettingsAsync(schoolId, Tenant(), ct);
        return Ok(new { diaryDeadline = s.DiaryDeadline.ToString("HH:mm") });
    }

    [HttpPut("settings")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> SaveSettings(Guid schoolId, [FromBody] DiaryDeadlineRequest body, CancellationToken ct)
    {
        if (!TimeOnly.TryParse(body.DiaryDeadline, out var t)) return BadRequest(new { error = "Use HH:mm for the diary deadline." });
        return Ok(await ops.SaveSettingsAsync(schoolId, Tenant(), t, ct));
    }

    [HttpGet("periods")]
    public async Task<IActionResult> Periods(Guid schoolId, [FromQuery] Guid academicYearId, CancellationToken ct)
    {
        await ops.EnsureDefaultPeriodsAsync(schoolId, Tenant(), academicYearId, ct);
        return Ok(await ops.PeriodsAsync(schoolId, academicYearId, Tenant(), ct));
    }

    [HttpPost("periods")]
    [Authorize(Roles = "SchoolAdmin")]
    public async Task<IActionResult> SavePeriod(Guid schoolId, [FromBody] SavePeriodRequest body, CancellationToken ct)
    {
        if (!TimeOnly.TryParse(body.StartTime, out var start) || !TimeOnly.TryParse(body.EndTime, out var end))
            return BadRequest(new { error = "Start and end times must be HH:mm." });
        if (!Enum.TryParse<PeriodBand>(body.Band, true, out var band)) band = PeriodBand.Morning;
        try
        {
            return Ok(await ops.SavePeriodAsync(schoolId, Tenant(), body.AcademicYearId, body.Id, body.Name, body.SortOrder, start, end, band, Actor(), ct));
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("grid")]
    public async Task<IActionResult> Grid(Guid schoolId, [FromQuery] Guid academicYearId, [FromQuery] Guid sectionId, [FromQuery] DateOnly? date, CancellationToken ct)
    {
        await ops.EnsureDefaultPeriodsAsync(schoolId, Tenant(), academicYearId, ct);
        return Ok(await ops.GridAsync(schoolId, Tenant(), academicYearId, sectionId, date, ct));
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
}
