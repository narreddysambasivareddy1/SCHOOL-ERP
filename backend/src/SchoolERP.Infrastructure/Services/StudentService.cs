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
                sg.Relationship, sg.Guardian.Phone, sg.IsPrimary)),
            student.Enrollments.Select(e => new EnrollmentDto(
                e.Id, e.AcademicYear!.Name, e.Class!.Name, e.Section!.Name, e.EffectiveFrom)));
    }

    public async Task<StudentDetailDto> CreateStudentAsync(
        CreateStudentRequest request, Guid schoolId, Guid tenantId, string createdBy, CancellationToken ct = default)
    {
        var school = await db.Schools.FirstAsync(s => s.Id == schoolId, ct);
        var count = await db.Students.CountAsync(s => s.SchoolId == schoolId, ct);
        var code = $"STU-{DateTime.UtcNow.Year}-{count + 1:D4}";

        var student = new Student
        {
            TenantId = tenantId,
            SchoolId = schoolId,
            StudentCode = code,
            FirstName = request.FirstName,
            LastName = request.LastName,
            DateOfBirth = request.DateOfBirth,
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

    public async Task SetStatusAsync(Guid id, Guid schoolId, string status, CancellationToken ct = default)
    {
        if (!Enum.TryParse<StudentStatus>(status, true, out var next) || next is StudentStatus.Enquiry)
            throw new InvalidOperationException("Invalid student status.");
        var student = await db.Students.FirstOrDefaultAsync(s => s.Id == id && s.SchoolId == schoolId, ct)
            ?? throw new InvalidOperationException("Student not found.");
        student.Status = next;
        await db.SaveChangesAsync(ct);
    }
}
