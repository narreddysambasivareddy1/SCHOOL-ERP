using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.DTOs;
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

    private async Task<(AppDbContext db, Guid tenantId, Guid schoolId)> SeedSchoolAsync()
    {
        var db = CreateDb();
        var tenantId = Guid.NewGuid();
        var schoolId = Guid.NewGuid();
        db.Tenants.Add(new Tenant { Id = tenantId, Name = "T1", Slug = "t1" });
        db.Schools.Add(new School { Id = schoolId, TenantId = tenantId, Name = "School1" });
        await db.SaveChangesAsync();
        return (db, tenantId, schoolId);
    }

    // ── Employee code generation ────────────────────────────────────────────

    [Fact]
    public async Task CreateEmployee_GeneratesEmployeeCode()
    {
        var (db, tenantId, schoolId) = await SeedSchoolAsync();
        var svc = new EmployeeService(db);
        var req = new CreateEmployeeRequest(
            "Sita", "Lakshmi", "sita@school.edu", null, null, null,
            new DateOnly(2024, 6, 1), BasicSalary: 40_000m);

        var result = await svc.CreateEmployeeAsync(req, schoolId, tenantId, "admin@school.edu");

        result.EmployeeCode.Should().StartWith("EMP-");
        result.FirstName.Should().Be("Sita");
    }

    // ── Salary is persisted exactly as submitted ────────────────────────────

    [Fact]
    public async Task CreateEmployee_PersistsSalaryFromRequest()
    {
        var (db, tenantId, schoolId) = await SeedSchoolAsync();
        var svc = new EmployeeService(db);
        var req = new CreateEmployeeRequest(
            "Ravi", "Kumar", "ravi@school.edu", null, null, null,
            new DateOnly(2024, 6, 1), BasicSalary: 52_000m);

        var result = await svc.CreateEmployeeAsync(req, schoolId, tenantId, "admin@school.edu");

        var saved = await db.Employees.FirstAsync(e => e.Id == result.Id);
        saved.BasicSalary.Should().Be(52_000m);
    }

    [Fact]
    public async Task CreateEmployee_RejectsZeroSalary()
    {
        var (db, tenantId, schoolId) = await SeedSchoolAsync();
        var svc = new EmployeeService(db);
        var req = new CreateEmployeeRequest(
            "Temp", "Staff", null, null, null, null,
            new DateOnly(2024, 6, 1), BasicSalary: 0m);

        var act = async () => await svc.CreateEmployeeAsync(req, schoolId, tenantId, "admin@school.edu");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*greater than zero*");
        (await db.Employees.CountAsync()).Should().Be(0);
    }

    // ── Negative salary is rejected ─────────────────────────────────────────

    [Fact]
    public async Task CreateEmployee_RejectsNegativeSalary()
    {
        var (db, tenantId, schoolId) = await SeedSchoolAsync();
        var svc = new EmployeeService(db);
        var req = new CreateEmployeeRequest(
            "Bad", "Data", null, null, null, null,
            new DateOnly(2024, 6, 1), BasicSalary: -1m);

        var act = async () => await svc.CreateEmployeeAsync(req, schoolId, tenantId, "admin@school.edu");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*greater than zero*");
    }

    // ── Empty list when no employees ────────────────────────────────────────

    [Fact]
    public async Task GetEmployees_ReturnsEmpty_WhenNone()
    {
        var db = CreateDb();
        var svc = new EmployeeService(db);
        var result = await svc.GetEmployeesAsync(Guid.NewGuid(), 1, 25, null);
        result.TotalCount.Should().Be(0);
    }
}

public class PayrollCalculatorTests
{
    // ── Normal salary produces correct breakdown ────────────────────────────

    [Fact]
    public void Compute_CorrectBreakdown_ForTypicalSalary()
    {
        var result = PayrollCalculator.Compute(30_000m);

        result.Basic.Should().Be(30_000m);
        result.Hra.Should().Be(12_000m);        // 40 %
        result.Allowance.Should().Be(3_000m);   // 10 %
        result.Gross.Should().Be(45_000m);
        result.Pf.Should().Be(1_800m);          // 12 % of min(30000, 15000) = 1800
        result.Esi.Should().Be(0m);             // gross > 21000 → no ESI
        result.ProfessionalTax.Should().Be(200m);
        result.Net.Should().BeGreaterThan(0m);
        result.Net.Should().Be(result.Gross - result.Pf - result.Esi - result.ProfessionalTax - result.Tds);
    }

    [Fact]
    public void Compute_EsiApplied_WhenGrossUnder21000()
    {
        // basic=12000 → gross=12000+4800+1200=18000 ≤ 21000
        var result = PayrollCalculator.Compute(12_000m);

        result.Gross.Should().Be(18_000m);
        result.Esi.Should().Be(Math.Round(18_000m * 0.0075m, 2, MidpointRounding.AwayFromZero));
    }

    [Fact]
    public void Compute_PfCappedAt15000Wage()
    {
        // basic=50000 → PF wage capped at 15000 → PF = 1800
        var result = PayrollCalculator.Compute(50_000m);
        result.Pf.Should().Be(1_800m);
    }

    // ── Zero salary throws ──────────────────────────────────────────────────

    [Fact]
    public void Compute_ThrowsOnZeroSalary()
    {
        var act = () => PayrollCalculator.Compute(0m);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*greater than zero*");
    }

    [Fact]
    public void Compute_ThrowsOnNegativeSalary()
    {
        var act = () => PayrollCalculator.Compute(-500m);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*greater than zero*");
    }

    // ── Net pay is always positive for valid salaries ───────────────────────

    [Theory]
    [InlineData(15_000)]
    [InlineData(25_000)]
    [InlineData(50_000)]
    [InlineData(100_000)]
    public void Compute_NetIsPositive(decimal basic)
    {
        var result = PayrollCalculator.Compute(basic);
        result.Net.Should().BeGreaterThan(0m);
    }
}
