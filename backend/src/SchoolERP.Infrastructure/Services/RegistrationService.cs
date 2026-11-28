using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.DTOs;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Services;

public class RegistrationService(AppDbContext db, IAuditService audit)
{
    public async Task<object> SummaryAsync(Guid schoolId, Guid tenantId, CancellationToken ct)
    {
        var query = db.StudentRegistrations.Where(r => r.SchoolId == schoolId && r.TenantId == tenantId);
        var today = DateTime.UtcNow.Date;
        var total = await query.CountAsync(ct);
        var confirmed = await query.CountAsync(r => r.Status == RegistrationStatus.Confirmed, ct);
        var rejected = await query.CountAsync(r => r.Status == RegistrationStatus.Rejected, ct);
        var pendingDocuments = await query.CountAsync(r => r.Status != RegistrationStatus.Rejected && r.Status != RegistrationStatus.Confirmed
            && (!db.StudentDocuments.Any(d => d.RegistrationId == r.Id && d.TenantId == tenantId)
                || db.StudentDocuments.Any(d => d.RegistrationId == r.Id && d.TenantId == tenantId && !d.Verified)), ct);
        return new
        {
            total,
            newToday = await query.CountAsync(r => r.CreatedAt >= today, ct),
            pendingDocuments,
            feePending = await query.CountAsync(r => !r.FeePaid && r.Status != RegistrationStatus.Rejected && r.Status != RegistrationStatus.Confirmed, ct),
            confirmed,
            rejected,
            conversionPercent = total == 0 ? 0 : Math.Round(confirmed * 100m / total, 1),
            byClass = await ClassConversionAsync(schoolId, tenantId, ct)
        };
    }

    public async Task<object> ListAsync(Guid schoolId, Guid tenantId, string? search, Guid? academicYearId, Guid? classId, DateOnly? from, DateOnly? to, string? feeStatus, string? documentStatus, string? status, string? sort, bool desc, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = db.StudentRegistrations.Where(r => r.SchoolId == schoolId && r.TenantId == tenantId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(r => r.FirstName.ToLower().Contains(term) || r.LastName.ToLower().Contains(term)
                || (r.FirstName + " " + r.LastName).ToLower().Contains(term)
                || r.RegistrationNumber.ToLower().Contains(term) || r.GuardianPhone.Contains(term));
        }
        if (academicYearId is Guid yearId) query = query.Where(r => r.AcademicYearId == yearId);
        if (classId is Guid preferredClass) query = query.Where(r => r.PreferredClassId == preferredClass);
        if (from is DateOnly start) query = query.Where(r => r.CreatedAt >= start.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        if (to is DateOnly end) query = query.Where(r => r.CreatedAt < end.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        if (string.Equals(feeStatus, "paid", StringComparison.OrdinalIgnoreCase)) query = query.Where(r => r.FeePaid);
        if (string.Equals(feeStatus, "unpaid", StringComparison.OrdinalIgnoreCase)) query = query.Where(r => !r.FeePaid);
        if (Enum.TryParse<RegistrationStatus>(status, true, out var parsed)) query = query.Where(r => r.Status == parsed);
        if (string.Equals(documentStatus, "pending", StringComparison.OrdinalIgnoreCase))
            query = query.Where(r => !db.StudentDocuments.Any(d => d.RegistrationId == r.Id) || db.StudentDocuments.Any(d => d.RegistrationId == r.Id && !d.Verified && d.VerifiedAt == null));
        if (string.Equals(documentStatus, "rejected", StringComparison.OrdinalIgnoreCase))
            query = query.Where(r => db.StudentDocuments.Any(d => d.RegistrationId == r.Id && !d.Verified && d.VerifiedAt != null));
        if (string.Equals(documentStatus, "verified", StringComparison.OrdinalIgnoreCase))
            query = query.Where(r => db.StudentDocuments.Any(d => d.RegistrationId == r.Id) && !db.StudentDocuments.Any(d => d.RegistrationId == r.Id && !d.Verified));

        var total = await query.CountAsync(ct);
        var rows = await ApplySort(query, sort, desc).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new RegistrationListRow(
                r.Id, r.RegistrationNumber, r.FirstName, r.LastName, r.GuardianName, r.GuardianPhone, r.GuardianEmail,
                r.Status.ToString(), r.FeePaid, r.FeeReceiptNumber, r.RegistrationFeeAmount, r.AdmissionNumber, r.BonafideNumber,
                r.PhotoUrl, r.StudentId, r.CreatedAt, r.AcademicYearId, r.PreferredClassId, r.PreferredSectionId, r.DateOfBirth, r.Gender, r.Relationship,
                db.Classes.Where(c => c.Id == r.PreferredClassId && c.SchoolId == schoolId).Select(c => c.Name).FirstOrDefault(),
                db.Sections.Where(s => s.Id == r.PreferredSectionId).Select(s => s.Name).FirstOrDefault()))
            .ToListAsync(ct);
        var ids = rows.Select(r => r.Id).ToList();
        var docs = await db.StudentDocuments.AsNoTracking()
            .Where(d => d.SchoolId == schoolId && d.TenantId == tenantId && d.RegistrationId != null && ids.Contains(d.RegistrationId.Value))
            .Select(d => new { d.RegistrationId, d.Kind, d.Verified, d.VerifiedAt })
            .ToListAsync(ct);
        var items = rows.Select(r => new
        {
            r.Id, r.RegistrationNumber, r.FirstName, r.LastName, r.GuardianName, r.GuardianPhone, r.GuardianEmail,
            r.Status, r.FeePaid, r.FeeReceiptNumber, r.RegistrationFeeAmount, r.AdmissionNumber, r.BonafideNumber,
            r.PhotoUrl, r.StudentId, r.CreatedAt, r.AcademicYearId, r.PreferredClassId, r.PreferredSectionId, r.DateOfBirth, r.Gender, r.Relationship,
            r.ClassName, r.SectionName,
            checklist = RequiredChecklist(docs.Where(d => d.RegistrationId == r.Id).Select(d => (d.Kind, d.Verified, d.VerifiedAt)))
        }).ToList();
        return new { items, total, page, pageSize, sort = string.IsNullOrWhiteSpace(sort) ? "created" : sort, desc };
    }

    public async Task<object> GetAsync(Guid schoolId, Guid tenantId, Guid id, CancellationToken ct)
    {
        var reg = await Require(schoolId, tenantId, id, ct);
        var documents = await DocumentsAsync(schoolId, tenantId, id, ct);
        var payments = await db.Payments.Where(p => p.SchoolId == schoolId && p.TenantId == tenantId
                && (p.ReceiptNumber == reg.FeeReceiptNumber || (reg.StudentId != null && p.StudentId == reg.StudentId)))
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new { p.Id, p.Amount, p.ReceiptNumber, p.Method, status = p.Status.ToString(), p.PaidAt, p.AcademicYearId })
            .ToListAsync(ct);
        var audits = await db.AuditEvents.Where(a => a.TenantId == tenantId && a.EntityId == id.ToString())
            .OrderByDescending(a => a.OccurredAt)
            .Select(a => new { a.Action, a.Actor, a.OccurredAt })
            .Take(30)
            .ToListAsync(ct);
        return new
        {
            reg.Id, reg.RegistrationNumber, reg.FirstName, reg.LastName, reg.DateOfBirth, reg.Gender,
            reg.AcademicYearId, reg.PreferredClassId, reg.PreferredSectionId, reg.GuardianName, reg.GuardianPhone, reg.GuardianEmail, reg.Relationship,
            reg.RegistrationFeeAmount, reg.FeePaid, reg.FeeReceiptNumber, status = reg.Status.ToString(), reg.AdmissionNumber, reg.BonafideNumber,
            reg.PhotoUrl, reg.StudentId, reg.CreatedAt, reg.ConfirmedBy, reg.ConfirmedAt, reg.CreatedBy,
            className = await db.Classes.Where(c => c.Id == reg.PreferredClassId).Select(c => c.Name).FirstOrDefaultAsync(ct),
            sectionName = await db.Sections.Where(s => s.Id == reg.PreferredSectionId).Select(s => s.Name).FirstOrDefaultAsync(ct),
            documents, payments, audits,
            checklist = RequiredChecklist(documents.Select(d => (Enum.Parse<StudentDocumentKind>(d.Kind), d.Verified, d.VerifiedAt))),
            feeMethod = await FeeMethodAsync(tenantId, id, ct),
            stage = Stage(reg, documents.Count, documents.Count(d => d.Verified))
        };
    }

    public async Task<object> CreateAsync(Guid schoolId, Guid tenantId, CreateRegistrationRequest req, string actor, CancellationToken ct)
    {
        var phone = Digits(req.GuardianPhone);
        ValidateDraft(req.FirstName, req.LastName, req.DateOfBirth, req.GuardianName, phone, req.RegistrationFeeAmount);
        await EnsurePlacement(schoolId, tenantId, req.AcademicYearId, req.PreferredClassId, req.PreferredSectionId, ct);
        await EnsureNotDuplicate(schoolId, tenantId, req.AcademicYearId, req.FirstName, req.LastName, req.DateOfBirth, phone, null, ct);

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
            GuardianPhone = phone,
            GuardianEmail = req.GuardianEmail,
            Relationship = string.IsNullOrWhiteSpace(req.Relationship) ? "Parent" : req.Relationship.Trim(),
            RegistrationFeeAmount = req.RegistrationFeeAmount,
            Status = RegistrationStatus.Registered,
            CreatedBy = actor
        };
        db.StudentRegistrations.Add(registration);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "RegistrationCreated", "StudentRegistration", registration.Id.ToString(), newValues: new { registration.RegistrationNumber });
        return new { registration.Id, registration.RegistrationNumber, registration.RegistrationFeeAmount, status = registration.Status.ToString() };
    }

    public async Task<object> UpdateAsync(Guid schoolId, Guid tenantId, Guid id, CreateRegistrationRequest req, string actor, CancellationToken ct)
    {
        var reg = await Require(schoolId, tenantId, id, ct);
        if (reg.Status is RegistrationStatus.Confirmed or RegistrationStatus.Rejected)
            throw new InvalidOperationException("A confirmed or cancelled registration cannot be edited.");
        var phone = Digits(req.GuardianPhone);
        ValidateDraft(req.FirstName, req.LastName, req.DateOfBirth, req.GuardianName, phone, req.RegistrationFeeAmount);
        if (reg.FeePaid && req.RegistrationFeeAmount != reg.RegistrationFeeAmount)
            throw new InvalidOperationException("The saved fee cannot change after it has been collected.");
        await EnsurePlacement(schoolId, tenantId, req.AcademicYearId, req.PreferredClassId, req.PreferredSectionId, ct);
        await EnsureNotDuplicate(schoolId, tenantId, req.AcademicYearId, req.FirstName, req.LastName, req.DateOfBirth, phone, id, ct);
        reg.FirstName = req.FirstName.Trim();
        reg.LastName = req.LastName.Trim();
        reg.DateOfBirth = req.DateOfBirth;
        reg.Gender = req.Gender;
        reg.AcademicYearId = req.AcademicYearId;
        reg.PreferredClassId = req.PreferredClassId;
        reg.PreferredSectionId = req.PreferredSectionId;
        reg.GuardianName = req.GuardianName.Trim();
        reg.GuardianPhone = phone;
        reg.GuardianEmail = req.GuardianEmail;
        reg.Relationship = string.IsNullOrWhiteSpace(req.Relationship) ? "Parent" : req.Relationship.Trim();
        reg.RegistrationFeeAmount = req.RegistrationFeeAmount;
        reg.UpdatedBy = actor;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "RegistrationUpdated", "StudentRegistration", reg.Id.ToString());
        return new { reg.Id, reg.RegistrationNumber, status = reg.Status.ToString() };
    }

    public async Task<object> CancelAsync(Guid schoolId, Guid tenantId, Guid id, string actor, CancellationToken ct)
    {
        var reg = await Require(schoolId, tenantId, id, ct);
        if (reg.Status == RegistrationStatus.Confirmed)
            throw new InvalidOperationException("A confirmed admission cannot be cancelled here.");
        reg.Status = RegistrationStatus.Rejected;
        reg.UpdatedBy = actor;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "RegistrationCancelled", "StudentRegistration", reg.Id.ToString());
        return new { reg.Id, status = reg.Status.ToString() };
    }

    public async Task<object> PayFeeAsync(Guid schoolId, Guid tenantId, Guid id, PayRegistrationFeeRequest req, string actor, CancellationToken ct)
    {
        var reg = await Require(schoolId, tenantId, id, ct);
        if (reg.Status == RegistrationStatus.Confirmed)
            throw new InvalidOperationException("Registration is already confirmed.");
        if (reg.Status == RegistrationStatus.Rejected)
            throw new InvalidOperationException("A cancelled registration cannot take a payment.");
        if (reg.FeePaid)
            throw new InvalidOperationException("The registration fee has already been collected.");
        if (reg.RegistrationFeeAmount <= 0)
            throw new InvalidOperationException("The saved registration fee must be greater than zero.");
        if (req.Amount <= 0)
            throw new InvalidOperationException("The payment amount must be greater than zero.");
        if (req.Amount != reg.RegistrationFeeAmount)
            throw new InvalidOperationException("Collect the saved registration fee. The draft amount is not used.");
        var method = PaymentMethod(req.Method);
        reg.FeePaid = true;
        reg.FeeReceiptNumber = $"RFE-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        reg.Status = RegistrationStatus.FeePaid;
        reg.UpdatedBy = actor;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "RegistrationFeeCollected", "StudentRegistration", reg.Id.ToString(), newValues: new { reg.FeeReceiptNumber, reg.RegistrationFeeAmount, method });
        return new { reg.Id, reg.RegistrationNumber, reg.FeeReceiptNumber, reg.RegistrationFeeAmount, method, status = reg.Status.ToString() };
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
        if (!string.IsNullOrEmpty(reg.FeeReceiptNumber) && !await db.Payments.AnyAsync(p => p.SchoolId == schoolId && p.TenantId == tenantId && p.ReceiptNumber == reg.FeeReceiptNumber, ct))
        {
            var method = await FeeMethodAsync(tenantId, reg.Id, ct) ?? "Cash";
            db.Payments.Add(new Payment
            {
                TenantId = tenantId, SchoolId = schoolId, StudentId = student.Id, AcademicYearId = reg.AcademicYearId,
                Amount = reg.RegistrationFeeAmount, Status = PaymentStatus.Successful, Method = method,
                ReceiptNumber = reg.FeeReceiptNumber, PaidAt = reg.ConfirmedAt, CreatedBy = actor
            });
        }
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await audit.LogAsync(tenantId, actor, "AdmissionConfirmed", "StudentRegistration", reg.Id.ToString(), newValues: new { admission });
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

    public string AcknowledgementHtml(StudentRegistration reg, string schoolName)
    {
        const string css = "body{font-family:Georgia,serif;padding:32px;color:#17365D}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}td{border:1px solid #d9e2ec;padding:8px}";
        return "<html><head><title>" + reg.RegistrationNumber + "</title><style>" + css + "</style></head><body>"
            + "<h1>" + System.Net.WebUtility.HtmlEncode(schoolName) + "</h1><p>Walk-in registration acknowledgement</p><table>"
            + "<tr><td>Registration No.</td><td>" + reg.RegistrationNumber + "</td></tr>"
            + "<tr><td>Student</td><td>" + System.Net.WebUtility.HtmlEncode(reg.FirstName) + " " + System.Net.WebUtility.HtmlEncode(reg.LastName) + "</td></tr>"
            + "<tr><td>Date of birth</td><td>" + reg.DateOfBirth + "</td></tr>"
            + "<tr><td>Guardian</td><td>" + System.Net.WebUtility.HtmlEncode(reg.GuardianName) + " · " + reg.GuardianPhone + "</td></tr>"
            + "<tr><td>Registration fee</td><td>" + reg.RegistrationFeeAmount + (reg.FeePaid ? " · paid " + reg.FeeReceiptNumber : " · unpaid") + "</td></tr>"
            + "<tr><td>Status</td><td>" + reg.Status + "</td></tr>"
            + "</table><p>Print this page or use the browser Save as PDF action.</p></body></html>";
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
        var url = "/api/schools/" + schoolId + "/registrations/documents/" + doc.Id + "/file";
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
        doc.ReviewNote = null;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "RegistrationDocumentVerified", "StudentDocument", doc.Id.ToString());
    }

    public async Task RejectDocumentAsync(Guid schoolId, Guid tenantId, Guid documentId, string reason, string actor, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 5)
            throw new InvalidOperationException("A rejection reason of at least 5 characters is required.");
        var doc = await db.StudentDocuments.FirstOrDefaultAsync(d => d.Id == documentId && d.SchoolId == schoolId && d.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("Document not found.");
        doc.Verified = false;
        doc.VerifiedBy = actor;
        doc.VerifiedAt = DateTime.UtcNow;
        doc.ReviewNote = reason.Trim();
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "RegistrationDocumentRejected", "StudentDocument", doc.Id.ToString(), newValues: new { doc.ReviewNote });
    }

    public async Task<List<RegistrationDocumentRow>> DocumentsAsync(Guid schoolId, Guid tenantId, Guid registrationId, CancellationToken ct)
    {
        var rows = await db.StudentDocuments.Where(d => d.SchoolId == schoolId && d.TenantId == tenantId && d.RegistrationId == registrationId)
            .Select(d => new { d.Id, d.Kind, d.FileName, d.Verified, d.VerifiedBy, d.VerifiedAt, d.ReviewNote })
            .ToListAsync(ct);
        return rows.Select(d => new RegistrationDocumentRow(d.Id, d.Kind.ToString(), d.FileName,
            "/api/schools/" + schoolId + "/registrations/documents/" + d.Id + "/file",
            d.Verified, d.VerifiedBy, d.VerifiedAt, d.ReviewNote,
            d.Verified ? "Verified" : d.VerifiedAt is null ? "Pending" : "Rejected")).ToList();
    }

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

    private async Task<List<object>> ClassConversionAsync(Guid schoolId, Guid tenantId, CancellationToken ct)
    {
        var grouped = await db.StudentRegistrations.Where(r => r.SchoolId == schoolId && r.TenantId == tenantId)
            .GroupBy(r => r.PreferredClassId)
            .Select(g => new
            {
                classId = g.Key,
                total = g.Count(),
                confirmed = g.Count(r => r.Status == RegistrationStatus.Confirmed),
                feePending = g.Count(r => !r.FeePaid && r.Status != RegistrationStatus.Rejected && r.Status != RegistrationStatus.Confirmed)
            }).ToListAsync(ct);
        var names = await db.Classes.Where(c => c.SchoolId == schoolId && c.TenantId == tenantId)
            .Select(c => new { c.Id, c.Name }).ToListAsync(ct);
        return grouped.Select(g => (object)new
        {
            g.classId,
            className = names.FirstOrDefault(n => n.Id == g.classId)?.Name ?? "Class",
            g.total,
            g.confirmed,
            g.feePending,
            conversionPercent = g.total == 0 ? 0 : Math.Round(g.confirmed * 100m / g.total, 1)
        }).ToList();
    }

    private static IQueryable<StudentRegistration> ApplySort(IQueryable<StudentRegistration> query, string? sort, bool desc) =>
        (sort ?? "created").ToLowerInvariant() switch
        {
            "name" => desc
                ? query.OrderByDescending(r => r.LastName).ThenByDescending(r => r.FirstName)
                : query.OrderBy(r => r.LastName).ThenBy(r => r.FirstName),
            "number" or "registrationnumber" => desc
                ? query.OrderByDescending(r => r.RegistrationNumber)
                : query.OrderBy(r => r.RegistrationNumber),
            "status" => desc ? query.OrderByDescending(r => r.Status) : query.OrderBy(r => r.Status),
            "fee" => desc
                ? query.OrderByDescending(r => r.FeePaid).ThenByDescending(r => r.RegistrationFeeAmount)
                : query.OrderBy(r => r.FeePaid).ThenBy(r => r.RegistrationFeeAmount),
            _ => desc ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt)
        };

    private static object[] RequiredChecklist(IEnumerable<(StudentDocumentKind Kind, bool Verified, DateTime? VerifiedAt)> documents)
    {
        var rows = documents.ToList();
        StudentDocumentKind[] required = [StudentDocumentKind.Photo, StudentDocumentKind.Identity, StudentDocumentKind.TransferCertificate];
        return required
            .Select(kind =>
            {
                var matches = rows.Where(d => d.Kind == kind).ToList();
                var status = matches.Count == 0 ? "Missing"
                    : matches.Any(d => d.Verified) ? "Verified"
                    : matches.Any(d => d.VerifiedAt is null) ? "Pending"
                    : "Rejected";
                return (object)new { kind = kind.ToString(), status };
            }).ToArray();
    }

    private async Task<string?> FeeMethodAsync(Guid tenantId, Guid registrationId, CancellationToken ct)
    {
        var json = await db.AuditEvents.AsNoTracking()
            .Where(a => a.TenantId == tenantId && a.EntityId == registrationId.ToString() && a.Action == "RegistrationFeeCollected")
            .OrderByDescending(a => a.OccurredAt)
            .Select(a => a.NewValues)
            .FirstOrDefaultAsync(ct);
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("method", out var method) && method.ValueKind == JsonValueKind.String)
                return method.GetString();
        }
        catch (JsonException) { }
        return null;
    }

    private static string PaymentMethod(string? method)
    {
        var value = string.IsNullOrWhiteSpace(method) ? "Cash" : method.Trim();
        return value.ToLowerInvariant() switch
        {
            "cash" => "Cash",
            "upi" => "UPI",
            "card" => "Card",
            "bank" or "bank transfer" => "Bank transfer",
            _ => throw new InvalidOperationException("Payment method must be Cash, UPI, Card, or Bank transfer.")
        };
    }

    private static void ValidateDraft(string first, string last, DateOnly dob, string guardian, string phone, decimal fee)
    {
        if (string.IsNullOrWhiteSpace(first) || string.IsNullOrWhiteSpace(last))
            throw new InvalidOperationException("Student first and last name are required.");
        if (dob > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new InvalidOperationException("Date of birth cannot be in the future.");
        if (string.IsNullOrWhiteSpace(guardian))
            throw new InvalidOperationException("Guardian name is required.");
        if (phone.Length < 8)
            throw new InvalidOperationException("Guardian phone must contain at least 8 digits.");
        if (fee <= 0)
            throw new InvalidOperationException("Registration fee must be greater than zero.");
    }

    private async Task EnsurePlacement(Guid schoolId, Guid tenantId, Guid yearId, Guid classId, Guid sectionId, CancellationToken ct)
    {
        var yearOk = await db.AcademicYears.AnyAsync(y => y.Id == yearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        var classOk = await db.Classes.AnyAsync(c => c.Id == classId && c.SchoolId == schoolId && c.TenantId == tenantId, ct);
        var sectionOk = await db.Sections.AnyAsync(s => s.Id == sectionId && s.ClassId == classId && s.TenantId == tenantId && s.Class!.SchoolId == schoolId, ct);
        if (!yearOk || !classOk || !sectionOk)
            throw new InvalidOperationException("Academic year, class, or section does not belong to this school.");
    }

    private async Task EnsureNotDuplicate(Guid schoolId, Guid tenantId, Guid yearId, string first, string last, DateOnly dob, string phone, Guid? exceptId, CancellationToken ct)
    {
        var firstName = first.Trim().ToLower();
        var lastName = last.Trim().ToLower();
        var query = db.StudentRegistrations.Where(r => r.SchoolId == schoolId && r.TenantId == tenantId && r.AcademicYearId == yearId
            && r.Status != RegistrationStatus.Rejected
            && r.FirstName.ToLower() == firstName && r.LastName.ToLower() == lastName && r.DateOfBirth == dob && r.GuardianPhone == phone);
        if (exceptId is Guid skip) query = query.Where(r => r.Id != skip);
        var exists = await query.AnyAsync(ct);
        if (exists) throw new InvalidOperationException("A registration for this student and guardian phone already exists in this academic year.");
    }

    private static string Digits(string? phone) => new((phone ?? "").Where(char.IsDigit).ToArray());

    private static string Stage(StudentRegistration reg, int documents, int verified)
    {
        if (reg.Status == RegistrationStatus.Rejected) return "Rejected";
        if (reg.Status == RegistrationStatus.Confirmed) return "Admission";
        if (documents == 0) return "Documents";
        if (!reg.FeePaid) return "Fee Payment";
        if (verified < documents) return "Verification";
        return "Seat Confirmation";
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

public sealed record RegistrationDocumentRow(Guid Id, string Kind, string FileName, string Url, bool Verified, string? VerifiedBy, DateTime? VerifiedAt, string? ReviewNote, string ReviewStatus);

public sealed record RegistrationListRow(
    Guid Id, string RegistrationNumber, string FirstName, string LastName, string GuardianName, string GuardianPhone, string? GuardianEmail,
    string Status, bool FeePaid, string? FeeReceiptNumber, decimal RegistrationFeeAmount, string? AdmissionNumber, string? BonafideNumber,
    string? PhotoUrl, Guid? StudentId, DateTime CreatedAt, Guid AcademicYearId, Guid PreferredClassId, Guid PreferredSectionId, DateOnly DateOfBirth, string? Gender, string Relationship,
    string? ClassName, string? SectionName);
