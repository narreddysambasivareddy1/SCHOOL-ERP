using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Authorization;

public static class StudentAccess
{
    public static Guid? UserId(ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("sub");
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    public static bool InRole(ClaimsPrincipal user, string role) =>
        user.IsInRole(role) || user.Claims.Any(c =>
            c.Value == role && (c.Type == ClaimTypes.Role || c.Type == "role"));

    public static bool IsLeadership(ClaimsPrincipal user) =>
        InRole(user, "SchoolAdmin") || InRole(user, "PlatformSuperAdmin");

    public static bool IsFeesStaff(ClaimsPrincipal user) =>
        IsLeadership(user) || InRole(user, "Accountant");

    public static bool IsAttendanceStaff(ClaimsPrincipal user) =>
        IsLeadership(user) || InRole(user, "Teacher") || InRole(user, "AttendanceOfficer");

    public static bool IsResultsStaff(ClaimsPrincipal user) =>
        IsLeadership(user) || InRole(user, "Teacher");

    public static Task<bool> CanReadStudent(AppDbContext db, ClaimsPrincipal user, Guid schoolId, Guid tenantId, Guid studentId, CancellationToken ct) =>
        CanReadStudent(db, user, schoolId, tenantId, studentId, null, ct);

    public static async Task<bool> CanReadStudent(AppDbContext db, ClaimsPrincipal user, Guid schoolId, Guid tenantId, Guid studentId, Guid? academicYearId, CancellationToken ct)
    {
        var linked = await db.Students.AnyAsync(s =>
            s.Id == studentId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);
        if (!linked) return false;
        if (IsLeadership(user) || InRole(user, "AttendanceOfficer")
            || InRole(user, "AdmissionOfficer") || InRole(user, "FrontOffice") || InRole(user, "Accountant"))
            return true;

        var userId = UserId(user);
        if (userId is null) return false;

        if (InRole(user, "Teacher") && await TeacherAssignedToStudent(db, schoolId, tenantId, studentId, userId.Value, academicYearId, ct))
            return true;

        if (InRole(user, "Student"))
            return await db.Students.AnyAsync(s =>
                s.Id == studentId && s.UserId == userId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);

        if (InRole(user, "Parent"))
            return await db.StudentGuardians.AnyAsync(sg =>
                sg.TenantId == tenantId && sg.StudentId == studentId
                && sg.Student!.SchoolId == schoolId && sg.Student.TenantId == tenantId && !sg.Student.IsDeleted
                && sg.Guardian!.UserId == userId && sg.Guardian.TenantId == tenantId && !sg.Guardian.IsDeleted, ct);

        return false;
    }

    private static async Task<bool> TeacherAssignedToStudent(AppDbContext db, Guid schoolId, Guid tenantId, Guid studentId, Guid userId, Guid? academicYearId, CancellationToken ct)
    {
        var enrollments = await db.StudentEnrollments
            .Where(e => e.StudentId == studentId && e.TenantId == tenantId && e.EffectiveTo == null
                && (academicYearId == null || e.AcademicYearId == academicYearId)
                && e.Student!.SchoolId == schoolId && e.Student.TenantId == tenantId
                && e.Class!.SchoolId == schoolId && e.Class.TenantId == tenantId
                && e.Section!.TenantId == tenantId && e.Section.ClassId == e.ClassId
                && e.AcademicYear!.SchoolId == schoolId && e.AcademicYear.TenantId == tenantId)
            .Select(e => new { e.AcademicYearId, e.ClassId, e.SectionId })
            .ToListAsync(ct);
        if (enrollments.Count == 0) return false;

        var yearIds = enrollments.Select(e => e.AcademicYearId).Distinct().ToList();
        var classIds = enrollments.Select(e => e.ClassId).Distinct().ToList();
        var sectionIds = enrollments.Select(e => e.SectionId).Distinct().ToList();
        var assignments = await db.TeacherAssignments
            .Where(a => a.TenantId == tenantId && a.IsActive
                && yearIds.Contains(a.AcademicYearId) && classIds.Contains(a.ClassId) && sectionIds.Contains(a.SectionId)
                && a.Employee!.UserId == userId && a.Employee.SchoolId == schoolId && a.Employee.TenantId == tenantId
                && a.Class!.SchoolId == schoolId && a.Class.TenantId == tenantId
                && a.Section!.TenantId == tenantId && a.Section.ClassId == a.ClassId
                && a.AcademicYear!.SchoolId == schoolId && a.AcademicYear.TenantId == tenantId)
            .Select(a => new { a.AcademicYearId, a.ClassId, a.SectionId })
            .ToListAsync(ct);

        return assignments.Any(a => enrollments.Any(e =>
            e.AcademicYearId == a.AcademicYearId && e.ClassId == a.ClassId && e.SectionId == a.SectionId));
    }
}
