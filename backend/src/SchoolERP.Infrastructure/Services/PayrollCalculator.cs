namespace SchoolERP.Infrastructure.Services;

/// <summary>
/// Illustrative India payroll math for demo schools.
/// Confirm PF/ESI/TDS rates with the school's statutory consultant before live payroll.
/// Throws if basic salary is zero or negative — callers must supply a real salary.
/// </summary>
public static class PayrollCalculator
{
    public static PayslipBreakdown Compute(decimal basic)
    {
        if (basic <= 0)
            throw new InvalidOperationException(
                "Basic salary must be greater than zero. Update the employee record before running payroll.");

        var hra = Round(basic * 0.40m);
        var allowance = Round(basic * 0.10m);
        var gross = basic + hra + allowance;

        var pfWage = Math.Min(basic, 15_000m);
        var pf = Round(pfWage * 0.12m);
        var esi = gross <= 21_000m ? Round(gross * 0.0075m) : 0m;
        var professionalTax = gross >= 15_000m ? 200m : 0m;

        var annual = gross * 12m;
        var taxable = Math.Max(0, annual - 400_000m);
        var tds = Round(taxable * 0.05m / 12m);

        var net = gross - pf - esi - professionalTax - tds;
        return new PayslipBreakdown(basic, hra, allowance, gross, pf, esi, professionalTax, tds, net);
    }

    private static decimal Round(decimal v) => Math.Round(v, 2, MidpointRounding.AwayFromZero);
}

public record PayslipBreakdown(
    decimal Basic, decimal Hra, decimal Allowance, decimal Gross,
    decimal Pf, decimal Esi, decimal ProfessionalTax, decimal Tds, decimal Net);
