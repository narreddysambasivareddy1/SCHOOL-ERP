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
}
