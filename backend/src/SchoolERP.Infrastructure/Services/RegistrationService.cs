using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.DTOs;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Services;

public class RegistrationService(AppDbContext db)
{
    public async Task<IReadOnlyList<object>> ListAsync(Guid schoolId, Guid tenantId, CancellationToken ct)
    {
        return await db.StudentRegistrations
            .Where(r => r.SchoolId == schoolId && r.TenantId == tenantId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id, r.RegistrationNumber, r.FirstName, r.LastName, r.GuardianName, r.GuardianPhone,
                status = r.Status.ToString(), r.FeePaid, r.FeeReceiptNumber, r.AdmissionNumber, r.BonafideNumber,
                r.PhotoUrl, r.StudentId, r.CreatedAt
            })
            .Take(200)
            .ToListAsync(ct);
    }

    public async Task<object> CreateAsync(Guid schoolId, Guid tenantId, CreateRegistrationRequest req, string actor, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.FirstName) || string.IsNullOrWhiteSpace(req.LastName))
            throw new InvalidOperationException("Student name is required.");
        if (string.IsNullOrWhiteSpace(req.GuardianName) || string.IsNullOrWhiteSpace(req.GuardianPhone))
            throw new InvalidOperationException("Guardian name and phone are required.");
        _ = await db.Sections.FirstOrDefaultAsync(s => s.Id == req.PreferredSectionId, ct)
            ?? throw new InvalidOperationException("Preferred section not found.");

        var year = DateTime.UtcNow.Year;
        var seq = await db.StudentRegistrations.CountAsync(r => r.SchoolId == schoolId && r.CreatedAt.Year == year, ct) + 1;
        var registration = new StudentRegistration
        {
            TenantId = tenantId,
            SchoolId = schoolId,
            AcademicYearId = req.AcademicYearId,
            RegistrationNumber = $"REG-{year}-{seq:D4}",
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            DateOfBirth = req.DateOfBirth,
            Gender = req.Gender,
            PreferredClassId = req.PreferredClassId,
            PreferredSectionId = req.PreferredSectionId,
            GuardianName = req.GuardianName.Trim(),
            GuardianPhone = new string(req.GuardianPhone.Where(char.IsDigit).ToArray()),
            GuardianEmail = req.GuardianEmail,
            Relationship = string.IsNullOrWhiteSpace(req.Relationship) ? "Parent" : req.Relationship,
            RegistrationFeeAmount = req.RegistrationFeeAmount,
            Status = RegistrationStatus.Registered,
            CreatedBy = actor
        };
        db.StudentRegistrations.Add(registration);
        await db.SaveChangesAsync(ct);
        return new { registration.Id, registration.RegistrationNumber, status = registration.Status.ToString() };
    }

    public async Task<object> PayFeeAsync(Guid schoolId, Guid tenantId, Guid id, PayRegistrationFeeRequest req, string actor, CancellationToken ct)
    {
        var reg = await Require(schoolId, tenantId, id, ct);
        if (reg.Status == RegistrationStatus.Confirmed)
            throw new InvalidOperationException("Registration is already confirmed.");
        reg.FeePaid = true;
        reg.FeeReceiptNumber = $"RFE-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        if (req.Amount > 0) reg.RegistrationFeeAmount = req.Amount;
        reg.Status = RegistrationStatus.FeePaid;
        await db.SaveChangesAsync(ct);
        return new { reg.Id, reg.RegistrationNumber, reg.FeeReceiptNumber, status = reg.Status.ToString() };
    }

    public async Task<object> ConfirmAsync(Guid schoolId, Guid tenantId, Guid id, string actor, CancellationToken ct)
    {
        var reg = await Require(schoolId, tenantId, id, ct);
        if (reg.Status == RegistrationStatus.Confirmed && reg.StudentId is not null)
            return new { reg.Id, reg.RegistrationNumber, reg.AdmissionNumber, reg.StudentId, status = "Confirmed" };
        if (!reg.FeePaid)
            throw new InvalidOperationException("Collect the registration fee before seat confirmation.");

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var count = await db.Students.CountAsync(s => s.SchoolId == schoolId, ct);
        var admission = $"STU-{DateTime.UtcNow.Year}-{count + 1:D4}";
        var student = new Student
        {
            TenantId = tenantId,
            SchoolId = schoolId,
            StudentCode = admission,
            FirstName = reg.FirstName,
            LastName = reg.LastName,
            DateOfBirth = reg.DateOfBirth,
            PhotoUrl = reg.PhotoUrl,
            Status = StudentStatus.Active,
            CreatedBy = actor
        };
        student.Enrollments.Add(new StudentEnrollment
        {
            TenantId = tenantId,
            AcademicYearId = reg.AcademicYearId,
            ClassId = reg.PreferredClassId,
            SectionId = reg.PreferredSectionId,
            EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedBy = actor
        });
        var names = reg.GuardianName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var guardian = new Guardian
        {
            TenantId = tenantId,
            FirstName = names[0],
            LastName = names.Length > 1 ? names[1] : "",
            Phone = reg.GuardianPhone,
            Email = reg.GuardianEmail,
            CreatedBy = actor
        };
        student.Guardians.Add(new StudentGuardian
        {
            TenantId = tenantId,
            Guardian = guardian,
            Relationship = reg.Relationship,
            IsPrimary = true,
            ReceivesNotifications = true
        });
        db.Students.Add(student);
        await db.SaveChangesAsync(ct);

        foreach (var doc in await db.StudentDocuments.Where(d => d.RegistrationId == reg.Id).ToListAsync(ct))
            doc.StudentId = student.Id;

        reg.StudentId = student.Id;
        reg.AdmissionNumber = admission;
        reg.Status = RegistrationStatus.Confirmed;
        reg.ConfirmedBy = actor;
        reg.ConfirmedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return new { reg.Id, reg.RegistrationNumber, admissionNumber = admission, studentId = student.Id, status = "Confirmed" };
    }

    public async Task<object> IssueBonafideAsync(Guid schoolId, Guid tenantId, Guid registrationId, string actor, CancellationToken ct)
    {
        var reg = await Require(schoolId, tenantId, registrationId, ct);
        if (reg.StudentId is null) throw new InvalidOperationException("Confirm the seat before issuing a bonafide number.");
        var verified = await db.StudentDocuments.CountAsync(d =>
            d.RegistrationId == reg.Id && d.Verified &&
            (d.Kind == StudentDocumentKind.Identity || d.Kind == StudentDocumentKind.TransferCertificate), ct);
        if (verified < 1)
            throw new InvalidOperationException("Verify at least one identity or transfer certificate before issuing a bonafide number.");
        if (string.IsNullOrEmpty(reg.BonafideNumber))
        {
            var n = await db.StudentRegistrations.CountAsync(r => r.SchoolId == schoolId && r.BonafideNumber != null, ct) + 1;
            reg.BonafideNumber = $"BON-{DateTime.UtcNow.Year}-{n:D4}";
            await db.SaveChangesAsync(ct);
        }
        return new { reg.BonafideNumber, reg.AdmissionNumber, actor };
    }

    public string AdmissionFormHtml(StudentRegistration reg, string schoolName)
    {
        const string css = "body{font-family:Georgia,serif;padding:32px;color:#17365D}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}td{border:1px solid #d9e2ec;padding:8px}";
        return "<html><head><title>" + reg.AdmissionNumber + "</title><style>" + css + "</style></head><body>"
            + "<h1>" + System.Net.WebUtility.HtmlEncode(schoolName) + "</h1><p>Admission Form</p><table>"
            + "<tr><td>Registration No.</td><td>" + reg.RegistrationNumber + "</td></tr>"
            + "<tr><td>Admission No.</td><td>" + reg.AdmissionNumber + "</td></tr>"
            + "<tr><td>Student</td><td>" + System.Net.WebUtility.HtmlEncode(reg.FirstName) + " " + System.Net.WebUtility.HtmlEncode(reg.LastName) + "</td></tr>"
            + "<tr><td>Date of birth</td><td>" + reg.DateOfBirth + "</td></tr>"
            + "<tr><td>Guardian</td><td>" + System.Net.WebUtility.HtmlEncode(reg.GuardianName) + " · " + reg.GuardianPhone + "</td></tr>"
            + "<tr><td>Fee receipt</td><td>" + reg.FeeReceiptNumber + "</td></tr>"
            + "<tr><td>Confirmed</td><td>" + (reg.ConfirmedAt?.ToString("yyyy-MM-dd") ?? "") + " by " + System.Net.WebUtility.HtmlEncode(reg.ConfirmedBy) + "</td></tr>"
            + "</table><p>Print this page or use the browser Save as PDF action for a signed copy.</p></body></html>";
    }

    public async Task<StudentRegistration> Require(Guid schoolId, Guid tenantId, Guid id, CancellationToken ct) =>
        await db.StudentRegistrations.FirstOrDefaultAsync(r => r.Id == id && r.SchoolId == schoolId && r.TenantId == tenantId, ct)
        ?? throw new InvalidOperationException("Registration not found.");

    public async Task<object> SaveDocumentAsync(Guid schoolId, Guid tenantId, Guid registrationId, StudentDocumentKind kind, string fileName, string contentType, string relativePath, CancellationToken ct)
    {
        var reg = await Require(schoolId, tenantId, registrationId, ct);
        var doc = new StudentDocument
        {
            TenantId = tenantId, SchoolId = schoolId, RegistrationId = registrationId, StudentId = reg.StudentId,
            Kind = kind, FileName = fileName, ContentType = contentType, RelativePath = relativePath
        };
        db.StudentDocuments.Add(doc);
        var url = "/uploads/" + relativePath.Replace('\\', '/');
        if (kind == StudentDocumentKind.Photo)
            reg.PhotoUrl = url;
        await db.SaveChangesAsync(ct);
        return new { doc.Id, doc.Kind, url };
    }

    public async Task VerifyDocumentAsync(Guid schoolId, Guid tenantId, Guid documentId, string actor, CancellationToken ct)
    {
        var doc = await db.StudentDocuments.FirstOrDefaultAsync(d => d.Id == documentId && d.SchoolId == schoolId && d.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("Document not found.");
        doc.Verified = true;
        doc.VerifiedBy = actor;
        doc.VerifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<object>> DocumentsAsync(Guid schoolId, Guid tenantId, Guid registrationId, CancellationToken ct) =>
        await db.StudentDocuments.Where(d => d.SchoolId == schoolId && d.TenantId == tenantId && d.RegistrationId == registrationId)
            .Select(d => new { d.Id, kind = d.Kind.ToString(), d.FileName, url = "/uploads/" + d.RelativePath.Replace("\\", "/"), d.Verified, d.VerifiedBy })
            .ToListAsync(ct);

    public async Task<object> PreviewImportAsync(Guid schoolId, Guid academicYearId, string csv, CancellationToken ct)
    {
        var (rows, errors, preview) = await ValidateImportAsync(schoolId, csv, ct);
        return new { academicYearId, total = rows.Count, errors, rows = preview };
    }

    public async Task<object> CommitImportAsync(Guid schoolId, Guid tenantId, Guid academicYearId, string csv, string actor, CancellationToken ct)
    {
        var (parsed, errors, _) = await ValidateImportAsync(schoolId, csv, ct);
        if (errors > 0) throw new InvalidOperationException("Fix validation errors before committing. No rows were imported.");
        var classes = await db.Classes.Where(c => c.SchoolId == schoolId).Include(c => c.Sections).ToListAsync(ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var created = 0;
        foreach (var row in parsed)
        {
            var cls = classes.First(c => c.Name.Equals(Row(row, "className"), StringComparison.OrdinalIgnoreCase));
            var section = cls.Sections.First(s => s.Name.Equals(Row(row, "sectionName"), StringComparison.OrdinalIgnoreCase));
            var req = new CreateStudentRequest(
                Row(row, "firstName"), Row(row, "lastName"),
                DateOnly.Parse(Row(row, "dateOfBirth"), CultureInfo.InvariantCulture),
                academicYearId, cls.Id, section.Id, Row(row, "rollNumber"));
            var studentService = new StudentService(db);
            await studentService.CreateStudentAsync(req, schoolId, tenantId, actor, ct);
            created++;
        }
        await tx.CommitAsync(ct);
        return new { imported = created };
    }

    private async Task<(List<Dictionary<string, string>> Rows, int Errors, List<object> Preview)> ValidateImportAsync(Guid schoolId, string csv, CancellationToken ct)
    {
        var classes = await db.Classes.Where(c => c.SchoolId == schoolId).Include(c => c.Sections).ToListAsync(ct);
        var rows = ParseCsv(csv);
        var preview = new List<object>();
        var errors = 0;
        foreach (var row in rows)
        {
            var issues = new List<string>();
            if (string.IsNullOrWhiteSpace(Row(row, "firstName"))) issues.Add("firstName required");
            if (string.IsNullOrWhiteSpace(Row(row, "lastName"))) issues.Add("lastName required");
            if (!DateOnly.TryParse(Row(row, "dateOfBirth"), CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                issues.Add("dateOfBirth must be YYYY-MM-DD");
            var cls = classes.FirstOrDefault(c => c.Name.Equals(Row(row, "className"), StringComparison.OrdinalIgnoreCase));
            if (cls is null) issues.Add("className not found");
            else if (!cls.Sections.Any(s => s.Name.Equals(Row(row, "sectionName"), StringComparison.OrdinalIgnoreCase)))
                issues.Add("sectionName not found");
            if (issues.Count > 0) errors++;
            preview.Add(new { row, issues, valid = issues.Count == 0 });
        }
        return (rows, errors, preview);
    }

    private static string Row(Dictionary<string, string> row, string key) =>
        row.TryGetValue(key.ToLowerInvariant(), out var v) ? v.Trim() : "";

    private static List<Dictionary<string, string>> ParseCsv(string csv)
    {
        var lines = csv.Replace("\r\n", "\n").Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length < 2) return [];
        var headers = SplitCsvLine(lines[0]).Select(h => h.Trim().Trim('"').ToLowerInvariant()).ToArray();
        var list = new List<Dictionary<string, string>>();
        for (var i = 1; i < lines.Length; i++)
        {
            var cols = SplitCsvLine(lines[i]);
            var map = new Dictionary<string, string>();
            for (var c = 0; c < headers.Length; c++)
                map[headers[c]] = c < cols.Count ? cols[c].Trim().Trim('"') : "";
            list.Add(map);
        }
        return list;
    }

    private static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        var cur = new StringBuilder();
        var quoted = false;
        foreach (var ch in line)
        {
            if (ch == '"') { quoted = !quoted; continue; }
            if (ch == ',' && !quoted) { result.Add(cur.ToString()); cur.Clear(); continue; }
            cur.Append(ch);
        }
        result.Add(cur.ToString());
        return result;
    }
}
