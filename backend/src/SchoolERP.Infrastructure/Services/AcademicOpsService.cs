using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Services;

public record TeacherOption(Guid Id, string Name, string EmployeeCode);
public record ExpectedDiaryEntry(Guid SectionId, Guid EmployeeId, string ClassName, string SectionName, string Teacher);

public class AcademicOpsService(AppDbContext db, INotificationService notifications)
{
    public static int IsoDay(DateOnly date)
    {
        var w = (int)date.DayOfWeek;
        return w == 0 ? 7 : w;
    }

    public static DateOnly WeekStart(DateOnly date)
    {
        var iso = IsoDay(date);
        return date.AddDays(-(iso - 1));
    }

    public static bool IsLessonPlanDeadlinePassed(DateOnly weekStart, TimeOnly deadline, DateTime localNow) =>
        localNow > WeekStart(weekStart).AddDays(4).ToDateTime(deadline);

    public static TimeOnly NowIst() => TimeOnly.FromDateTime(DateTime.UtcNow.AddHours(5.5));

    private async Task EnsureSchoolAsync(Guid schoolId, Guid tenantId, CancellationToken ct)
    {
        if (!await db.Schools.AnyAsync(s => s.Id == schoolId && s.TenantId == tenantId, ct))
            throw new InvalidOperationException("School not found.");
    }

    private async Task EnsureSchoolYearAsync(Guid schoolId, Guid tenantId, Guid yearId, CancellationToken ct)
    {
        await EnsureSchoolAsync(schoolId, tenantId, ct);
        if (!await db.AcademicYears.AnyAsync(y =>
                y.Id == yearId && y.SchoolId == schoolId && y.TenantId == tenantId, ct))
            throw new InvalidOperationException("Academic year not found for this school.");
    }

    private async Task EnsureSectionAsync(Guid schoolId, Guid tenantId, Guid classId, Guid sectionId, CancellationToken ct)
    {
        if (!await db.Sections.AnyAsync(s => s.Id == sectionId && s.TenantId == tenantId &&
                s.ClassId == classId && s.Class != null && s.Class.SchoolId == schoolId &&
                s.Class.TenantId == tenantId, ct))
            throw new InvalidOperationException("Section not found for this class and school.");
    }

    private async Task EnsureTeachingAssignmentAsync(
        Guid schoolId, Guid tenantId, Guid yearId, Guid classId, Guid sectionId, Guid subjectId, Guid employeeId, CancellationToken ct)
    {
        var valid = await db.TeacherAssignments.AnyAsync(a =>
            a.TenantId == tenantId && a.AcademicYearId == yearId && a.ClassId == classId &&
            a.SectionId == sectionId && a.SubjectId == subjectId && a.EmployeeId == employeeId &&
            a.IsActive && a.Employee != null && a.Employee.SchoolId == schoolId &&
            a.Employee.TenantId == tenantId && a.Employee.Status == EmployeeStatus.Active &&
            a.Subject != null && a.Subject.SchoolId == schoolId && a.Subject.TenantId == tenantId, ct);
        if (!valid)
            throw new InvalidOperationException("The teacher is not assigned to this class, section, and subject for the academic year.");
    }

    public async Task<SchoolAcademicSetting> SettingsAsync(Guid schoolId, Guid tenantId, CancellationToken ct)
    {
        await EnsureSchoolAsync(schoolId, tenantId, ct);
        var s = await db.SchoolAcademicSettings.FirstOrDefaultAsync(x => x.SchoolId == schoolId && x.TenantId == tenantId, ct);
        if (s is not null) return s;
        s = new SchoolAcademicSetting
        {
            TenantId = tenantId, SchoolId = schoolId,
            DiaryDeadline = new TimeOnly(16, 30), WeeklyPlanDeadline = new TimeOnly(18, 0)
        };
        db.SchoolAcademicSettings.Add(s);
        await db.SaveChangesAsync(ct);
        return s;
    }

    public async Task<object> SaveSettingsAsync(
        Guid schoolId, Guid tenantId, TimeOnly deadline, TimeOnly? weeklyPlanDeadline, CancellationToken ct)
    {
        var s = await SettingsAsync(schoolId, tenantId, ct);
        s.DiaryDeadline = deadline;
        if (weeklyPlanDeadline is { } planDeadline) s.WeeklyPlanDeadline = planDeadline;
        await db.SaveChangesAsync(ct);
        return new
        {
            diaryDeadline = s.DiaryDeadline.ToString("HH:mm"),
            weeklyPlanDeadline = s.WeeklyPlanDeadline.ToString("HH:mm")
        };
    }

    public async Task<IReadOnlyList<object>> PeriodsAsync(Guid schoolId, Guid yearId, Guid tenantId, CancellationToken ct) =>
        await db.TimetablePeriods.Where(p => p.SchoolId == schoolId && p.AcademicYearId == yearId && p.TenantId == tenantId)
            .OrderBy(p => p.SortOrder)
            .Select(p => (object)new
            {
                p.Id, p.Name, p.SortOrder, startTime = p.StartTime.ToString("HH:mm"), endTime = p.EndTime.ToString("HH:mm"),
                band = p.Band.ToString()
            })
            .ToListAsync(ct);

    public async Task<object> SavePeriodAsync(Guid schoolId, Guid tenantId, Guid yearId, Guid? id, string name, int sortOrder,
        TimeOnly start, TimeOnly end, PeriodBand band, string actor, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        if (string.IsNullOrWhiteSpace(name) || name.Length > 80)
            throw new InvalidOperationException("Period name is required and must be 80 characters or fewer.");
        if (sortOrder < 1 || end <= start)
            throw new InvalidOperationException("Period order must be positive and the end time must be after the start time.");
        var overlaps = await db.TimetablePeriods.AnyAsync(p =>
            p.SchoolId == schoolId && p.TenantId == tenantId && p.AcademicYearId == yearId &&
            p.Id != id && p.StartTime < end && start < p.EndTime, ct);
        if (overlaps)
            throw new InvalidOperationException("Period times cannot overlap another period in the academic year.");
        if (await db.TimetablePeriods.AnyAsync(p => p.SchoolId == schoolId && p.TenantId == tenantId &&
                p.AcademicYearId == yearId && p.Id != id && p.SortOrder == sortOrder, ct))
            throw new InvalidOperationException("Period order is already used in this academic year.");

        TimetablePeriod period;
        if (id is { } existing)
        {
            period = await db.TimetablePeriods.FirstOrDefaultAsync(p => p.Id == existing &&
                p.SchoolId == schoolId && p.TenantId == tenantId && p.AcademicYearId == yearId, ct)
                ?? throw new InvalidOperationException("Period not found.");
        }
        else
        {
            period = new TimetablePeriod { TenantId = tenantId, SchoolId = schoolId, AcademicYearId = yearId, CreatedBy = actor };
            db.TimetablePeriods.Add(period);
        }
        period.Name = name.Trim();
        period.SortOrder = sortOrder;
        period.StartTime = start;
        period.EndTime = end;
        period.Band = band;
        await db.SaveChangesAsync(ct);
        return new { period.Id, period.Name };
    }

    public async Task DeletePeriodAsync(Guid schoolId, Guid tenantId, Guid yearId, Guid periodId, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        var period = await db.TimetablePeriods.FirstOrDefaultAsync(p =>
            p.Id == periodId && p.SchoolId == schoolId && p.TenantId == tenantId &&
            p.AcademicYearId == yearId, ct)
            ?? throw new InvalidOperationException("Period not found.");
        if (await db.TimetableSlots.AnyAsync(s =>
                s.TenantId == tenantId && s.SchoolId == schoolId && s.AcademicYearId == yearId &&
                s.PeriodId == periodId, ct))
            throw new InvalidOperationException("Clear all timetable slots for this period before deleting it.");
        db.TimetablePeriods.Remove(period);
        await db.SaveChangesAsync(ct);
    }

    public async Task<object> GridAsync(Guid schoolId, Guid tenantId, Guid yearId, Guid sectionId, DateOnly? date, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        var section = await db.Sections.Where(s => s.Id == sectionId && s.TenantId == tenantId &&
                s.Class != null && s.Class.SchoolId == schoolId)
            .Select(s => new { s.Id, s.ClassId }).FirstOrDefaultAsync(ct);
        if (section is null) throw new InvalidOperationException("Section not found for this school.");

        var periods = await db.TimetablePeriods.Where(p => p.SchoolId == schoolId && p.AcademicYearId == yearId && p.TenantId == tenantId)
            .OrderBy(p => p.SortOrder).ToListAsync(ct);
        var slots = await db.TimetableSlots.Where(s => s.TenantId == tenantId && s.SchoolId == schoolId &&
                s.AcademicYearId == yearId && s.SectionId == sectionId)
            .Include(s => s.Subject).Include(s => s.Employee).Include(s => s.Period)
            .ToListAsync(ct);
        var overlay = new Dictionary<(int Day, Guid Period), (string Teacher, Guid? SubId)>();
        if (date is { } d)
        {
            var subs = await db.SubstitutionNeeds.Where(n => n.TenantId == tenantId &&
                    n.SchoolId == schoolId && n.Date == d && n.SectionId == sectionId)
                .Include(n => n.SubstituteEmployee).ToListAsync(ct);
            foreach (var n in subs)
            {
                var day = IsoDay(d);
                if (n.Status == SubstitutionStatus.Open)
                    overlay[(day, n.PeriodId)] = ("Unassigned", null);
                else if (n.SubstituteEmployee is not null)
                    overlay[(day, n.PeriodId)] = ($"{n.SubstituteEmployee.FirstName} {n.SubstituteEmployee.LastName} (sub)", n.SubstituteEmployeeId);
            }
        }

        return new
        {
            periods = periods.Select(p => new
            {
                p.Id, p.Name, p.SortOrder, startTime = p.StartTime.ToString("HH:mm"), endTime = p.EndTime.ToString("HH:mm"),
                band = p.Band.ToString()
            }),
            days = Enumerable.Range(1, 6).Select(day => new
            {
                dayOfWeek = day,
                name = new[] { "", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" }[day],
                cells = periods.Select(p =>
                {
                    var slot = slots.FirstOrDefault(s => s.DayOfWeek == day && s.PeriodId == p.Id);
                    overlay.TryGetValue((day, p.Id), out var ov);
                    return new
                    {
                        periodId = p.Id,
                        slotId = slot?.Id,
                        subjectId = slot?.SubjectId,
                        subject = slot?.Subject?.Name,
                        employeeId = slot?.EmployeeId,
                        teacher = ov.Teacher ?? (slot is null ? null : $"{slot.Employee!.FirstName} {slot.Employee.LastName}"),
                        unassigned = ov.Teacher == "Unassigned",
                        electiveGroup = slot?.ElectiveGroup
                    };
                })
            })
        };
    }

    public async Task<object> UpsertSlotAsync(Guid schoolId, Guid tenantId, Guid yearId, Guid classId, Guid sectionId,
        int dayOfWeek, Guid periodId, Guid subjectId, Guid employeeId, string? electiveGroup, string actor, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        await EnsureSectionAsync(schoolId, tenantId, classId, sectionId, ct);
        if (dayOfWeek is < 1 or > 6) throw new InvalidOperationException("Day must be Monday–Saturday.");
        if (!await db.TimetablePeriods.AnyAsync(p => p.Id == periodId && p.SchoolId == schoolId &&
                p.TenantId == tenantId && p.AcademicYearId == yearId, ct))
            throw new InvalidOperationException("Period not found for this academic year.");
        if (!await db.Subjects.AnyAsync(s => s.Id == subjectId && s.SchoolId == schoolId && s.TenantId == tenantId, ct))
            throw new InvalidOperationException("Subject not found for this school.");
        if (!await db.Employees.AnyAsync(e => e.Id == employeeId && e.SchoolId == schoolId &&
                e.TenantId == tenantId && e.Status == EmployeeStatus.Active, ct))
            throw new InvalidOperationException("Active teacher not found for this school.");
        await EnsureTeachingAssignmentAsync(schoolId, tenantId, yearId, classId, sectionId, subjectId, employeeId, ct);

        var clash = await db.TimetableSlots.AnyAsync(s =>
            s.TenantId == tenantId && s.SchoolId == schoolId && s.AcademicYearId == yearId && s.EmployeeId == employeeId
            && s.DayOfWeek == dayOfWeek && s.PeriodId == periodId && s.SectionId != sectionId, ct);
        if (clash) throw new InvalidOperationException("Scheduling conflict: this teacher already has that period on this day.");

        var slot = await db.TimetableSlots.FirstOrDefaultAsync(s =>
            s.TenantId == tenantId && s.SchoolId == schoolId && s.AcademicYearId == yearId &&
            s.SectionId == sectionId && s.DayOfWeek == dayOfWeek && s.PeriodId == periodId, ct);
        if (slot is null)
        {
            slot = new TimetableSlot
            {
                TenantId = tenantId, SchoolId = schoolId, AcademicYearId = yearId, ClassId = classId, SectionId = sectionId,
                DayOfWeek = dayOfWeek, PeriodId = periodId, CreatedBy = actor
            };
            db.TimetableSlots.Add(slot);
        }
        slot.SubjectId = subjectId;
        slot.EmployeeId = employeeId;
        slot.ElectiveGroup = electiveGroup;
        await db.SaveChangesAsync(ct);
        return new { slot.Id };
    }

    public async Task ClearSlotAsync(Guid schoolId, Guid tenantId, Guid slotId, CancellationToken ct)
    {
        var slot = await db.TimetableSlots.FirstOrDefaultAsync(s => s.Id == slotId && s.SchoolId == schoolId && s.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("Slot not found.");
        db.TimetableSlots.Remove(slot);
        await db.SaveChangesAsync(ct);
    }

    public async Task<int> OpenSubstitutionsForLeaveAsync(Guid schoolId, Guid tenantId, LeaveRequest leave, CancellationToken ct)
    {
        await EnsureSchoolAsync(schoolId, tenantId, ct);
        if (!await db.Employees.AnyAsync(e => e.Id == leave.EmployeeId && e.SchoolId == schoolId &&
                e.TenantId == tenantId, ct))
            throw new InvalidOperationException("Leave employee does not belong to this school.");

        var created = 0;
        for (var d = leave.FromDate; d <= leave.ToDate; d = d.AddDays(1))
        {
            var iso = IsoDay(d);
            if (iso == 7) continue;
            var yearId = await db.AcademicYears.Where(y => y.SchoolId == schoolId && y.TenantId == tenantId &&
                    y.StartDate <= d && y.EndDate >= d)
                .Select(y => (Guid?)y.Id).FirstOrDefaultAsync(ct);
            if (yearId is null) continue;
            var slots = await db.TimetableSlots.Where(s =>
                s.TenantId == tenantId && s.SchoolId == schoolId && s.AcademicYearId == yearId &&
                s.EmployeeId == leave.EmployeeId && s.DayOfWeek == iso).ToListAsync(ct);
            foreach (var slot in slots)
            {
                var exists = await db.SubstitutionNeeds.AnyAsync(n =>
                    n.TenantId == tenantId && n.SchoolId == schoolId &&
                    n.TimetableSlotId == slot.Id && n.Date == d && n.Status != SubstitutionStatus.Cancelled, ct);
                if (exists) continue;
                db.SubstitutionNeeds.Add(new SubstitutionNeed
                {
                    TenantId = tenantId, SchoolId = schoolId, LeaveRequestId = leave.Id, TimetableSlotId = slot.Id,
                    Date = d, PeriodId = slot.PeriodId, ClassId = slot.ClassId, SectionId = slot.SectionId,
                    SubjectId = slot.SubjectId, OriginalEmployeeId = slot.EmployeeId, Status = SubstitutionStatus.Open
                });
                created++;
            }
        }
        if (created > 0) await db.SaveChangesAsync(ct);
        return created;
    }

    public async Task<IReadOnlyList<object>> SubstitutionsAsync(Guid schoolId, Guid tenantId, DateOnly date, CancellationToken ct)
    {
        return await (
            from n in db.SubstitutionNeeds
            join p in db.TimetablePeriods on n.PeriodId equals p.Id
            join slot in db.TimetableSlots on n.TimetableSlotId equals slot.Id
            join cls in db.Classes on n.ClassId equals cls.Id
            join sec in db.Sections on n.SectionId equals sec.Id
            join sub in db.Subjects on n.SubjectId equals sub.Id
            join orig in db.Employees on n.OriginalEmployeeId equals orig.Id
            join sube in db.Employees on n.SubstituteEmployeeId equals sube.Id into subj
            from sube in subj.DefaultIfEmpty()
            where n.SchoolId == schoolId && n.TenantId == tenantId && n.Date == date
            orderby p.SortOrder
            select (object)new
            {
                n.Id, n.Date, status = n.Status.ToString(),
                period = p.Name, periodId = n.PeriodId,
                className = cls.Name, sectionName = sec.Name, subject = sub.Name,
                original = orig.FirstName + " " + orig.LastName,
                substitute = sube == null ? null : sube.FirstName + " " + sube.LastName,
                n.SubstituteEmployeeId, n.OriginalEmployeeId, n.SectionId, n.ClassId, n.SubjectId
            }).ToListAsync(ct);
    }

    public async Task<List<TeacherOption>> AvailableTeachersAsync(Guid schoolId, Guid tenantId, Guid yearId, DateOnly date, Guid periodId, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        if (!await db.TimetablePeriods.AnyAsync(p => p.Id == periodId && p.SchoolId == schoolId &&
                p.TenantId == tenantId && p.AcademicYearId == yearId, ct))
            throw new InvalidOperationException("Period not found for this academic year.");
        var iso = IsoDay(date);
        var busyIds = await db.TimetableSlots.Where(s => s.TenantId == tenantId && s.SchoolId == schoolId && s.AcademicYearId == yearId
                && s.DayOfWeek == iso && s.PeriodId == periodId)
            .Select(s => s.EmployeeId).ToListAsync(ct);
        var covering = await db.SubstitutionNeeds.Where(n => n.TenantId == tenantId && n.SchoolId == schoolId && n.Date == date
                && n.PeriodId == periodId && n.Status == SubstitutionStatus.Assigned && n.SubstituteEmployeeId != null)
            .Select(n => n.SubstituteEmployeeId!.Value).ToListAsync(ct);
        var onLeave = await db.LeaveRequests.Where(l => l.TenantId == tenantId && l.Status == "Approved"
                && l.FromDate <= date && l.ToDate >= date && l.Employee != null &&
                l.Employee.SchoolId == schoolId && l.Employee.TenantId == tenantId)
            .Select(l => l.EmployeeId).ToListAsync(ct);
        var blocked = busyIds.Concat(covering).Concat(onLeave).ToHashSet();
        return await db.Employees.Where(e => e.SchoolId == schoolId && e.TenantId == tenantId
                && e.Status == EmployeeStatus.Active && !blocked.Contains(e.Id)
                && db.TeacherAssignments.Any(a => a.TenantId == tenantId && a.EmployeeId == e.Id &&
                    a.AcademicYearId == yearId && a.IsActive))
            .Select(e => new TeacherOption(e.Id, e.FirstName + " " + e.LastName, e.EmployeeCode))
            .ToListAsync(ct);
    }

    public async Task AssignSubstituteAsync(Guid schoolId, Guid tenantId, Guid needId, Guid substituteId, CancellationToken ct)
    {
        var need = await db.SubstitutionNeeds.FirstOrDefaultAsync(n => n.Id == needId && n.SchoolId == schoolId && n.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("Substitution not found.");
        if (need.Status != SubstitutionStatus.Open) throw new InvalidOperationException("This period is no longer open.");
        var yearId = await db.TimetableSlots.Where(s => s.Id == need.TimetableSlotId &&
                s.TenantId == tenantId && s.SchoolId == schoolId)
            .Select(s => s.AcademicYearId).FirstAsync(ct);
        var available = await AvailableTeachersAsync(schoolId, tenantId, yearId, need.Date, need.PeriodId, ct);
        if (available.All(a => a.Id != substituteId))
            throw new InvalidOperationException("That teacher is not free in this period.");
        need.SubstituteEmployeeId = substituteId;
        need.Status = SubstitutionStatus.Assigned;
        await db.SaveChangesAsync(ct);
    }

    public async Task<object> OpsTodayAsync(Guid schoolId, Guid tenantId, Guid yearId, DateOnly today, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        var leaves = await db.LeaveRequests.Where(l => l.TenantId == tenantId && l.Status == "Approved"
                && l.FromDate <= today && l.ToDate >= today && l.Employee != null &&
                l.Employee.SchoolId == schoolId && l.Employee.TenantId == tenantId)
            .Include(l => l.Employee)
            .Select(l => new { l.Id, teacher = l.Employee!.FirstName + " " + l.Employee.LastName, l.FromDate, l.ToDate })
            .ToListAsync(ct);
        var open = await SubstitutionsAsync(schoolId, tenantId, today, ct);
        var openList = open.Where(x =>
        {
            var status = x.GetType().GetProperty("status")?.GetValue(x)?.ToString();
            return status == "Open";
        }).ToList();
        var periods = await db.TimetablePeriods.Where(p => p.TenantId == tenantId &&
                p.SchoolId == schoolId && p.AcademicYearId == yearId)
            .OrderBy(p => p.SortOrder).ToListAsync(ct);
        var availability = new List<object>();
        foreach (var p in periods)
        {
            var free = await AvailableTeachersAsync(schoolId, tenantId, yearId, today, p.Id, ct);
            availability.Add(new { periodId = p.Id, period = p.Name, free = free.Count, freeTeachers = free });
        }
        var attendance = await db.EmployeeAttendances.CountAsync(a =>
            a.TenantId == tenantId && a.Date == today && a.Code == AttendanceCode.Present &&
            a.Employee != null && a.Employee.SchoolId == schoolId, ct);
        return new
        {
            date = today,
            onLeave = leaves.Count,
            leaves,
            presentStaff = attendance,
            openSubstitutions = openList.Count,
            substitutions = open,
            availability
        };
    }

    public async Task<object> SaveLessonPlanAsync(Guid schoolId, Guid tenantId, Guid yearId, DateOnly weekStart,
        Guid classId, Guid sectionId, Guid subjectId, Guid employeeId, IReadOnlyList<(int Day, string Topic)> days,
        string actor, bool isAdmin, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        await EnsureSectionAsync(schoolId, tenantId, classId, sectionId, ct);
        await EnsureTeachingAssignmentAsync(schoolId, tenantId, yearId, classId, sectionId, subjectId, employeeId, ct);
        if (days.Any(d => d.Day is < 1 or > 6 || (d.Topic?.Length ?? 0) > 2000))
            throw new InvalidOperationException("Topics must be 2,000 characters or fewer and use Monday–Saturday day numbers.");
        weekStart = WeekStart(weekStart);
        if (!isAdmin)
        {
            var settings = await SettingsAsync(schoolId, tenantId, ct);
            var timeZoneId = await db.Schools.Where(s => s.Id == schoolId && s.TenantId == tenantId)
                .Select(s => s.TimeZone).FirstAsync(ct);
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
            if (IsLessonPlanDeadlinePassed(weekStart, settings.WeeklyPlanDeadline, localNow))
                throw new InvalidOperationException("The lesson-plan deadline for this week has passed. Contact a school administrator.");
        }
        var plan = await db.WeeklyLessonPlans.AsNoTracking().FirstOrDefaultAsync(p =>
            p.TenantId == tenantId && p.SchoolId == schoolId && p.AcademicYearId == yearId &&
            p.WeekStart == weekStart && p.SectionId == sectionId && p.SubjectId == subjectId && p.EmployeeId == employeeId, ct);
        if (plan is null)
        {
            plan = new WeeklyLessonPlan
            {
                TenantId = tenantId, SchoolId = schoolId, AcademicYearId = yearId, WeekStart = weekStart,
                ClassId = classId, SectionId = sectionId, SubjectId = subjectId, EmployeeId = employeeId, CreatedBy = actor
            };
            db.WeeklyLessonPlans.Add(plan);
            await db.SaveChangesAsync(ct);
        }
        await db.WeeklyLessonPlanDays.Where(d => d.TenantId == tenantId && d.PlanId == plan.Id).ExecuteDeleteAsync(ct);
        foreach (var (day, topic) in days.Where(d => d.Day is >= 1 and <= 6 && !string.IsNullOrWhiteSpace(d.Topic)))
            db.WeeklyLessonPlanDays.Add(new WeeklyLessonPlanDay { TenantId = tenantId, PlanId = plan.Id, DayOfWeek = day, Topic = topic.Trim() });
        await db.SaveChangesAsync(ct);
        return new { plan.Id, plan.WeekStart };
    }

    public async Task<IReadOnlyList<object>> LessonPlansAsync(
        Guid schoolId, Guid tenantId, DateOnly weekStart, Guid? sectionId, CancellationToken ct,
        IReadOnlyCollection<Guid>? visibleSectionIds = null)
    {
        weekStart = WeekStart(weekStart);
        var q = db.WeeklyLessonPlans.Where(p => p.SchoolId == schoolId && p.TenantId == tenantId && p.WeekStart == weekStart)
            .Include(p => p.Days).Include(p => p.Subject).Include(p => p.Class).Include(p => p.Section).Include(p => p.Employee)
            .AsQueryable();
        if (sectionId is { } sid) q = q.Where(p => p.SectionId == sid);
        if (visibleSectionIds is not null) q = q.Where(p => visibleSectionIds.Contains(p.SectionId));
        return await q.Select(p => (object)new
        {
            p.Id, p.WeekStart, className = p.Class!.Name, sectionName = p.Section!.Name, subject = p.Subject!.Name,
            teacher = p.Employee!.FirstName + " " + p.Employee.LastName, p.SectionId, p.SubjectId, p.ClassId, p.EmployeeId,
            days = p.Days.OrderBy(d => d.DayOfWeek).Select(d => new { d.DayOfWeek, d.Topic })
        }).ToListAsync(ct);
    }

    public async Task<object> SaveDiaryAsync(Guid schoolId, Guid tenantId, Guid yearId, DateOnly date, Guid classId, Guid sectionId,
        Guid? subjectId, Guid employeeId, DiaryEntryMode mode, string? notes, string? homework, string? fileName, string? relativePath,
        string actor, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        await EnsureSectionAsync(schoolId, tenantId, classId, sectionId, ct);
        if (subjectId is { } sid)
            await EnsureTeachingAssignmentAsync(schoolId, tenantId, yearId, classId, sectionId, sid, employeeId, ct);
        else if (!await db.TeacherAssignments.AnyAsync(a => a.TenantId == tenantId &&
                     a.AcademicYearId == yearId && a.ClassId == classId && a.SectionId == sectionId &&
                     a.EmployeeId == employeeId && a.IsActive && a.Employee != null &&
                     a.Employee.SchoolId == schoolId && a.Employee.TenantId == tenantId &&
                     a.Employee.Status == EmployeeStatus.Active, ct))
            throw new InvalidOperationException("The teacher is not assigned to this class section for the academic year.");
        if ((notes?.Length ?? 0) > 10000 || (homework?.Length ?? 0) > 10000 ||
            (fileName?.Length ?? 0) > 255)
            throw new InvalidOperationException("Diary notes and homework must be 10,000 characters or fewer; file names must be 255 characters or fewer.");
        var settings = await SettingsAsync(schoolId, tenantId, ct);
        var schoolTimeZone = await db.Schools.Where(s => s.Id == schoolId && s.TenantId == tenantId)
            .Select(s => s.TimeZone).FirstAsync(ct);
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
            TimeZoneInfo.FindSystemTimeZoneById(schoolTimeZone));
        var localDate = DateOnly.FromDateTime(localNow);
        var localTime = TimeOnly.FromDateTime(localNow);
        var late = date < localDate || (date == localDate && localTime > settings.DiaryDeadline);
        var row = await db.ClassDiaries.FirstOrDefaultAsync(d =>
            d.TenantId == tenantId && d.SchoolId == schoolId && d.AcademicYearId == yearId &&
            d.Date == date && d.SectionId == sectionId && d.EmployeeId == employeeId && d.SubjectId == subjectId, ct);
        if (row is null)
        {
            row = new ClassDiary
            {
                TenantId = tenantId, SchoolId = schoolId, AcademicYearId = yearId, Date = date, ClassId = classId,
                SectionId = sectionId, SubjectId = subjectId, EmployeeId = employeeId, CreatedBy = actor
            };
            db.ClassDiaries.Add(row);
        }
        row.Mode = mode;
        row.Notes = notes;
        row.Homework = homework;
        if (fileName is not null) row.FileName = fileName;
        if (relativePath is not null) row.RelativePath = relativePath;
        row.SubmittedAt = DateTime.UtcNow;
        row.IsLate = late;
        await db.SaveChangesAsync(ct);
        return new { row.Id, row.IsLate, deadline = settings.DiaryDeadline.ToString("HH:mm") };
    }

    public async Task<IReadOnlyList<object>> DiariesAsync(
        Guid schoolId, Guid tenantId, DateOnly date, Guid? sectionId, CancellationToken ct,
        IReadOnlyCollection<Guid>? visibleSectionIds = null)
    {
        var q = db.ClassDiaries.Where(d => d.SchoolId == schoolId && d.TenantId == tenantId && d.Date == date)
            .Include(d => d.Class).Include(d => d.Section).Include(d => d.Subject).Include(d => d.Employee)
            .AsQueryable();
        if (sectionId is { } sid) q = q.Where(d => d.SectionId == sid);
        if (visibleSectionIds is not null) q = q.Where(d => visibleSectionIds.Contains(d.SectionId));
        return await q.Select(d => (object)new
        {
            d.Id, d.Date, mode = d.Mode.ToString(), d.Notes, d.Homework, d.FileName,
            url = d.RelativePath == null ? null : $"/api/schools/{schoolId}/diaries/{d.Id}/scan",
            d.IsLate, teacher = d.Employee!.FirstName + " " + d.Employee.LastName,
            className = d.Class!.Name, sectionName = d.Section!.Name, subject = d.Subject == null ? null : d.Subject.Name,
            d.SectionId, d.SubmittedAt
        }).ToListAsync(ct);
    }

    public async Task<object> ComplianceAsync(Guid schoolId, Guid tenantId, Guid yearId, DateOnly date, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        var expected = await ExpectedDiaryEntriesAsync(schoolId, tenantId, yearId, date, ct);
        var submitted = await db.ClassDiaries.Where(d => d.TenantId == tenantId && d.SchoolId == schoolId &&
                d.AcademicYearId == yearId && d.Date == date)
            .Select(d => new { d.SectionId, d.EmployeeId }).ToListAsync(ct);
        var done = submitted.Select(s => (s.SectionId, s.EmployeeId)).ToHashSet();
        var rows = expected.Select(e => new
        {
            e.SectionId, e.EmployeeId, e.ClassName, e.SectionName, e.Teacher,
            status = done.Contains((e.SectionId, e.EmployeeId)) ? "Submitted" : "Pending"
        }).ToList();
        return new
        {
            date,
            deadline = (await SettingsAsync(schoolId, tenantId, ct)).DiaryDeadline.ToString("HH:mm"),
            submitted = rows.Count(r => r.status == "Submitted"),
            pending = rows.Count(r => r.status == "Pending"),
            rows
        };
    }

    public async Task<int> RemindPendingAsync(Guid schoolId, Guid tenantId, Guid yearId, DateOnly date, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        var settings = await SettingsAsync(schoolId, tenantId, ct);
        var timeZoneId = await db.Schools.Where(s => s.Id == schoolId && s.TenantId == tenantId)
            .Select(s => s.TimeZone).FirstAsync(ct);
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById(timeZoneId));
        var localDate = DateOnly.FromDateTime(localNow);
        if (date > localDate || (date == localDate && TimeOnly.FromDateTime(localNow) < settings.DiaryDeadline))
            throw new InvalidOperationException("Reminders are available after the configured diary deadline.");
        var expected = await ExpectedDiaryEntriesAsync(schoolId, tenantId, yearId, date, ct);
        var submitted = await db.ClassDiaries.Where(d => d.TenantId == tenantId && d.SchoolId == schoolId &&
                d.AcademicYearId == yearId && d.Date == date)
            .Select(d => new { d.SectionId, d.EmployeeId }).ToListAsync(ct);
        var done = submitted.Select(s => (s.SectionId, s.EmployeeId)).ToHashSet();
        var pendingIds = expected.Where(e => !done.Contains((e.SectionId, e.EmployeeId)))
            .Select(e => e.EmployeeId).Distinct().ToList();
        var employees = await db.Employees.Where(e => e.TenantId == tenantId &&
                e.SchoolId == schoolId && pendingIds.Contains(e.Id)).ToListAsync(ct);
        if (employees.Count == 0) return 0;
        await notifications.DispatchAsync(new NotificationDispatchRequest(
            tenantId, schoolId,
            "Class diary pending",
            $"Please submit today's class diary and homework before the school deadline.",
            [NotificationChannel.Email, NotificationChannel.InApp],
            employees.Select(e => new NotificationRecipient(e.Id.ToString(), e.Email, e.Phone, $"{e.FirstName} {e.LastName}")).ToList(),
            "diary.reminder"), ct);
        return employees.Count;
    }

    private async Task<List<ExpectedDiaryEntry>> ExpectedDiaryEntriesAsync(
        Guid schoolId, Guid tenantId, Guid yearId, DateOnly date, CancellationToken ct)
    {
        var slots = await db.TimetableSlots.Where(s => s.TenantId == tenantId && s.SchoolId == schoolId &&
                s.AcademicYearId == yearId && s.DayOfWeek == IsoDay(date))
            .Select(s => new
            {
                s.Id, s.SectionId, s.EmployeeId, className = s.Class!.Name,
                sectionName = s.Section!.Name, teacher = s.Employee!.FirstName + " " + s.Employee.LastName
            })
            .ToListAsync(ct);
        var needs = await db.SubstitutionNeeds.Where(n => n.TenantId == tenantId &&
                n.SchoolId == schoolId && n.Date == date && n.Status != SubstitutionStatus.Cancelled)
            .Select(n => new
            {
                n.TimetableSlotId, n.Status, n.SubstituteEmployeeId,
                substituteName = n.SubstituteEmployee == null ? null :
                    n.SubstituteEmployee.FirstName + " " + n.SubstituteEmployee.LastName
            })
            .ToListAsync(ct);
        var bySlot = needs.ToDictionary(n => n.TimetableSlotId);
        return slots.Where(s => !bySlot.TryGetValue(s.Id, out var need) || need.Status != SubstitutionStatus.Open)
            .Select(s => bySlot.TryGetValue(s.Id, out var need) && need.SubstituteEmployeeId is { } substituteId
                ? new ExpectedDiaryEntry(s.SectionId, substituteId, s.className, s.sectionName, need.substituteName!)
                : new ExpectedDiaryEntry(s.SectionId, s.EmployeeId, s.className, s.sectionName, s.teacher))
            .DistinctBy(e => (e.SectionId, e.EmployeeId))
            .ToList();
    }

    public async Task<Employee?> EmployeeForUserAsync(Guid schoolId, Guid tenantId, Guid userId, CancellationToken ct) =>
        await db.Employees.FirstOrDefaultAsync(e => e.SchoolId == schoolId && e.TenantId == tenantId && e.UserId == userId, ct);

    public async Task EnsureDefaultPeriodsAsync(Guid schoolId, Guid tenantId, Guid yearId, CancellationToken ct)
    {
        await EnsureSchoolYearAsync(schoolId, tenantId, yearId, ct);
        if (await db.TimetablePeriods.AnyAsync(p => p.TenantId == tenantId &&
                p.SchoolId == schoolId && p.AcademicYearId == yearId, ct)) return;
        var defs = new (string Name, int Order, string Start, string End, PeriodBand Band)[]
        {
            ("M1", 1, "08:00", "08:45", PeriodBand.Morning),
            ("M2", 2, "08:45", "09:30", PeriodBand.Morning),
            ("M3", 3, "09:30", "10:15", PeriodBand.Morning),
            ("E1", 4, "10:45", "11:30", PeriodBand.Evening),
            ("E2", 5, "11:30", "12:15", PeriodBand.Evening),
            ("E3", 6, "12:15", "13:00", PeriodBand.Evening),
            ("E4", 7, "13:45", "14:30", PeriodBand.Evening),
        };
        foreach (var d in defs)
            db.TimetablePeriods.Add(new TimetablePeriod
            {
                TenantId = tenantId, SchoolId = schoolId, AcademicYearId = yearId, Name = d.Name, SortOrder = d.Order,
                StartTime = TimeOnly.Parse(d.Start), EndTime = TimeOnly.Parse(d.End), Band = d.Band, CreatedBy = "seed"
            });
        await db.SaveChangesAsync(ct);
    }
}
