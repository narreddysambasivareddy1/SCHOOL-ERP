using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Services;

namespace SchoolERP.Infrastructure.Data;

public static partial class DbSeeder
{
    private static async Task SeedRichDemoAsync(AppDbContext db, Guid tenantId, Guid schoolId)
    {
        var ay = await db.AcademicYears.FirstOrDefaultAsync(a => a.SchoolId == schoolId && a.IsCurrent)
                 ?? await db.AcademicYears.FirstAsync(a => a.SchoolId == schoolId);
        var classes = await db.Classes.Where(c => c.SchoolId == schoolId).OrderBy(c => c.SortOrder).ToListAsync();
        var sections = await db.Sections.Where(s => classes.Select(c => c.Id).Contains(s.ClassId)).ToListAsync();
        var subjects = await db.Subjects.Where(s => s.SchoolId == schoolId).ToListAsync();
        var depts = await db.Departments.Where(d => d.SchoolId == schoolId).ToListAsync();
        var desigs = await db.Designations.Where(d => d.SchoolId == schoolId).ToListAsync();
        if (classes.Count == 0 || sections.Count == 0) return;

        var teaching = depts.FirstOrDefault(d => d.Name == "Teaching");
        var finance = depts.FirstOrDefault(d => d.Name == "Finance");
        var transport = depts.FirstOrDefault(d => d.Name == "Transport");
        var teacherDesig = desigs.FirstOrDefault(d => d.Name == "Teacher");
        var seniorDesig = desigs.FirstOrDefault(d => d.Name == "Senior Teacher");
        var driverDesig = desigs.FirstOrDefault(d => d.Name == "Driver");
        var acctDesig = desigs.FirstOrDefault(d => d.Name == "Accountant");

        var teacherUser = await db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == "teacher@school.edu");

        async Task<Employee> EnsureEmployee(string code, string first, string last, string? email, Guid? deptId, Guid? desigId, decimal basic, Guid? userId)
        {
            var e = await db.Employees.FirstOrDefaultAsync(x => x.SchoolId == schoolId && x.EmployeeCode == code);
            if (e is not null)
            {
                if (e.BasicSalary <= 0) e.BasicSalary = basic;
                if (e.UserId is null && userId is not null) e.UserId = userId;
                return e;
            }
            e = new Employee
            {
                TenantId = tenantId, SchoolId = schoolId, EmployeeCode = code,
                FirstName = first, LastName = last, Email = email,
                DepartmentId = deptId, DesignationId = desigId,
                JoiningDate = new DateOnly(2022, 6, 1), Status = EmployeeStatus.Active,
                BasicSalary = basic, UserId = userId, CreatedBy = "seed"
            };
            db.Employees.Add(e);
            return e;
        }

        var maya = await EnsureEmployee("EMP1001", "Maya", "Iyer", "teacher@school.edu", teaching?.Id, seniorDesig?.Id, 55_000m, teacherUser?.Id);
        var ravi = await EnsureEmployee("EMP1002", "Ravi", "Kumar", "ravi.kumar@school.edu", teaching?.Id, teacherDesig?.Id, 42_000m, null);
        var anita = await EnsureEmployee("EMP1003", "Anita", "Shah", "anita.shah@school.edu", finance?.Id, acctDesig?.Id, 38_000m, null);
        var imran = await EnsureEmployee("EMP1004", "Imran", "Ali", "imran.ali@school.edu", transport?.Id, driverDesig?.Id, 22_000m, null);
        await db.SaveChangesAsync();

        var grade5 = classes.FirstOrDefault(c => c.Name.Contains("5")) ?? classes[0];
        var grade6 = classes.FirstOrDefault(c => c.Name.Contains("6")) ?? classes[Math.Min(1, classes.Count - 1)];
        var g5a = sections.FirstOrDefault(s => s.ClassId == grade5.Id && s.Name == "A") ?? sections.First(s => s.ClassId == grade5.Id);
        var g5b = sections.FirstOrDefault(s => s.ClassId == grade5.Id && s.Name == "B") ?? g5a;
        var g6a = sections.FirstOrDefault(s => s.ClassId == grade6.Id && s.Name == "A") ?? sections.First(s => s.ClassId == grade6.Id);
        var math = subjects.FirstOrDefault(s => s.Code == "MATH") ?? subjects.FirstOrDefault();
        var sci = subjects.FirstOrDefault(s => s.Code == "SCI") ?? subjects.Skip(1).FirstOrDefault() ?? math;

        async Task EnsureAssignment(Employee emp, Subject? subject, Class cls, Section sec)
        {
            if (subject is null) return;
            var exists = await db.TeacherAssignments.AnyAsync(a =>
                a.AcademicYearId == ay.Id && a.EmployeeId == emp.Id && a.SubjectId == subject.Id && a.SectionId == sec.Id);
            if (exists) return;
            db.TeacherAssignments.Add(new TeacherAssignment
            {
                TenantId = tenantId, AcademicYearId = ay.Id, EmployeeId = emp.Id,
                SubjectId = subject.Id, ClassId = cls.Id, SectionId = sec.Id,
                CanTakeAttendance = true, CanSetHomework = true, CanEnterMarks = true, CreatedBy = "seed"
            });
        }
        await EnsureAssignment(maya, math, grade5, g5a);
        await EnsureAssignment(maya, math, grade5, g5b);
        await EnsureAssignment(ravi, sci, grade5, g5a);
        await EnsureAssignment(ravi, sci, grade6, g6a);

        var roster = new (string Code, string First, string Last, Class Cls, Section Sec, string Roll)[]
        {
            ("BF0001", "Aarav", "Mehta", grade5, g5a, "1"),
            ("BF0002", "Diya", "Rao", grade5, g5a, "2"),
            ("BF0003", "Kabir", "Shah", grade5, g5a, "3"),
            ("BF0004", "Ananya", "Reddy", grade5, g5a, "4"),
            ("BF0005", "Ishaan", "Nair", grade5, g5b, "1"),
            ("BF0006", "Meera", "Gupta", grade5, g5b, "2"),
            ("BF0007", "Vivaan", "Patel", grade6, g6a, "1"),
            ("BF0008", "Sara", "Khan", grade6, g6a, "2"),
            ("BF0009", "Arjun", "Iyer", grade6, g6a, "3"),
            ("BF0010", "Zara", "Ali", grade6, g6a, "4"),
        };

        foreach (var r in roster)
        {
            if (await db.Students.AnyAsync(s => s.SchoolId == schoolId && s.StudentCode == r.Code)) continue;
            var st = new Student
            {
                TenantId = tenantId, SchoolId = schoolId, StudentCode = r.Code,
                FirstName = r.First, LastName = r.Last, DateOfBirth = new DateOnly(2014, 1, 15),
                Status = StudentStatus.Active, CreatedBy = "seed"
            };
            db.Students.Add(st);
            db.StudentEnrollments.Add(new StudentEnrollment
            {
                TenantId = tenantId, StudentId = st.Id, AcademicYearId = ay.Id,
                ClassId = r.Cls.Id, SectionId = r.Sec.Id, RollNumber = r.Roll,
                EffectiveFrom = new DateOnly(2026, 6, 1)
            });
        }
        await db.SaveChangesAsync();

        var students = await db.Students.Where(s => s.SchoolId == schoolId).ToListAsync();
        var bf1 = students.FirstOrDefault(s => s.StudentCode == "BF0001");
        if (bf1 is not null && !await db.Payments.AnyAsync(p => p.StudentId == bf1.Id && p.Status == PaymentStatus.Successful))
        {
            db.Payments.AddRange(
                new Payment { TenantId = tenantId, SchoolId = schoolId, StudentId = bf1.Id, Amount = 45_000m, Status = PaymentStatus.Successful, Method = "UPI", ReceiptNumber = "RCT-2026-0001", PaidAt = DateTime.UtcNow.AddDays(-3), CreatedBy = "seed" },
                new Payment { TenantId = tenantId, SchoolId = schoolId, StudentId = bf1.Id, Amount = 8_000m, Status = PaymentStatus.Successful, Method = "Cash", ReceiptNumber = "RCT-2026-0002", PaidAt = DateTime.UtcNow, CreatedBy = "seed" });
        }
        foreach (var st in students.Where(s => s.StudentCode != "BF0001").Take(6))
        {
            if (await db.Payments.AnyAsync(p => p.StudentId == st.Id)) continue;
            db.Payments.Add(new Payment
            {
                TenantId = tenantId, SchoolId = schoolId, StudentId = st.Id, Amount = 22_500m,
                Status = PaymentStatus.Successful, Method = "Online (sandbox)", ReceiptNumber = $"RCT-2026-{st.StudentCode[2..]}",
                PaidAt = DateTime.UtcNow.AddDays(-1), CreatedBy = "seed"
            });
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var enroll5a = await db.StudentEnrollments.Where(e => e.SectionId == g5a.Id && e.AcademicYearId == ay.Id && e.EffectiveTo == null).ToListAsync();
        for (var i = 0; i < 7; i++)
        {
            var day = today.AddDays(-i);
            if (day.DayOfWeek is DayOfWeek.Sunday) continue;
            if (await db.AttendanceSessions.AnyAsync(s => s.SchoolId == schoolId && s.SectionId == g5a.Id && s.Date == day)) continue;
            var session = new AttendanceSession
            {
                TenantId = tenantId, SchoolId = schoolId, AcademicYearId = ay.Id,
                ClassId = grade5.Id, SectionId = g5a.Id, Date = day, MarkedBy = "seed",
                Records = enroll5a.Select((en, idx) => new StudentAttendance
                {
                    TenantId = tenantId, StudentId = en.StudentId,
                    Code = idx == 2 && i == 0 ? AttendanceCode.Absent : AttendanceCode.Present,
                    CreatedBy = "seed"
                }).ToList()
            };
            db.AttendanceSessions.Add(session);
        }

        var assignment = await db.TeacherAssignments.FirstOrDefaultAsync(a => a.EmployeeId == maya.Id && a.SectionId == g5a.Id);
        if (assignment is not null && !await db.Homeworks.AnyAsync(h => h.SchoolId == schoolId))
        {
            db.Homeworks.Add(new Homework
            {
                TenantId = tenantId, SchoolId = schoolId, TeacherAssignmentId = assignment.Id,
                Title = "Fractions worksheet", Instructions = "Complete exercise 4.2",
                IssueDate = today.AddDays(-2), DueDate = today.AddDays(3), IsPublished = true, CreatedBy = "seed"
            });
        }

        if (!await db.Examinations.AnyAsync(e => e.SchoolId == schoolId && e.AcademicYearId == ay.Id))
        {
            var exam = new Examination
            {
                TenantId = tenantId, SchoolId = schoolId, AcademicYearId = ay.Id,
                Name = "Term 1 Assessment", Term = "Term 1", IsPublished = true, CreatedBy = "seed"
            };
            db.Examinations.Add(exam);
            if (math is not null)
            {
                foreach (var st in students.Where(s => s.StudentCode.StartsWith("BF000")).Take(6))
                {
                    db.MarkEntries.Add(new MarkEntry
                    {
                        TenantId = tenantId, ExaminationId = exam.Id, StudentId = st.Id, SubjectId = math.Id,
                        MarksObtained = 72 + Math.Abs(st.StudentCode.GetHashCode() % 20), MaxMarks = 100, IsApproved = true, CreatedBy = "seed"
                    });
                }
            }
        }

        if (!await db.PayrollRuns.AnyAsync(p => p.SchoolId == schoolId))
        {
            var staff = await db.Employees.Where(e => e.SchoolId == schoolId && e.Status == EmployeeStatus.Active).ToListAsync();
            var run = new PayrollRun
            {
                TenantId = tenantId, SchoolId = schoolId,
                PeriodYear = 2026, PeriodMonth = 9, PeriodLabel = "September 2026",
                Status = "Finalized", FinalizedAt = DateTime.UtcNow.AddDays(-12), CreatedBy = "seed"
            };
            foreach (var emp in staff)
            {
                var calc = PayrollCalculator.Compute(emp.BasicSalary);
                run.Payslips.Add(new Payslip
                {
                    TenantId = tenantId, EmployeeId = emp.Id,
                    Basic = calc.Basic, Hra = calc.Hra, Allowance = calc.Allowance, Gross = calc.Gross,
                    Pf = calc.Pf, Esi = calc.Esi, ProfessionalTax = calc.ProfessionalTax, Tds = calc.Tds, Net = calc.Net
                });
            }
            run.EmployeeCount = run.Payslips.Count;
            run.GrossTotal = run.Payslips.Sum(p => p.Gross);
            run.PfTotal = run.Payslips.Sum(p => p.Pf);
            run.EsiTotal = run.Payslips.Sum(p => p.Esi);
            run.TdsTotal = run.Payslips.Sum(p => p.Tds);
            run.NetTotal = run.Payslips.Sum(p => p.Net);
            db.PayrollRuns.Add(run);
        }

        if (!await db.SchoolAnnouncements.AnyAsync(a => a.SchoolId == schoolId))
        {
            db.SchoolAnnouncements.Add(new SchoolAnnouncement
            {
                TenantId = tenantId, SchoolId = schoolId,
                Title = "Welcome to 2026-27", Body = "Term 1 begins 1 June. Use the parent portal for attendance, fees and homework.",
                Audience = "All parents", Channels = "InApp,Email", PublishedBy = "seed", PublishedAt = DateTime.UtcNow.AddDays(-10)
            });
        }

        await db.SaveChangesAsync();
    }
}
