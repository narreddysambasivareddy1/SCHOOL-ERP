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
    [HttpGet("summary")]
    public async Task<IActionResult> Summary(Guid schoolId, CancellationToken ct)
        => Ok(await registrations.SummaryAsync(schoolId, Tenant(), ct));

    [HttpGet]
    public async Task<IActionResult> List(Guid schoolId, [FromQuery] string? search, [FromQuery] Guid? academicYearId, [FromQuery] Guid? classId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] string? feeStatus, [FromQuery] string? documentStatus, [FromQuery] string? status, [FromQuery] string? sort, [FromQuery] bool desc = true, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => Ok(await registrations.ListAsync(schoolId, Tenant(), search, academicYearId, classId, from, to, feeStatus, documentStatus, status, sort, desc, page, pageSize, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid schoolId, Guid id, CancellationToken ct)
    {
        try { return Ok(await registrations.GetAsync(schoolId, Tenant(), id, ct)); }
        catch (InvalidOperationException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid schoolId, Guid id, [FromBody] CreateRegistrationRequest body, CancellationToken ct)
    {
        try { return Ok(await registrations.UpdateAsync(schoolId, Tenant(), id, body, Actor(), ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer")]
    public async Task<IActionResult> Cancel(Guid schoolId, Guid id, CancellationToken ct)
    {
        try { return Ok(await registrations.CancelAsync(schoolId, Tenant(), id, Actor(), ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

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

    [HttpGet("{id:guid}/acknowledgement")]
    public async Task<IActionResult> Acknowledgement(Guid schoolId, Guid id, CancellationToken ct)
    {
        var reg = await registrations.Require(schoolId, Tenant(), id, ct);
        var school = await db.Schools.AsNoTracking().FirstAsync(s => s.Id == schoolId && s.TenantId == Tenant(), ct);
        return Content(registrations.AcknowledgementHtml(reg, school.Name), "text/html");
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
        if (file is null || file.Length == 0 || file.Length > 8_000_000)
            return BadRequest(new { error = "Choose a non-empty document no larger than 8 MB." });
        if (!Enum.TryParse<StudentDocumentKind>(kind, true, out var k) || k == StudentDocumentKind.Other)
            return BadRequest(new { error = "Document kind must be Photo, Identity or TransferCertificate." });
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".pdf" or ".png" or ".jpg" or ".jpeg" or ".webp")
            || !await HasAllowedFileSignatureAsync(file, extension, ct))
            return BadRequest(new { error = "Only valid PDF, PNG, JPEG, or WebP documents are allowed." });
        var dir = Path.Combine(env.ContentRootPath, "private-uploads", Tenant().ToString(), schoolId.ToString(), id.ToString());
        Directory.CreateDirectory(dir);
        var safe = $"{k}-{Guid.NewGuid():N}{extension}";
        var full = Path.Combine(dir, safe);
        await using (var stream = System.IO.File.Create(full))
            await file.CopyToAsync(stream, ct);
        var relative = Path.Combine(Tenant().ToString(), schoolId.ToString(), id.ToString(), safe);
        try
        {
            return Ok(await registrations.SaveDocumentAsync(schoolId, Tenant(), id, k, file.FileName, ContentTypeFor(extension), relative, ct));
        }
        catch (InvalidOperationException ex)
        {
            if (System.IO.File.Exists(full)) System.IO.File.Delete(full);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("documents/{documentId:guid}/file")]
    public async Task<IActionResult> Download(Guid schoolId, Guid documentId, CancellationToken ct)
    {
        var tenantId = Tenant();
        var doc = await db.StudentDocuments.AsNoTracking().FirstOrDefaultAsync(d =>
            d.Id == documentId && d.SchoolId == schoolId && d.TenantId == tenantId, ct);
        if (doc is null || string.IsNullOrWhiteSpace(doc.RelativePath)) return NotFound();

        var path = ResolvePrivateFile(doc.RelativePath);
        if (path is null) return NotFound();
        return PhysicalFile(path, string.IsNullOrWhiteSpace(doc.ContentType) ? "application/octet-stream" : doc.ContentType, doc.FileName);
    }

    public record RejectDocumentRequest(string Reason);

    [HttpPost("documents/{documentId:guid}/verify")]
    [Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer")]
    public async Task<IActionResult> Verify(Guid schoolId, Guid documentId, CancellationToken ct)
    {
        try { await registrations.VerifyDocumentAsync(schoolId, Tenant(), documentId, Actor(), ct); return Ok(new { verified = true }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("documents/{documentId:guid}/reject")]
    [Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer")]
    public async Task<IActionResult> RejectDocument(Guid schoolId, Guid documentId, [FromBody] RejectDocumentRequest body, CancellationToken ct)
    {
        try { await registrations.RejectDocumentAsync(schoolId, Tenant(), documentId, body.Reason, Actor(), ct); return Ok(new { verified = false, status = "Rejected" }); }
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

    private string? ResolvePrivateFile(string relativePath)
    {
        foreach (var folder in new[] { "private-uploads", "uploads" })
        {
            var root = Path.GetFullPath(Path.Combine(env.ContentRootPath, folder));
            var path = Path.GetFullPath(Path.Combine(root, relativePath));
            var prefix = root.EndsWith(Path.DirectorySeparatorChar) ? root : root + Path.DirectorySeparatorChar;
            if (!path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) return null;
            if (System.IO.File.Exists(path)) return path;
        }
        return null;
    }

    private static string ContentTypeFor(string extension) => extension switch
    {
        ".pdf" => "application/pdf",
        ".png" => "image/png",
        ".webp" => "image/webp",
        ".jpg" or ".jpeg" => "image/jpeg",
        _ => "application/octet-stream"
    };

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
            ".webp" => read >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };
    }

    private Guid Tenant() => Guid.Parse(User.FindFirstValue("tid")!);
    private string Actor() => User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "staff";
}
