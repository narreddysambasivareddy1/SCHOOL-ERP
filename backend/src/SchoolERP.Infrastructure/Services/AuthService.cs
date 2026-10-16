using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SchoolERP.Application.DTOs;
using SchoolERP.Application.Interfaces;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Services;

public class AuthService(AppDbContext db, IConfiguration config) : IAuthService
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request, Guid? tenantId = null, CancellationToken ct = default)
    {
        var resolvedTenantId = tenantId ?? Guid.Empty;
        if (resolvedTenantId == Guid.Empty && !string.IsNullOrWhiteSpace(request.SchoolCode))
        {
            var slug = request.SchoolCode.Trim().ToLowerInvariant();
            var tenant = await db.Tenants.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive && !t.IsDeleted, ct);
            if (tenant is null) return null;
            resolvedTenantId = tenant.Id;
        }

        if (resolvedTenantId == Guid.Empty) return null;

        var user = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.TenantId == resolvedTenantId && u.Email == request.Email && u.IsActive, ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        var token = GenerateToken(user.Id, user.Email, resolvedTenantId, roles);
        var expiry = int.Parse(config["Jwt:ExpiryMinutes"] ?? "60");
        var session = await BuildSchoolSessionAsync(user, resolvedTenantId, ct);

        return new LoginResponse(token, "Bearer", expiry * 60,
            new UserDto(user.Id, user.Email, user.FirstName, user.LastName, roles),
            session);
    }

    private async Task<SchoolSessionDto?> BuildSchoolSessionAsync(Domain.Entities.User user, Guid tenantId, CancellationToken ct)
    {
        var schoolId = user.UserRoles.FirstOrDefault(r => r.SchoolId.HasValue)?.SchoolId;
        var schoolQuery = db.Schools.Where(s => s.TenantId == tenantId && !s.IsDeleted);
        var school = schoolId.HasValue
            ? await schoolQuery.FirstOrDefaultAsync(s => s.Id == schoolId.Value, ct)
            : await schoolQuery.FirstOrDefaultAsync(ct);
        if (school is null) return null;

        var year = await db.AcademicYears
            .Where(a => a.SchoolId == school.Id && a.TenantId == tenantId)
            .OrderByDescending(a => a.IsCurrent)
            .ThenByDescending(a => a.StartDate)
            .FirstOrDefaultAsync(ct);

        var slug = await db.Tenants.Where(t => t.Id == tenantId).Select(t => t.Slug).FirstAsync(ct);

        return new SchoolSessionDto(
            tenantId, school.Id, school.Name, slug,
            year?.Id, year?.Name,
            school.LogoUrl, school.PrimaryColor,
            school.Locale, school.Currency, school.TimeZone);
    }

    private string GenerateToken(Guid userId, string email, Guid tenantId, IEnumerable<string> roles)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = int.Parse(config["Jwt:ExpiryMinutes"] ?? "60");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new("tid", tenantId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
