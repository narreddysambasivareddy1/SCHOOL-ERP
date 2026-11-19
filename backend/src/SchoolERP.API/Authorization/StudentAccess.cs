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

    public static async Task<bool> CanReadStudent(AppDbContext db, ClaimsPrincipal user, Guid schoolId, Guid tenantId, Guid studentId, CancellationToken ct)
    {
        var linked = await db.Students.AnyAsync(s =>
            s.Id == studentId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);
        if (!linked) return false;
        if (IsLeadership(user) || InRole(user, "Teacher") || InRole(user, "AttendanceOfficer")
            || InRole(user, "AdmissionOfficer") || InRole(user, "FrontOffice") || InRole(user, "Accountant"))
            return true;

        var userId = UserId(user);
        if (userId is null) return false;

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
}
