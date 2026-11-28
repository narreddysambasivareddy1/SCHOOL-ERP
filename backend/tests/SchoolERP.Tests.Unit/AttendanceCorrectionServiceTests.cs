using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;
using Xunit;

namespace SchoolERP.Tests.Unit;

public class AttendanceCorrectionServiceTests
{
    [Fact]
    public async Task Request_KeepsOriginalUntilApproval_AndRejectsOtherTenant()
    {
        var db = NewDb();
        var tenantId = Guid.NewGuid();
        var schoolId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var session = new AttendanceSession
        {
            TenantId = tenantId, SchoolId = schoolId, AcademicYearId = Guid.NewGuid(),
            ClassId = Guid.NewGuid(), SectionId = Guid.NewGuid(), Date = new DateOnly(2026, 11, 23), MarkedBy = "teacher@school.edu"
        };
        var record = new StudentAttendance
        {
            TenantId = tenantId, SessionId = session.Id, StudentId = studentId, Code = AttendanceCode.Present
        };
        db.Tenants.Add(new Tenant { Id = tenantId, Name = "T", Slug = "t" });
        db.Schools.Add(new School { Id = schoolId, TenantId = tenantId, Name = "S" });
        db.Students.Add(new Student { Id = studentId, TenantId = tenantId, SchoolId = schoolId, StudentCode = "STU-1", FirstName = "A", LastName = "B", DateOfBirth = new DateOnly(2012, 1, 1) });
        db.AttendanceSessions.Add(session);
        db.StudentAttendances.Add(record);
        await db.SaveChangesAsync();
        var svc = new AttendanceCorrectionService(db);

        var saved = await svc.RequestAsync(schoolId, tenantId, session.Id, studentId, "Absent", "Child left after the register", "teacher@school.edu", CancellationToken.None);
        (await db.StudentAttendances.SingleAsync()).Code.Should().Be(AttendanceCode.Present);
        saved.OriginalCode.Should().Be(AttendanceCode.Present);
        saved.Status.Should().Be("Pending");

        var other = () => svc.DecideAsync(schoolId, Guid.NewGuid(), saved.Id, true, "admin@school.edu", CancellationToken.None);
        await other.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not found*");

        var approved = await svc.DecideAsync(schoolId, tenantId, saved.Id, true, "admin@school.edu", CancellationToken.None);
        approved.Status.Should().Be("Approved");
        (await db.StudentAttendances.SingleAsync()).Code.Should().Be(AttendanceCode.Absent);
        approved.OriginalCode.Should().Be(AttendanceCode.Present);
    }

    [Fact]
    public async Task Reject_LeavesTheOriginalCodeUnchanged()
    {
        var db = NewDb();
        var tenantId = Guid.NewGuid();
        var schoolId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var session = new AttendanceSession
        {
            TenantId = tenantId, SchoolId = schoolId, AcademicYearId = Guid.NewGuid(),
            ClassId = Guid.NewGuid(), SectionId = Guid.NewGuid(), Date = new DateOnly(2026, 11, 2), MarkedBy = "teacher@school.edu"
        };
        db.Tenants.Add(new Tenant { Id = tenantId, Name = "T", Slug = "t2" });
        db.Schools.Add(new School { Id = schoolId, TenantId = tenantId, Name = "S" });
        db.Students.Add(new Student { Id = studentId, TenantId = tenantId, SchoolId = schoolId, StudentCode = "STU-2", FirstName = "A", LastName = "B", DateOfBirth = new DateOnly(2012, 1, 1) });
        db.AttendanceSessions.Add(session);
        db.StudentAttendances.Add(new StudentAttendance { TenantId = tenantId, SessionId = session.Id, StudentId = studentId, Code = AttendanceCode.Late });
        await db.SaveChangesAsync();
        var svc = new AttendanceCorrectionService(db);
        var saved = await svc.RequestAsync(schoolId, tenantId, session.Id, studentId, "Present", "Register was marked late by mistake", "teacher@school.edu", CancellationToken.None);
        var decided = await svc.DecideAsync(schoolId, tenantId, saved.Id, false, "officer@school.edu", CancellationToken.None);
        decided.Status.Should().Be("Rejected");
        (await db.StudentAttendances.SingleAsync()).Code.Should().Be(AttendanceCode.Late);
    }

    [Fact]
    public async Task Request_RejectsShortReason()
    {
        var svc = new AttendanceCorrectionService(NewDb());
        var act = () => svc.RequestAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "Absent", "no", "teacher", CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*reason*");
    }

    private static AppDbContext NewDb()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new AppDbContext(opts);
    }
}
