using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Services;

public class AttendanceCorrectionService(AppDbContext db)
{
    public async Task<AttendanceCorrection> RequestAsync(
        Guid schoolId, Guid tenantId, Guid sessionId, Guid studentId, string requestedCode, string reason, string actor, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 5)
            throw new InvalidOperationException("A correction reason of at least 5 characters is required.");
        if (!Enum.TryParse<AttendanceCode>(requestedCode, true, out var next))
            throw new InvalidOperationException("Invalid attendance code.");

        var record = await db.StudentAttendances
            .Include(r => r.Session)
            .FirstOrDefaultAsync(r =>
                r.TenantId == tenantId && r.StudentId == studentId && r.SessionId == sessionId
                && r.Session!.SchoolId == schoolId && r.Session.TenantId == tenantId
                && r.Student!.SchoolId == schoolId && r.Student.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("Attendance record was not found in this school.");
        if (record.Code == next)
            throw new InvalidOperationException("The requested code is already the saved attendance.");

        var pending = await db.AttendanceCorrections.AnyAsync(c =>
            c.TenantId == tenantId && c.SchoolId == schoolId && c.StudentAttendanceId == record.Id && c.Status == "Pending", ct);
        if (pending)
            throw new InvalidOperationException("A correction for this attendance record is already waiting for approval.");

        var correction = new AttendanceCorrection
        {
            TenantId = tenantId,
            SchoolId = schoolId,
            SessionId = sessionId,
            StudentAttendanceId = record.Id,
            StudentId = studentId,
            OriginalCode = record.Code,
            RequestedCode = next,
            Reason = reason.Trim(),
            Status = "Pending",
            RequestedBy = actor,
            CreatedBy = actor
        };
        db.AttendanceCorrections.Add(correction);
        await db.SaveChangesAsync(ct);
        return correction;
    }

    public async Task<AttendanceCorrection> DecideAsync(
        Guid schoolId, Guid tenantId, Guid correctionId, bool approve, string actor, CancellationToken ct)
    {
        var correction = await db.AttendanceCorrections.FirstOrDefaultAsync(c =>
            c.Id == correctionId && c.SchoolId == schoolId && c.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("Correction request was not found.");
        if (correction.Status != "Pending")
            throw new InvalidOperationException("This correction has already been decided.");

        correction.DecidedBy = actor;
        correction.DecidedAt = DateTime.UtcNow;
        correction.UpdatedBy = actor;
        if (!approve)
        {
            correction.Status = "Rejected";
            await db.SaveChangesAsync(ct);
            return correction;
        }

        var record = await db.StudentAttendances.FirstOrDefaultAsync(r =>
            r.Id == correction.StudentAttendanceId && r.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("The original attendance row is missing.");
        record.Code = correction.RequestedCode;
        record.UpdatedBy = actor;
        correction.Status = "Approved";
        await db.SaveChangesAsync(ct);
        return correction;
    }
}
