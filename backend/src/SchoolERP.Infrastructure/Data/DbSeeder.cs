using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Integrations;

namespace SchoolERP.Infrastructure.Data;

public static partial class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        if (await db.Tenants.AnyAsync())
        {
            await SeedDemoUsersIfMissingAsync(db);
            var existingTenant = await db.Tenants.FirstAsync();
            var existingSchool = await db.Schools.FirstOrDefaultAsync(s => s.TenantId == existingTenant.Id);
            if (existingSchool is not null)
            {
                await SeedOpsPackAsync(db, existingTenant.Id, existingSchool.Id);
                await SeedRichDemoAsync(db, existingTenant.Id, existingSchool.Id);
            }
            return;
        }

        var tenantId = Guid.NewGuid();
        var schoolId = Guid.NewGuid();
        var ayId = Guid.NewGuid();

        var tenant = new Tenant { Id = tenantId, Name = "Bright Future School", Slug = "bright-future" };
        var school = new School
        {
            Id = schoolId, TenantId = tenantId, Name = "Bright Future International School",
            PrimaryColor = "#17365D", TimeZone = "Asia/Kolkata", DefaultLanguage = "en",
            Locale = "en-IN", Currency = "INR"
        };
        var ay = new AcademicYear
        {
            Id = ayId, TenantId = tenantId, SchoolId = schoolId,
            Name = "2026-27", StartDate = new DateOnly(2026, 6, 1),
            EndDate = new DateOnly(2027, 3, 31), IsCurrent = true
        };

        var roles = CreateRoles();

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

        var subjects = new[]
        {
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Mathematics", Code = "MATH" },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Science", Code = "SCI" },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "English", Code = "ENG" },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Telugu", Code = "TEL", IsLanguage = true },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Hindi", Code = "HIN", IsLanguage = true },
            new Subject { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Social Studies", Code = "SS" },
        };

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
        db.Classes.AddRange(classes);
        db.Sections.AddRange(sections);
        db.Subjects.AddRange(subjects);
        db.Departments.AddRange(depts);
        db.Designations.AddRange(desigs);
        db.FeeCategories.AddRange(feeCategories);

        await AddPortalUsersAsync(db, tenantId, schoolId, ayId,
            roles, classes[0], sections.First(s => s.ClassId == classes[0].Id && s.Name == "A"));
        await SeedOpsPackAsync(db, tenantId, schoolId);
        await SeedRichDemoAsync(db, tenantId, schoolId);

        await db.SaveChangesAsync();

        Console.WriteLine("=== SEED COMPLETE ===");
        Console.WriteLine("School code: bright-future");
        Console.WriteLine($"Tenant ID : {tenantId}");
        Console.WriteLine($"School ID : {schoolId}");
        Console.WriteLine("Admin     : admin@school.edu / Admin@1234");
        Console.WriteLine("Teacher   : teacher@school.edu / Admin@1234");
        Console.WriteLine("Student   : student@school.edu / Admin@1234");
        Console.WriteLine("Parent    : parent@school.edu / Admin@1234");
        Console.WriteLine("=====================");
    }

    private static async Task SeedDemoUsersIfMissingAsync(AppDbContext db)
    {
        var tenant = await db.Tenants.FirstAsync();
        var school = await db.Schools.FirstOrDefaultAsync(s => s.TenantId == tenant.Id);
        if (school is null) return;

        if (string.IsNullOrWhiteSpace(school.Locale)) school.Locale = "en-IN";
        if (string.IsNullOrWhiteSpace(school.Currency)) school.Currency = "INR";

        var roles = await db.Roles.ToListAsync();
        if (roles.Count == 0) return;

        var ay = await db.AcademicYears.FirstOrDefaultAsync(a => a.SchoolId == school.Id && a.IsCurrent)
                 ?? await db.AcademicYears.FirstOrDefaultAsync(a => a.SchoolId == school.Id);
        var cls = await db.Classes.Where(c => c.SchoolId == school.Id).OrderBy(c => c.SortOrder).FirstOrDefaultAsync();
        var section = cls is null ? null : await db.Sections.FirstOrDefaultAsync(s => s.ClassId == cls.Id);

        if (ay is null || cls is null || section is null)
        {
            await db.SaveChangesAsync();
            return;
        }

        await AddPortalUsersAsync(db, tenant.Id, school.Id, ay.Id, roles, cls, section);
        await db.SaveChangesAsync();
    }

    private static Role[] CreateRoles() =>
    [
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
    ];

    private static async Task AddPortalUsersAsync(
        AppDbContext db, Guid tenantId, Guid schoolId, Guid ayId,
        IEnumerable<Role> roles, Class grade, Section section)
    {
        var roleList = roles.ToList();
        var password = BCrypt.Net.BCrypt.HashPassword("Admin@1234");

        async Task<User> EnsureUser(string email, string first, string last, string roleName)
        {
            var existing = await db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == email);
            if (existing is not null) return existing;

            var role = roleList.First(r => r.Name == roleName);
            var user = new User
            {
                Id = Guid.NewGuid(), TenantId = tenantId, Email = email, PasswordHash = password,
                FirstName = first, LastName = last, IsActive = true
            };
            user.UserRoles.Add(new UserRole
            {
                Id = Guid.NewGuid(), UserId = user.Id, RoleId = role.Id, SchoolId = schoolId, GrantedBy = "seed"
            });
            db.Users.Add(user);
            return user;
        }

        await EnsureUser("admin@school.edu", "School", "Admin", "SchoolAdmin");
        await EnsureUser("teacher@school.edu", "Maya", "Iyer", "Teacher");
        var studentUser = await EnsureUser("student@school.edu", "Aarav", "Mehta", "Student");
        var parentUser = await EnsureUser("parent@school.edu", "Priya", "Mehta", "Parent");

        var student = await db.Students.FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.StudentCode == "BF0001");
        if (student is null)
        {
            student = new Student
            {
                Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId,
                StudentCode = "BF0001", FirstName = "Aarav", LastName = "Mehta",
                DateOfBirth = new DateOnly(2014, 4, 12), Status = StudentStatus.Active,
                UserId = studentUser.Id
            };
            db.Students.Add(student);
            db.StudentEnrollments.Add(new StudentEnrollment
            {
                Id = Guid.NewGuid(), TenantId = tenantId, StudentId = student.Id,
                AcademicYearId = ayId, ClassId = grade.Id, SectionId = section.Id,
                RollNumber = "1", EffectiveFrom = new DateOnly(2026, 6, 1)
            });
        }
        else if (student.UserId is null)
        {
            student.UserId = studentUser.Id;
        }

        var guardian = await db.Guardians.FirstOrDefaultAsync(g => g.TenantId == tenantId && g.UserId == parentUser.Id);
        if (guardian is null)
        {
            guardian = new Guardian
            {
                Id = Guid.NewGuid(), TenantId = tenantId,
                FirstName = "Priya", LastName = "Mehta",
                Phone = "+910000000000", Email = "parent@school.edu",
                UserId = parentUser.Id
            };
            db.Guardians.Add(guardian);
        }

        var linked = await db.StudentGuardians.AnyAsync(sg => sg.StudentId == student.Id && sg.GuardianId == guardian.Id);
        if (!linked)
        {
            db.StudentGuardians.Add(new StudentGuardian
            {
                Id = Guid.NewGuid(), TenantId = tenantId,
                StudentId = student.Id, GuardianId = guardian.Id,
                Relationship = "Mother", IsPrimary = true, CanPickup = true, ReceivesNotifications = true
            });
        }
    }

    private static async Task SeedOpsPackAsync(AppDbContext db, Guid tenantId, Guid schoolId)
    {
        if (!await db.LeaveTypes.AnyAsync(l => l.SchoolId == schoolId))
        {
            db.LeaveTypes.AddRange(
                new LeaveType { TenantId = tenantId, SchoolId = schoolId, Name = "Casual Leave", MaxDaysPerYear = 12 },
                new LeaveType { TenantId = tenantId, SchoolId = schoolId, Name = "Sick Leave", MaxDaysPerYear = 10 },
                new LeaveType { TenantId = tenantId, SchoolId = schoolId, Name = "Earned Leave", MaxDaysPerYear = 15, IsCarryForward = true });
        }

        var existingKeys = await db.IntegrationSettings
            .Where(s => s.SchoolId == schoolId)
            .Select(s => s.ProviderKey)
            .ToListAsync();
        foreach (var def in IntegrationCatalog.Defaults.Where(d => !existingKeys.Contains(d.Key)))
            db.IntegrationSettings.Add(IntegrationCatalog.CreateSetting(tenantId, schoolId, def));

        if (!await db.Routes.AnyAsync(r => r.SchoolId == schoolId))
        {
            db.Routes.Add(new Route
            {
                TenantId = tenantId, SchoolId = schoolId, Name = "Route 1 — Banjara Hills", IsActive = true,
                Stops =
                [
                    new RouteStop { TenantId = tenantId, Name = "Campus gate", StopOrder = 1, PickupTime = new TimeOnly(7, 10), Latitude = 17.4126, Longitude = 78.4090 },
                    new RouteStop { TenantId = tenantId, Name = "Banjara Hills Rd 12", StopOrder = 2, PickupTime = new TimeOnly(7, 25), Latitude = 17.4148, Longitude = 78.4378 },
                    new RouteStop { TenantId = tenantId, Name = "Jubilee Hills checkpost", StopOrder = 3, PickupTime = new TimeOnly(7, 40), Latitude = 17.4319, Longitude = 78.4070 }
                ]
            });
        }

        await db.SaveChangesAsync();
    }
}
