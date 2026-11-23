using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.DTOs;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Services;

public class StudentService(AppDbContext db) : IStudentService
{
    public async Task<PagedResult<StudentListDto>> GetStudentsAsync(
        Guid schoolId, Guid academicYearId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        var query = db.StudentEnrollments
            .Where(e => e.TenantId == db.Schools.Where(s => s.Id == schoolId).Select(s => s.TenantId).FirstOrDefault()
                     && e.AcademicYearId == academicYearId
                     && e.Student!.SchoolId == schoolId)
            .Include(e => e.Student)
            .Include(e => e.Class)
            .Include(e => e.Section)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(e =>
                e.Student!.FirstName.ToLower().Contains(s) ||
                e.Student.LastName.ToLower().Contains(s) ||
                e.Student.StudentCode.ToLower().Contains(s));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(e => e.Class!.SortOrder).ThenBy(e => e.Section!.Name).ThenBy(e => e.Student!.FirstName)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(e => new StudentListDto(
                e.Student!.Id, e.Student.StudentCode,
                e.Student.FirstName, e.Student.LastName,
                e.Class!.Name, e.Section!.Name,
                e.Student.Status.ToString(), e.Student.PhotoUrl))
            .ToListAsync(ct);

        return new PagedResult<StudentListDto>(items, total, page, pageSize);
    }

    public async Task<StudentDetailDto?> GetStudentAsync(Guid id, Guid schoolId, CancellationToken ct = default)
    {
        var student = await db.Students
            .Include(s => s.Guardians).ThenInclude(sg => sg.Guardian)
            .Include(s => s.Enrollments).ThenInclude(e => e.AcademicYear)
            .Include(s => s.Enrollments).ThenInclude(e => e.Class)
            .Include(s => s.Enrollments).ThenInclude(e => e.Section)
            .FirstOrDefaultAsync(s => s.Id == id && s.SchoolId == schoolId, ct);

        if (student is null) return null;

        return new StudentDetailDto(
            student.Id, student.StudentCode, student.FirstName, student.LastName,
            student.DateOfBirth, student.Status.ToString(), student.PhotoUrl,
            student.Guardians.Select(sg => new GuardianDto(
                sg.Guardian!.Id, sg.Guardian.FirstName, sg.Guardian.LastName,
                sg.Relationship, sg.Guardian.Phone, sg.Guardian.Email, sg.IsPrimary)),
            student.Enrollments.Select(e => new EnrollmentDto(
                e.Id, e.AcademicYear!.Name, e.Class!.Name, e.Section!.Name, e.EffectiveFrom, e.RollNumber,
                e.AcademicYearId, e.ClassId, e.SectionId)));
    }

    public async Task<StudentDetailDto> CreateStudentAsync(
        CreateStudentRequest request, Guid schoolId, Guid tenantId, string createdBy, CancellationToken ct = default)
    {
        if (!await db.Schools.AnyAsync(s => s.Id == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct))
            throw new InvalidOperationException("School was not found in this tenant.");
        var yearOk = await db.AcademicYears.AnyAsync(y =>
            y.Id == request.AcademicYearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        var classOk = await db.Classes.AnyAsync(c =>
            c.Id == request.ClassId && c.SchoolId == schoolId && c.TenantId == tenantId, ct);
        var sectionOk = await db.Sections.AnyAsync(s =>
            s.Id == request.SectionId && s.ClassId == request.ClassId && s.TenantId == tenantId
            && s.Class!.SchoolId == schoolId && s.Class.TenantId == tenantId, ct);
        if (!yearOk || !classOk || !sectionOk)
            throw new InvalidOperationException("Class, section, or academic year does not belong to this school.");
        var count = await db.Students.CountAsync(s => s.SchoolId == schoolId && s.TenantId == tenantId, ct);
        var code = $"STU-{DateTime.UtcNow.Year}-{count + 1:D4}";

        var student = new Student
        {
            TenantId = tenantId,
            SchoolId = schoolId,
            StudentCode = code,
            FirstName = request.FirstName,
            LastName = request.LastName,
            DateOfBirth = request.DateOfBirth,
            PhotoUrl = CleanPhoto(request.PhotoUrl),
            Status = StudentStatus.Active,
            CreatedBy = createdBy
        };

        var enrollment = new StudentEnrollment
        {
            TenantId = tenantId,
            AcademicYearId = request.AcademicYearId,
            ClassId = request.ClassId,
            SectionId = request.SectionId,
            RollNumber = request.RollNumber,
            EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedBy = createdBy
        };
        student.Enrollments.Add(enrollment);

        db.Students.Add(student);
        await db.SaveChangesAsync(ct);

        return (await GetStudentAsync(student.Id, schoolId, ct))!;
    }

    public async Task<StudentDetailDto> UpdateStudentAsync(
        Guid id, Guid schoolId, Guid tenantId, UpdateStudentRequest request, string updatedBy, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw new InvalidOperationException("First and last name are required.");
        if (request.DateOfBirth > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new InvalidOperationException("Date of birth cannot be in the future.");
        if (!Enum.TryParse<StudentStatus>(request.Status, true, out var status) || status is StudentStatus.Enquiry)
            throw new InvalidOperationException("Invalid student status.");
        var phone = request.ContactPhone?.Trim();
        if (!string.IsNullOrWhiteSpace(phone) && phone.Length < 8)
            throw new InvalidOperationException("Contact phone must be at least 8 characters.");
        var student = await db.Students
            .FirstOrDefaultAsync(s => s.Id == id && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct)
            ?? throw new InvalidOperationException("Student not found.");
        if (!await BelongsToSchool(schoolId, tenantId, request.AcademicYearId, request.ClassId, request.SectionId, ct))
            throw new InvalidOperationException("Class, section, or academic year does not belong to this school.");

        student.FirstName = request.FirstName.Trim();
        student.LastName = request.LastName.Trim();
        student.DateOfBirth = request.DateOfBirth;
        student.Status = status;
        if (request.PhotoUrl is not null)
            student.PhotoUrl = CleanPhoto(request.PhotoUrl);
        student.UpdatedBy = updatedBy;

        var enrollment = await db.StudentEnrollments.FirstOrDefaultAsync(
            e => e.StudentId == student.Id && e.AcademicYearId == request.AcademicYearId && e.EffectiveTo == null, ct);
        if (enrollment is null)
        {
            db.StudentEnrollments.Add(new StudentEnrollment
            {
                TenantId = tenantId,
                StudentId = student.Id,
                AcademicYearId = request.AcademicYearId,
                ClassId = request.ClassId,
                SectionId = request.SectionId,
                RollNumber = string.IsNullOrWhiteSpace(request.RollNumber) ? null : request.RollNumber.Trim(),
                EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow),
                CreatedBy = updatedBy
            });
        }
        else
        {
            enrollment.ClassId = request.ClassId;
            enrollment.SectionId = request.SectionId;
            enrollment.RollNumber = string.IsNullOrWhiteSpace(request.RollNumber) ? null : request.RollNumber.Trim();
            enrollment.UpdatedBy = updatedBy;
        }

        if (!string.IsNullOrWhiteSpace(phone))
            await UpsertPrimaryContactAsync(student, tenantId, request.ContactName, phone, request.ContactEmail, updatedBy, ct);

        await db.SaveChangesAsync(ct);
        return (await GetStudentAsync(id, schoolId, ct))!;
    }

    private async Task<bool> BelongsToSchool(Guid schoolId, Guid tenantId, Guid yearId, Guid classId, Guid sectionId, CancellationToken ct)
    {
        var yearOk = await db.AcademicYears.AnyAsync(y => y.Id == yearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct);
        var classOk = await db.Classes.AnyAsync(c => c.Id == classId && c.SchoolId == schoolId && c.TenantId == tenantId, ct);
        var sectionOk = await db.Sections.AnyAsync(s =>
            s.Id == sectionId && s.ClassId == classId && s.TenantId == tenantId
            && s.Class!.SchoolId == schoolId && s.Class.TenantId == tenantId, ct);
        return yearOk && classOk && sectionOk;
    }

    private async Task UpsertPrimaryContactAsync(Student student, Guid tenantId, string? contactName, string phone, string? email, string actor, CancellationToken ct)
    {
        var parts = (contactName ?? "").Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var first = parts.Length > 0 ? parts[0] : "Guardian";
        var last = parts.Length > 1 ? parts[1] : student.LastName;
        var link = await db.StudentGuardians.Include(g => g.Guardian)
            .FirstOrDefaultAsync(g => g.StudentId == student.Id && g.TenantId == tenantId, ct);
        if (link?.Guardian is null)
        {
            var guardian = new Guardian
            {
                TenantId = tenantId,
                FirstName = first,
                LastName = last,
                Phone = phone,
                Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim(),
                CreatedBy = actor
            };
            db.Guardians.Add(guardian);
            db.StudentGuardians.Add(new StudentGuardian
            {
                TenantId = tenantId,
                StudentId = student.Id,
                GuardianId = guardian.Id,
                Relationship = "Guardian",
                IsPrimary = true,
                ReceivesNotifications = true,
                CreatedBy = actor
            });
            return;
        }
        link.IsPrimary = true;
        link.Guardian.FirstName = first;
        link.Guardian.LastName = last;
        link.Guardian.Phone = phone;
        link.Guardian.Email = string.IsNullOrWhiteSpace(email) ? link.Guardian.Email : email.Trim();
        link.Guardian.UpdatedBy = actor;
    }

    public async Task SetStatusAsync(Guid id, Guid schoolId, string status, CancellationToken ct = default)
    {
        if (!Enum.TryParse<StudentStatus>(status, true, out var next) || next is StudentStatus.Enquiry)
            throw new InvalidOperationException("Invalid student status.");
        var student = await db.Students.FirstOrDefaultAsync(s => s.Id == id && s.SchoolId == schoolId, ct)
            ?? throw new InvalidOperationException("Student not found.");
        student.Status = next;
        await db.SaveChangesAsync(ct);
    }

    public async Task SetPhotoAsync(Guid id, Guid schoolId, string photoUrl, CancellationToken ct = default)
    {
        var photo = CleanPhoto(photoUrl) ?? throw new InvalidOperationException("Choose a photo.");
        var student = await db.Students.FirstOrDefaultAsync(s => s.Id == id && s.SchoolId == schoolId, ct)
            ?? throw new InvalidOperationException("Student not found.");
        student.PhotoUrl = photo;
        await db.SaveChangesAsync(ct);
    }

    private static string? CleanPhoto(string? photo)
    {
        if (string.IsNullOrWhiteSpace(photo)) return null;
        if (!photo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) || photo.Length > 400_000)
            throw new InvalidOperationException("Use a small photo, under about 300 KB.");
        return photo;
    }
}
