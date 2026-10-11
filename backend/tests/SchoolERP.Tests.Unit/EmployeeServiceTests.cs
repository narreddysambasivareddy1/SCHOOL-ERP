using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;
using Xunit;

namespace SchoolERP.Tests.Unit;

public class EmployeeServiceTests
{
    private AppDbContext CreateDb()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(opts);
    }

    [Fact]
    public async Task CreateEmployee_GeneratesEmployeeCode()
    {
        var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var schoolId = Guid.NewGuid();
        db.Tenants.Add(new Tenant { Id = tenantId, Name = "T1", Slug = "t1" });
        db.Schools.Add(new School { Id = schoolId, TenantId = tenantId, Name = "School1" });
        await db.SaveChangesAsync();

        var svc = new EmployeeService(db);
        var req = new Application.DTOs.CreateEmployeeRequest("Sita", "Lakshmi", "sita@school.edu", null, null, null, new DateOnly(2024, 6, 1));

        var result = await svc.CreateEmployeeAsync(req, schoolId, tenantId, "admin@school.edu");

        result.EmployeeCode.Should().StartWith("EMP-");
        result.FirstName.Should().Be("Sita");
    }

    [Fact]
    public async Task GetEmployees_ReturnsEmpty_WhenNone()
    {
        var db = CreateDb();
        var svc = new EmployeeService(db);
        var result = await svc.GetEmployeesAsync(Guid.NewGuid(), 1, 25, null);
        result.TotalCount.Should().Be(0);
    }
}
