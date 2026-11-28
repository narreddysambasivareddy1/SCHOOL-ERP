using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;
using Xunit;

namespace SchoolERP.Tests.Unit;

public class StudentServiceTests
{
    private AppDbContext CreateDb()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(opts);
    }

    [Fact]
    public async Task CreateStudent_GeneratesStudentCode()
    {
        var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var schoolId = Guid.NewGuid();

        db.Tenants.Add(new Tenant { Id = tenantId, Name = "T1", Slug = "t1" });
        db.Schools.Add(new School { Id = schoolId, TenantId = tenantId, Name = "School1" });
        var ay = new AcademicYear { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "2026-27", StartDate = new DateOnly(2026,6,1), EndDate = new DateOnly(2027,3,31) };
        var cls = new Class { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Grade 6" };
        var sec = new Section { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = cls.Id, Name = "A" };
        db.AcademicYears.Add(ay);
        db.Classes.Add(cls);
        db.Sections.Add(sec);
        await db.SaveChangesAsync();

        var svc = new StudentService(db);
        var req = new Application.DTOs.CreateStudentRequest("Aarav", "Sharma", new DateOnly(2012,5,10), ay.Id, cls.Id, sec.Id, "01");

        var result = await svc.CreateStudentAsync(req, schoolId, tenantId, "admin@school.edu");

        result.StudentCode.Should().StartWith("STU-");
        result.FirstName.Should().Be("Aarav");
        result.LastName.Should().Be("Sharma");
    }

    [Fact]
    public async Task CreateStudent_RejectsClassFromAnotherSchoolOrTenant()
    {
        var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var otherTenantId = Guid.NewGuid();
        var schoolId = Guid.NewGuid();
        var otherSchoolId = Guid.NewGuid();
        db.Tenants.AddRange(
            new Tenant { Id = tenantId, Name = "T1", Slug = "t1" },
            new Tenant { Id = otherTenantId, Name = "T2", Slug = "t2" });
        db.Schools.AddRange(
            new School { Id = schoolId, TenantId = tenantId, Name = "School1" },
            new School { Id = otherSchoolId, TenantId = otherTenantId, Name = "Other" });
        var ay = new AcademicYear { Id = Guid.NewGuid(), TenantId = otherTenantId, SchoolId = otherSchoolId, Name = "2026-27", StartDate = new DateOnly(2026, 6, 1), EndDate = new DateOnly(2027, 3, 31) };
        var cls = new Class { Id = Guid.NewGuid(), TenantId = otherTenantId, SchoolId = otherSchoolId, Name = "Grade 1" };
        var sec = new Section { Id = Guid.NewGuid(), TenantId = otherTenantId, ClassId = cls.Id, Name = "A" };
        db.AcademicYears.Add(ay);
        db.Classes.Add(cls);
        db.Sections.Add(sec);
        await db.SaveChangesAsync();

        var svc = new StudentService(db);
        var req = new Application.DTOs.CreateStudentRequest("Aarav", "Sharma", new DateOnly(2012, 5, 10), ay.Id, cls.Id, sec.Id, "01");

        var act = () => svc.CreateStudentAsync(req, schoolId, tenantId, "admin@school.edu");

        await act.Should().ThrowAsync<InvalidOperationException>();
        (await db.Students.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task GetStudent_ReturnsNull_WhenNotFound()
    {
        var db = CreateDb();
        var svc = new StudentService(db);
        var result = await svc.GetStudentAsync(Guid.NewGuid(), Guid.NewGuid());
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetStudents_ReturnsEmpty_WhenNoEnrollments()
    {
        var db = CreateDb();
        var svc = new StudentService(db);
        var result = await svc.GetStudentsAsync(Guid.NewGuid(), Guid.NewGuid(), 1, 25, null);
        result.TotalCount.Should().Be(0);
        result.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task UpdateStudent_ChangesClassContactAndStatus()
    {
        var (db, tenantId, schoolId, yearId, classId, sectionId) = await SeedAsync();
        var otherClass = new Class { Id = Guid.NewGuid(), TenantId = tenantId, SchoolId = schoolId, Name = "Grade 7" };
        var otherSection = new Section { Id = Guid.NewGuid(), TenantId = tenantId, ClassId = otherClass.Id, Name = "B" };
        db.Classes.Add(otherClass);
        db.Sections.Add(otherSection);
        await db.SaveChangesAsync();
        var svc = new StudentService(db);
        var created = await svc.CreateStudentAsync(
            new Application.DTOs.CreateStudentRequest("Aarav", "Sharma", new DateOnly(2012, 5, 10), yearId, classId, sectionId, "01"),
            schoolId, tenantId, "admin@school.edu");

        var updated = await svc.UpdateStudentAsync(created.Id, schoolId, tenantId, new Application.DTOs.UpdateStudentRequest(
            "Aarav", "Reddy", new DateOnly(2012, 5, 10), null, "Inactive", yearId, otherClass.Id, otherSection.Id, "12",
            "Meera Reddy", "9876543210", "meera@school.edu"), "admin@school.edu");

        updated.LastName.Should().Be("Reddy");
        updated.Status.Should().Be("Inactive");
        updated.Enrollments.Should().Contain(e => e.ClassId == otherClass.Id && e.SectionId == otherSection.Id && e.RollNumber == "12");
        updated.Guardians.Should().Contain(g => g.Phone == "9876543210" && g.IsPrimary && g.Email == "meera@school.edu");
    }

    [Fact]
    public async Task UpdateStudent_RejectsAnotherTenantAndInvalidPhone()
    {
        var (db, tenantId, schoolId, yearId, classId, sectionId) = await SeedAsync();
        var svc = new StudentService(db);
        var created = await svc.CreateStudentAsync(
            new Application.DTOs.CreateStudentRequest("Aarav", "Sharma", new DateOnly(2012, 5, 10), yearId, classId, sectionId, "01"),
            schoolId, tenantId, "admin@school.edu");
        var update = new Application.DTOs.UpdateStudentRequest(
            "Aarav", "Sharma", new DateOnly(2012, 5, 10), null, "Active", yearId, classId, sectionId, "01",
            null, "12", null);

        var badPhone = () => svc.UpdateStudentAsync(created.Id, schoolId, tenantId, update, "admin@school.edu");
        await badPhone.Should().ThrowAsync<InvalidOperationException>().WithMessage("*phone*");

        var otherTenant = () => svc.UpdateStudentAsync(created.Id, schoolId, Guid.NewGuid(), update with { ContactPhone = "9876543210" }, "admin@school.edu");
        await otherTenant.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not found*");
    }

    private async Task<(AppDbContext db, Guid tenantId, Guid schoolId, Guid yearId, Guid classId, Guid sectionId)> SeedAsync()
    {
        var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var schoolId = Guid.NewGuid();
        db.Tenants.Add(new Tenant { Id = tenantId, Name = "T1", Slug = "t1" });
        db.Schools.Add(new School { Id = schoolId, TenantId = tenantId, Name = "School1" });
        var yearId = Guid.NewGuid();
        var classId = Guid.NewGuid();
        var sectionId = Guid.NewGuid();
        db.AcademicYears.Add(new AcademicYear { Id = yearId, TenantId = tenantId, SchoolId = schoolId, Name = "2026-27", StartDate = new DateOnly(2026, 6, 1), EndDate = new DateOnly(2027, 3, 31) });
        db.Classes.Add(new Class { Id = classId, TenantId = tenantId, SchoolId = schoolId, Name = "Grade 6" });
        db.Sections.Add(new Section { Id = sectionId, TenantId = tenantId, ClassId = classId, Name = "A" });
        await db.SaveChangesAsync();
        return (db, tenantId, schoolId, yearId, classId, sectionId);
    }
}
