using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        if (await db.Tenants.AnyAsync()) return;

        var tenantId = Guid.NewGuid();
        var schoolId = Guid.NewGuid();
        var ayId = Guid.NewGuid();

        var tenant = new Tenant { Id = tenantId, Name = "Bright Future School", Slug = "bright-future" };
        var school = new School
        {
            Id = schoolId, TenantId = tenantId, Name = "Bright Future International School",
            PrimaryColor = "#17365D", TimeZone = "Asia/Kolkata", DefaultLanguage = "en"
        };
        var ay = new AcademicYear
        {
            Id = ayId, TenantId = tenantId, SchoolId = schoolId,
            Name = "2026-27", StartDate = new DateOnly(2026, 6, 1),
            EndDate = new DateOnly(2027, 3, 31), IsCurrent = true
        };

        // Roles
        var roles = new[]
        {
            new Role { Id = Guid.NewGuid(), Name = "PlatformSuperAdmin" },
            new Role { Id = Guid.NewGuid(), Name = "SchoolAdmin" },
            new Role { Id = Guid.NewGuid(), Name = "Teacher" },
            new Role { Id = Guid.NewGuid(), Name = "Student" },
            new Role { Id = Guid.NewGuid(), Name = "Parent" },
            new Role { Id = Guid.NewGuid(), Name = "Driver" },
            new Role { Id = Guid.NewGuid(), Name = "HRManager" },
            new Role { Id = Guid.NewGuid(), Name = "Accountant" },
            new Role { Id = Guid.NewGuid(), Name = "AdmissionOfficer" },
            new Role { Id = Guid.NewGuid(), Name = "AttendanceOfficer" },
            new Role { Id = Guid.NewGuid(), Name = "TransportManager" },
            new Role { Id = Guid.NewGuid(), Name = "PayrollOfficer" },
        };

        // Admin user
        var adminRole = roles.First(r => r.Name == "SchoolAdmin");
        var adminUser = new User
        {
            Id = Guid.NewGuid(), TenantId = tenantId,
            Email = "admin@school.edu",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234"),
            FirstName = "School", LastName = "Admin", IsActive = true
        };
        adminUser.UserRoles.Add(new UserRole
        {
            Id = Guid.NewGuid(), UserId = adminUser.Id,
            RoleId = adminRole.Id, SchoolId = schoolId, GrantedBy = "seed"
        });

        // Classes
        var classes = new[]
        {
            new Class { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Grade 5", SortOrder = 5 },
            new Class { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Grade 6", SortOrder = 6 },
            new Class { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Grade 7", SortOrder = 7 },
            new Class { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Grade 8", SortOrder = 8 },
            new Class { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Grade 9", SortOrder = 9 },
        };

        var sections = classes.SelectMany(c => new[]
        {
            new Section { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = c.Id, Name = "A", Capacity = 40 },
            new Section { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = c.Id, Name = "B", Capacity = 40 },
        }).ToArray();

        // Subjects
        var subjects = new[]
        {
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Mathematics", Code = "MATH" },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Science", Code = "SCI" },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "English", Code = "ENG" },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Telugu", Code = "TEL", IsLanguage = true },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Hindi", Code = "HIN", IsLanguage = true },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Social Studies", Code = "SS" },
        };

        // Departments
        var depts = new[]
        {
            new Department { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Teaching" },
            new Department { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Administration" },
            new Department { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Transport" },
            new Department { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Finance" },
        };

        var desigs = new[]
        {
            new Designation { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Teacher" },
            new Designation { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Senior Teacher" },
            new Designation { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Driver" },
            new Designation { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Office Manager" },
            new Designation { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Accountant" },
        };

        // Fee categories
        var feeCategories = new[]
        {
            new FeeCategory { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Tuition Fee" },
            new FeeCategory { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Transport Fee" },
            new FeeCategory { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Examination Fee" },
            new FeeCategory { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Activity Fee" },
        };

        db.Tenants.Add(tenant);
        db.Schools.Add(school);
        db.AcademicYears.Add(ay);
        db.Roles.AddRange(roles);
        db.Users.Add(adminUser);
        db.Classes.AddRange(classes);
        db.Sections.AddRange(sections);
        db.Subjects.AddRange(subjects);
        db.Departments.AddRange(depts);
        db.Designations.AddRange(desigs);
        db.FeeCategories.AddRange(feeCategories);

        await db.SaveChangesAsync();

        Console.WriteLine("=== SEED COMPLETE ===");
        Console.WriteLine($"Tenant ID : {tenantId}");
        Console.WriteLine($"School ID : {schoolId}");
        Console.WriteLine($"AcadYear  : {ayId}");
        Console.WriteLine($"Admin     : admin@school.edu / Admin@1234");
        Console.WriteLine("=====================");
    }
}
