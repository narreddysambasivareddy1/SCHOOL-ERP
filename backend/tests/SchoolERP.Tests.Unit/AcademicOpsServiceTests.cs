using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;
using SchoolERP.Application.Interfaces;
using Moq;
using Xunit;

namespace SchoolERP.Tests.Unit;

public class AcademicOpsServiceTests
{
    [Fact]
    public void LessonPlanDeadline_IsFridayAtConfiguredSchoolTime()
    {
        var monday = new DateOnly(2026, 10, 19);
        var deadline = new TimeOnly(18, 0);

        AcademicOpsService.IsLessonPlanDeadlinePassed(monday, deadline, new DateTime(2026, 10, 23, 17, 59, 0))
            .Should().BeFalse();
        AcademicOpsService.IsLessonPlanDeadlinePassed(monday, deadline, new DateTime(2026, 10, 23, 18, 0, 1))
            .Should().BeTrue();
        AcademicOpsService.IsLessonPlanDeadlinePassed(new DateOnly(2026, 10, 21), deadline, new DateTime(2026, 10, 24, 9, 0, 0))
            .Should().BeTrue();
    }

    [Fact]
    public async Task UpsertSlot_RejectsTeacherWithoutMatchingAssignment()
    {
        await using var db = CreateDb();
        var data = await SeedAsync(db);
        var service = new AcademicOpsService(db, Mock.Of<INotificationService>());

        var act = () => service.UpsertSlotAsync(data.SchoolId, data.TenantId, data.YearId,
            data.ClassId, data.SectionId, 1, data.PeriodId, data.SubjectId, data.EmployeeId, null, "admin", default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not assigned to this class*");
    }

    [Fact]
    public async Task UpsertSlot_RejectsSectionFromAnotherClass()
    {
        await using var db = CreateDb();
        var data = await SeedAsync(db);
        var otherClass = new SchoolERP.Domain.Entities.Class
        {
            TenantId = data.TenantId, SchoolId = data.SchoolId, Name = "Grade 8"
        };
        db.Classes.Add(otherClass);
        var otherSection = new Section { TenantId = data.TenantId, ClassId = otherClass.Id, Name = "A" };
        db.Sections.Add(otherSection);
        await db.SaveChangesAsync();

        var service = new AcademicOpsService(db, Mock.Of<INotificationService>());
        var act = () => service.UpsertSlotAsync(data.SchoolId, data.TenantId, data.YearId,
            data.ClassId, otherSection.Id, 1, data.PeriodId, data.SubjectId, data.EmployeeId, null, "admin", default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Section not found for this class*");
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<AcademicOpsTestData> SeedAsync(AppDbContext db)
    {
        var tenant = new Tenant { Name = "Tenant", Slug = Guid.NewGuid().ToString("N") };
        var school = new School { TenantId = tenant.Id, Name = "School" };
        var year = new AcademicYear
        {
            TenantId = tenant.Id, SchoolId = school.Id, Name = "2026-27",
            StartDate = new DateOnly(2026, 6, 1), EndDate = new DateOnly(2027, 5, 31), IsCurrent = true
        };
        var cls = new SchoolERP.Domain.Entities.Class { TenantId = tenant.Id, SchoolId = school.Id, Name = "Grade 7" };
        var section = new Section { TenantId = tenant.Id, ClassId = cls.Id, Name = "A" };
        var subject = new Subject { TenantId = tenant.Id, SchoolId = school.Id, Name = "Mathematics", Code = "MATH" };
        var employee = new Employee
        {
            TenantId = tenant.Id, SchoolId = school.Id, EmployeeCode = "T-01", FirstName = "Teacher",
            LastName = "One", JoiningDate = new DateOnly(2020, 1, 1), Status = EmployeeStatus.Active
        };
        var period = new TimetablePeriod
        {
            TenantId = tenant.Id, SchoolId = school.Id, AcademicYearId = year.Id,
            Name = "P1", SortOrder = 1, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(8, 45)
        };
        db.AddRange(tenant, school, year, cls, section, subject, employee, period);
        await db.SaveChangesAsync();
        return new AcademicOpsTestData(tenant.Id, school.Id, year.Id, cls.Id, section.Id, subject.Id, employee.Id, period.Id);
    }

    private sealed record AcademicOpsTestData(
        Guid TenantId, Guid SchoolId, Guid YearId, Guid ClassId, Guid SectionId,
        Guid SubjectId, Guid EmployeeId, Guid PeriodId);
}
