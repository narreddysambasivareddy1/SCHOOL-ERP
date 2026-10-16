namespace SchoolERP.Infrastructure.Services;

/// <summary>
/// Illustrative India payroll math for demo schools. Confirm PF/ESI/TDS with the school's consultant before live payroll.
/// </summary>
public static class PayrollCalculator
{
    public static PayslipBreakdown Compute(decimal basic)
    {
        if (basic <= 0) basic = 30_000m;
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
