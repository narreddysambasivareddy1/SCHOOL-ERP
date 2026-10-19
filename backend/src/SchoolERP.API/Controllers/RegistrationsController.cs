using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.DTOs;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/schools/{schoolId}/registrations")]
[Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer,FrontOffice")]
public class RegistrationsController(RegistrationService registrations, AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid schoolId, CancellationToken ct)
        => Ok(await registrations.ListAsync(schoolId, Tenant(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(Guid schoolId, [FromBody] CreateRegistrationRequest body, CancellationToken ct)
    {
        try { return Ok(await registrations.CreateAsync(schoolId, Tenant(), body, Actor(), ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/fee")]
    public async Task<IActionResult> Fee(Guid schoolId, Guid id, [FromBody] PayRegistrationFeeRequest body, CancellationToken ct)
    {
        try { return Ok(await registrations.PayFeeAsync(schoolId, Tenant(), id, body, Actor(), ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/confirm")]
    [Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer")]
    public async Task<IActionResult> Confirm(Guid schoolId, Guid id, CancellationToken ct)
    {
        try { return Ok(await registrations.ConfirmAsync(schoolId, Tenant(), id, Actor(), ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/bonafide")]
    [Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer")]
    public async Task<IActionResult> Bonafide(Guid schoolId, Guid id, CancellationToken ct)
    {
        try { return Ok(await registrations.IssueBonafideAsync(schoolId, Tenant(), id, Actor(), ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("{id:guid}/admission-form")]
    public async Task<IActionResult> AdmissionForm(Guid schoolId, Guid id, CancellationToken ct)
    {
        var reg = await registrations.Require(schoolId, Tenant(), id, ct);
        if (string.IsNullOrEmpty(reg.AdmissionNumber))
            return BadRequest(new { error = "Confirm the seat before printing the admission form." });
        var school = await db.Schools.AsNoTracking().FirstAsync(s => s.Id == schoolId, ct);
        return Content(registrations.AdmissionFormHtml(reg, school.Name), "text/html");
    }

    [HttpGet("{id:guid}/documents")]
    public async Task<IActionResult> Documents(Guid schoolId, Guid id, CancellationToken ct)
        => Ok(await registrations.DocumentsAsync(schoolId, Tenant(), id, ct));

    [HttpPost("{id:guid}/documents")]
    [RequestSizeLimit(8_000_000)]
    public async Task<IActionResult> Upload(Guid schoolId, Guid id, [FromForm] IFormFile file, [FromForm] string kind, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "Choose a file or capture a photo." });
        if (!Enum.TryParse<StudentDocumentKind>(kind, true, out var k))
            return BadRequest(new { error = "Document kind must be Photo, Identity or TransferCertificate." });
        var dir = Path.Combine(env.ContentRootPath, "uploads", Tenant().ToString(), schoolId.ToString(), id.ToString());
        Directory.CreateDirectory(dir);
        var safe = $"{k}-{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
        var full = Path.Combine(dir, safe);
        await using (var stream = System.IO.File.Create(full))
            await file.CopyToAsync(stream, ct);
        var relative = Path.Combine(Tenant().ToString(), schoolId.ToString(), id.ToString(), safe);
        try
        {
            return Ok(await registrations.SaveDocumentAsync(schoolId, Tenant(), id, k, file.FileName, file.ContentType, relative, ct));
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("documents/{documentId:guid}/verify")]
    public async Task<IActionResult> Verify(Guid schoolId, Guid documentId, CancellationToken ct)
    {
        try { await registrations.VerifyDocumentAsync(schoolId, Tenant(), documentId, Actor(), ct); return Ok(new { verified = true }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("import/template")]
    [AllowAnonymous]
    public IActionResult Template()
    {
        const string csv = "firstName,lastName,dateOfBirth,className,sectionName,rollNumber,guardianName,guardianPhone\nAarav,Mehta,2014-06-12,Grade 5,A,1,Priya Mehta,9876543210\n";
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", "student-import-template.csv");
    }

    [HttpPost("import/preview")]
    public async Task<IActionResult> Preview(Guid schoolId, [FromQuery] Guid academicYearId, IFormFile file, CancellationToken ct)
    {
        using var reader = new StreamReader(file.OpenReadStream());
        var csv = await reader.ReadToEndAsync(ct);
        return Ok(await registrations.PreviewImportAsync(schoolId, academicYearId, csv, ct));
    }

    [HttpPost("import/commit")]
    [Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer")]
    public async Task<IActionResult> Commit(Guid schoolId, [FromQuery] Guid academicYearId, IFormFile file, CancellationToken ct)
    {
        using var reader = new StreamReader(file.OpenReadStream());
        var csv = await reader.ReadToEndAsync(ct);
        try { return Ok(await registrations.CommitImportAsync(schoolId, Tenant(), academicYearId, csv, Actor(), ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    private Guid Tenant() => Guid.Parse(User.FindFirstValue("tid")!);
    private string Actor() => User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "staff";
}
