using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.DTOs;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;
using Xunit;

namespace SchoolERP.Tests.Unit;

public class RegistrationServiceTests
{
    [Fact]
    public async Task Create_RejectsAnotherSchoolClass_AndDuplicate_AndFeeUsesSavedAmount()
    {
        var db = NewDb();
        var tenant = Guid.NewGuid();
        var school = Guid.NewGuid();
        var year = Guid.NewGuid();
        var cls = Guid.NewGuid();
        var section = Guid.NewGuid();
        db.Tenants.Add(new Tenant { Id = tenant, Name = "T", Slug = "t" });
        db.Schools.Add(new School { Id = school, TenantId = tenant, Name = "S" });
        db.AcademicYears.Add(new AcademicYear { Id = year, TenantId = tenant, SchoolId = school, Name = "2026-27", StartDate = new DateOnly(2026, 6, 1), EndDate = new DateOnly(2027, 3, 31) });
        db.Classes.Add(new Class { Id = cls, TenantId = tenant, SchoolId = school, Name = "Grade 1" });
        db.Sections.Add(new Section { Id = section, TenantId = tenant, ClassId = cls, Name = "A", Capacity = 30 });
        await db.SaveChangesAsync();
        var svc = new RegistrationService(db, new AuditService(db));
        var req = new CreateRegistrationRequest(year, "Asha", "Rao", new DateOnly(2016, 1, 2), "Female", cls, section, "Meera Rao", "9876543210", null, "Mother", 1500);

        var foreign = () => svc.CreateAsync(school, tenant, req with { PreferredClassId = Guid.NewGuid() }, "admin", CancellationToken.None);
        await foreign.Should().ThrowAsync<InvalidOperationException>().WithMessage("*does not belong*");

        var created = await svc.CreateAsync(school, tenant, req, "admin", CancellationToken.None);
        var id = (Guid)created.GetType().GetProperty("Id")!.GetValue(created)!;
        var duplicate = () => svc.CreateAsync(school, tenant, req, "admin", CancellationToken.None);
        await duplicate.Should().ThrowAsync<InvalidOperationException>().WithMessage("*already exists*");

        var wrongAmount = () => svc.PayFeeAsync(school, tenant, id, new PayRegistrationFeeRequest(10, "Cash"), "admin", CancellationToken.None);
        await wrongAmount.Should().ThrowAsync<InvalidOperationException>().WithMessage("*saved registration fee*");
        (await db.StudentRegistrations.SingleAsync()).FeePaid.Should().BeFalse();

        var paid = await svc.PayFeeAsync(school, tenant, id, new PayRegistrationFeeRequest(1500, "Cash"), "admin", CancellationToken.None);
        paid.GetType().GetProperty("RegistrationFeeAmount")!.GetValue(paid).Should().Be(1500m);
        var again = () => svc.PayFeeAsync(school, tenant, id, new PayRegistrationFeeRequest(1500, "Cash"), "admin", CancellationToken.None);
        await again.Should().ThrowAsync<InvalidOperationException>().WithMessage("*already been collected*");

        var otherTenant = () => svc.PayFeeAsync(school, Guid.NewGuid(), id, new PayRegistrationFeeRequest(1500, "Cash"), "admin", CancellationToken.None);
        await otherTenant.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not found*");

        var zero = () => svc.PayFeeAsync(school, tenant, id, new PayRegistrationFeeRequest(0, "Cash"), "admin", CancellationToken.None);
        await zero.Should().ThrowAsync<InvalidOperationException>().WithMessage("*already been collected*");
    }

    [Fact]
    public async Task Summary_AndList_UseStoredRows_AndRejectANonPositivePayment()
    {
        var db = NewDb();
        var tenant = Guid.NewGuid();
        var school = Guid.NewGuid();
        var year = Guid.NewGuid();
        var cls = Guid.NewGuid();
        var section = Guid.NewGuid();
        db.Tenants.Add(new Tenant { Id = tenant, Name = "T", Slug = "t3" });
        db.Schools.Add(new School { Id = school, TenantId = tenant, Name = "S" });
        db.AcademicYears.Add(new AcademicYear { Id = year, TenantId = tenant, SchoolId = school, Name = "2026-27", StartDate = new DateOnly(2026, 6, 1), EndDate = new DateOnly(2027, 3, 31) });
        db.Classes.Add(new Class { Id = cls, TenantId = tenant, SchoolId = school, Name = "Grade 1" });
        db.Sections.Add(new Section { Id = section, TenantId = tenant, ClassId = cls, Name = "A", Capacity = 30 });
        await db.SaveChangesAsync();
        var svc = new RegistrationService(db, new AuditService(db));
        var req = new CreateRegistrationRequest(year, "Nila", "Das", new DateOnly(2016, 3, 3), "Female", cls, section, "Ravi Das", "9000011111", null, "Father", 500);
        var created = await svc.CreateAsync(school, tenant, req, "admin", CancellationToken.None);
        var id = (Guid)created.GetType().GetProperty("Id")!.GetValue(created)!;

        var negative = () => svc.PayFeeAsync(school, tenant, id, new PayRegistrationFeeRequest(-5, "Cash"), "admin", CancellationToken.None);
        await negative.Should().ThrowAsync<InvalidOperationException>().WithMessage("*greater than zero*");

        var page = await svc.ListAsync(school, tenant, "Nila", year, cls, null, null, null, null, null, "name", false, 1, 20, CancellationToken.None);
        page.GetType().GetProperty("total")!.GetValue(page).Should().Be(1);
        var detail = await svc.GetAsync(school, tenant, id, CancellationToken.None);
        var checklist = (System.Collections.IEnumerable)detail.GetType().GetProperty("checklist")!.GetValue(detail)!;
        checklist.Cast<object>().Should().HaveCount(3);
    }

    [Fact]
    public async Task RejectDocument_RecordsReviewer_AndKeepsItUnverified()
    {
        var db = NewDb();
        var tenant = Guid.NewGuid();
        var school = Guid.NewGuid();
        db.Tenants.Add(new Tenant { Id = tenant, Name = "T", Slug = "t2" });
        db.Schools.Add(new School { Id = school, TenantId = tenant, Name = "S" });
        var registration = new StudentRegistration
        {
            TenantId = tenant, SchoolId = school, AcademicYearId = Guid.NewGuid(), RegistrationNumber = "REG-1",
            FirstName = "A", LastName = "B", DateOfBirth = new DateOnly(2015, 1, 1), GuardianName = "G", GuardianPhone = "9000000000", RegistrationFeeAmount = 100
        };
        db.StudentRegistrations.Add(registration);
        var doc = new StudentDocument { TenantId = tenant, SchoolId = school, RegistrationId = registration.Id, Kind = StudentDocumentKind.Identity, FileName = "id.pdf" };
        db.StudentDocuments.Add(doc);
        await db.SaveChangesAsync();
        var svc = new RegistrationService(db, new AuditService(db));

        var shortReason = () => svc.RejectDocumentAsync(school, tenant, doc.Id, "no", "officer", CancellationToken.None);
        await shortReason.Should().ThrowAsync<InvalidOperationException>();
        await svc.RejectDocumentAsync(school, tenant, doc.Id, "Photo is unreadable", "officer", CancellationToken.None);

        var saved = await db.StudentDocuments.SingleAsync();
        saved.Verified.Should().BeFalse();
        saved.VerifiedBy.Should().Be("officer");
        saved.VerifiedAt.Should().NotBeNull();
        saved.ReviewNote.Should().Be("Photo is unreadable");
        (await db.AuditEvents.AnyAsync(a => a.Action == "RegistrationDocumentRejected")).Should().BeTrue();
    }

    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new AppDbContext(options);
    }
}
