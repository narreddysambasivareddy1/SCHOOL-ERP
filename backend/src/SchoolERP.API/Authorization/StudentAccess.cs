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

    public static bool IsLeadership(ClaimsPrincipal user) =>
        user.IsInRole("SchoolAdmin") || user.IsInRole("PlatformSuperAdmin");

    public static bool IsFeesStaff(ClaimsPrincipal user) =>
        IsLeadership(user) || user.IsInRole("Accountant");

    public static bool IsAttendanceStaff(ClaimsPrincipal user) =>
        IsLeadership(user) || user.IsInRole("Teacher") || user.IsInRole("AttendanceOfficer");

    public static bool IsResultsStaff(ClaimsPrincipal user) =>
        IsLeadership(user) || user.IsInRole("Teacher");

    public static async Task<bool> CanReadStudent(AppDbContext db, ClaimsPrincipal user, Guid schoolId, Guid tenantId, Guid studentId, CancellationToken ct)
    {
        var linked = await db.Students.AnyAsync(s =>
            s.Id == studentId && s.SchoolId == schoolId && s.TenantId == tenantId && !s.IsDeleted, ct);
        if (!linked) return false;
        if (IsLeadership(user) || user.IsInRole("Teacher") || user.IsInRole("AttendanceOfficer")
            || user.IsInRole("AdmissionOfficer") || user.IsInRole("FrontOffice") || user.IsInRole("Accountant"))
            return true;

        var userId = UserId(user);
        if (userId is null) return false;

        if (user.IsInRole("Student"))
            return await db.Students.AnyAsync(s => s.Id == studentId && s.UserId == userId, ct);

        if (user.IsInRole("Parent"))
            return await db.StudentGuardians.AnyAsync(sg =>
                sg.StudentId == studentId && sg.Guardian!.UserId == userId && !sg.Guardian.IsDeleted, ct);

        return false;
    }
}
