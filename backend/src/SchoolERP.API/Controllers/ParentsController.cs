using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/parents")]
[Authorize(Roles = "Parent,SchoolAdmin,PlatformSuperAdmin")]
public class ParentsController(AppDbContext db) : ControllerBase
{
    [HttpGet("children")]
    public async Task<IActionResult> GetChildren(CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();

        var children = await (
                from g in db.Guardians.AsNoTracking()
                join sg in db.StudentGuardians.AsNoTracking() on g.Id equals sg.GuardianId
                join s in db.Students.AsNoTracking() on sg.StudentId equals s.Id
                where g.TenantId == tenantId && g.UserId == userId && !g.IsDeleted
                select new
                {
                    studentId = s.Id,
                    studentCode = s.StudentCode,
                    firstName = s.FirstName,
                    lastName = s.LastName,
                    photoUrl = s.PhotoUrl,
                    relationship = sg.Relationship,
                    isPrimary = sg.IsPrimary,
                    className = s.Enrollments.OrderByDescending(e => e.EffectiveFrom).Select(e => e.Class!.Name).FirstOrDefault(),
                    sectionName = s.Enrollments.OrderByDescending(e => e.EffectiveFrom).Select(e => e.Section!.Name).FirstOrDefault()
                })
            .ToListAsync(ct);

        return Ok(children);
    }

    private Guid? ResolveUserId()
    {
        var raw = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
