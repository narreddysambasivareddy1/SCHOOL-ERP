using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Services;

namespace SchoolERP.API.Controllers;

public record CreatePayrollRunRequest(int Year, int Month);

[ApiController]
[Route("api/schools/{schoolId}/payroll")]
[Authorize(Roles = "SchoolAdmin,HRManager,PayrollOfficer")]
public class PayrollController(AppDbContext db, IAuditService audit) : ControllerBase
{
    [HttpGet("runs")]
    public async Task<IActionResult> Runs(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var list = await db.PayrollRuns
            .Where(r => r.SchoolId == schoolId && r.TenantId == tenantId)
            .OrderByDescending(r => r.PeriodYear).ThenByDescending(r => r.PeriodMonth)
            .Select(r => new
            {
                r.Id, r.PeriodLabel, r.PeriodYear, r.PeriodMonth, r.Status,
                r.EmployeeCount, r.GrossTotal, r.PfTotal, r.EsiTotal, r.TdsTotal, r.NetTotal, r.FinalizedAt
            })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpPost("runs")]
    public async Task<IActionResult> Create(Guid schoolId, [FromBody] CreatePayrollRunRequest req, CancellationToken ct)
    {
        if (req.Month is < 1 or > 12) return BadRequest(new { error = "Month must be 1-12." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var exists = await db.PayrollRuns.AnyAsync(r => r.SchoolId == schoolId && r.PeriodYear == req.Year && r.PeriodMonth == req.Month, ct);
        if (exists) return Conflict(new { error = "A payroll run already exists for that period." });

        var staff = await db.Employees
            .Where(e => e.SchoolId == schoolId && e.TenantId == tenantId && e.Status == EmployeeStatus.Active)
            .ToListAsync(ct);
        var label = new DateOnly(req.Year, req.Month, 1).ToString("MMMM yyyy");
        var run = new PayrollRun
        {
            TenantId = tenantId, SchoolId = schoolId,
            PeriodYear = req.Year, PeriodMonth = req.Month, PeriodLabel = label,
            Status = "Draft", CreatedBy = actor
        };
        foreach (var emp in staff)
        {
            var calc = PayrollCalculator.Compute(emp.BasicSalary);
            run.Payslips.Add(new Payslip
            {
                TenantId = tenantId, EmployeeId = emp.Id,
                Basic = calc.Basic, Hra = calc.Hra, Allowance = calc.Allowance, Gross = calc.Gross,
                Pf = calc.Pf, Esi = calc.Esi, ProfessionalTax = calc.ProfessionalTax, Tds = calc.Tds, Net = calc.Net,
                CreatedBy = actor
            });
        }
        Totals(run);
        db.PayrollRuns.Add(run);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "PayrollRunCreated", "PayrollRun", run.Id.ToString(), newValues: new { label, run.EmployeeCount });
        return Ok(new { run.Id, run.PeriodLabel, run.Status, run.EmployeeCount, run.NetTotal });
    }

    [HttpPost("runs/{runId}/finalize")]
    public async Task<IActionResult> Finalize(Guid schoolId, Guid runId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var run = await db.PayrollRuns.FirstOrDefaultAsync(r => r.Id == runId && r.SchoolId == schoolId && r.TenantId == tenantId, ct);
        if (run is null) return NotFound();
        if (run.Status == "Finalized") return Conflict(new { error = "Already finalized." });
        run.Status = "Finalized";
        run.FinalizedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(tenantId, actor, "PayrollFinalized", "PayrollRun", run.Id.ToString());
        return Ok(new { run.Id, run.Status, run.FinalizedAt });
    }

    [HttpGet("runs/{runId}/payslips")]
    public async Task<IActionResult> Payslips(Guid schoolId, Guid runId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var list = await db.Payslips
            .Where(p => p.PayrollRunId == runId && p.TenantId == tenantId)
            .Include(p => p.Employee)
            .OrderBy(p => p.Employee!.EmployeeCode)
            .Select(p => new
            {
                p.Id,
                employee = p.Employee!.FirstName + " " + p.Employee.LastName,
                code = p.Employee.EmployeeCode,
                p.Basic, p.Hra, p.Allowance, p.Gross, p.Pf, p.Esi, p.ProfessionalTax, p.Tds, p.Net
            })
            .ToListAsync(ct);
        return Ok(list);
    }

    private static void Totals(PayrollRun run)
    {
        run.EmployeeCount = run.Payslips.Count;
        run.GrossTotal = run.Payslips.Sum(p => p.Gross);
        run.PfTotal = run.Payslips.Sum(p => p.Pf);
        run.EsiTotal = run.Payslips.Sum(p => p.Esi);
        run.TdsTotal = run.Payslips.Sum(p => p.Tds);
        run.NetTotal = run.Payslips.Sum(p => p.Net);
    }
}
