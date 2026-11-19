using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using SchoolERP.API.Authorization;
using SchoolERP.API.Controllers;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using Xunit;

namespace SchoolERP.Tests.Unit;

public class AcademicAccessSecurityTests
{
    private readonly Mock<IAuditService> _audit = new();
    private readonly Mock<INotificationService> _notifications = new();

    public AcademicAccessSecurityTests()
    {
        _audit.Setup(a => a.LogAsync(
                It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<object?>(), It.IsAny<object?>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);
        _notifications.Setup(n => n.DispatchAsync(It.IsAny<NotificationDispatchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
    }

    [Fact]
    public async Task Teacher_CannotCreateHomework_ForAnotherTeachersAssignment()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var controller = Homework(db, g.TenantId, g.OtherTeacherUserId, "Teacher");

        var result = await controller.Create(g.SchoolId, HomeworkRequest(g.AssignmentId), CancellationToken.None);

        result.Should().BeOfType<ForbidResult>();
        (await db.Homeworks.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Teacher_CanCreateHomework_ForOwnAssignment()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var controller = Homework(db, g.TenantId, g.TeacherUserId, "Teacher");

        var result = await controller.Create(g.SchoolId, HomeworkRequest(g.AssignmentId), CancellationToken.None);

        result.Should().BeOfType<CreatedAtActionResult>();
        (await db.Homeworks.CountAsync(h => h.SchoolId == g.SchoolId && h.TenantId == g.TenantId)).Should().Be(1);
    }

    [Fact]
    public async Task Teacher_CannotCreateHomework_WhenAssignmentIsOutsideSchool()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var controller = Homework(db, g.TenantId, g.TeacherUserId, "Teacher");

        var result = await controller.Create(g.SchoolId, HomeworkRequest(g.OtherSchoolAssignmentId), CancellationToken.None);

        result.Should().BeOfType<ForbidResult>();
        (await db.Homeworks.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SchoolAdmin_CanCreateHomework_ForTeacherAssignmentInSchool()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var controller = Homework(db, g.TenantId, g.AdminUserId, "SchoolAdmin");

        var result = await controller.Create(g.SchoolId, HomeworkRequest(g.AssignmentId), CancellationToken.None);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task Student_SeesOnlyHomework_ForEnrolledSection()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        db.Homeworks.AddRange(
            PublishedHomework(g, g.AssignmentId, "Own section"),
            PublishedHomework(g, g.OtherSectionAssignmentId, "Other section"));
        await db.SaveChangesAsync();
        var controller = Homework(db, g.TenantId, g.StudentUserId, "Student");

        var result = await controller.GetAll(g.SchoolId, null, CancellationToken.None);

        var json = JsonSerializer.Serialize(((OkObjectResult)result).Value);
        json.Should().Contain("Own section");
        json.Should().NotContain("Other section");
    }

    [Fact]
    public async Task Student_CannotSubmitHomework_ForAnotherSection()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var homework = PublishedHomework(g, g.OtherSectionAssignmentId, "Other section");
        db.Homeworks.Add(homework);
        await db.SaveChangesAsync();
        var controller = Homework(db, g.TenantId, g.StudentUserId, "Student");

        var result = await controller.Submit(g.SchoolId, homework.Id, CancellationToken.None);

        result.Should().BeOfType<ForbidResult>();
        (await db.HomeworkSubmissions.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task StudentAndParent_CannotReadUnpublishedExaminations()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        db.Examinations.AddRange(
            new Examination { TenantId = g.TenantId, SchoolId = g.SchoolId, AcademicYearId = g.YearId, Name = "Draft paper", IsPublished = false },
            new Examination { TenantId = g.TenantId, SchoolId = g.SchoolId, AcademicYearId = g.YearId, Name = "Published paper", IsPublished = true });
        await db.SaveChangesAsync();
        var draft = await db.Examinations.SingleAsync(e => e.Name == "Draft paper");

        var studentList = await Exams(db, g.TenantId, g.StudentUserId, "Student").GetAll(g.SchoolId, g.YearId, CancellationToken.None);
        var parentList = await Exams(db, g.TenantId, g.ParentUserId, "Parent").GetAll(g.SchoolId, g.YearId, CancellationToken.None);
        var studentResult = await Exams(db, g.TenantId, g.StudentUserId, "Student")
            .GetStudentResults(g.SchoolId, draft.Id, g.StudentId, CancellationToken.None);
        var parentResult = await Exams(db, g.TenantId, g.ParentUserId, "Parent")
            .GetStudentResults(g.SchoolId, draft.Id, g.StudentId, CancellationToken.None);

        JsonSerializer.Serialize(((OkObjectResult)studentList).Value).Should().NotContain("Draft paper").And.Contain("Published paper");
        JsonSerializer.Serialize(((OkObjectResult)parentList).Value).Should().NotContain("Draft paper");
        studentResult.Should().BeOfType<ForbidResult>();
        parentResult.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Teacher_StillReceivesUnpublishedExaminations()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        db.Examinations.Add(new Examination
        {
            TenantId = g.TenantId, SchoolId = g.SchoolId, AcademicYearId = g.YearId, Name = "Draft paper", IsPublished = false
        });
        await db.SaveChangesAsync();

        var result = await Exams(db, g.TenantId, g.TeacherUserId, "Teacher").GetAll(g.SchoolId, g.YearId, CancellationToken.None);

        JsonSerializer.Serialize(((OkObjectResult)result).Value).Should().Contain("Draft paper");
    }

    [Fact]
    public async Task CreateExam_RejectsAcademicYearFromAnotherSchool()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var controller = Exams(db, g.TenantId, g.AdminUserId, "SchoolAdmin");

        var result = await controller.Create(g.SchoolId, new CreateExamRequest("Term", "1", g.OtherYearId), CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
        (await db.Examinations.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Teacher_CannotEnterMarks_OutsideAssignedSubjectAndSection()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var exam = await AddDraftExam(db, g);
        var controller = Exams(db, g.TenantId, g.TeacherUserId, "Teacher");

        var wrongSubject = await controller.EnterMarks(g.SchoolId, exam.Id, [Mark(g.StudentId, g.OtherSubjectId)], CancellationToken.None);
        var otherStudent = await controller.EnterMarks(g.SchoolId, exam.Id, [Mark(g.OtherStudentId, g.SubjectId)], CancellationToken.None);

        wrongSubject.Should().BeOfType<ForbidResult>();
        otherStudent.Should().BeOfType<ForbidResult>();
        (await db.MarkEntries.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Teacher_CanEnterMarks_ForAssignedSubjectAndSection()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var exam = await AddDraftExam(db, g);
        var controller = Exams(db, g.TenantId, g.TeacherUserId, "Teacher");

        var result = await controller.EnterMarks(g.SchoolId, exam.Id, [Mark(g.StudentId, g.SubjectId)], CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        (await db.MarkEntries.CountAsync(m => m.TenantId == g.TenantId && m.StudentId == g.StudentId)).Should().Be(1);
    }

    [Fact]
    public async Task EnterMarks_RejectsStudentNotEnrolledInExamYear()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var exam = await AddDraftExam(db, g);
        var controller = Exams(db, g.TenantId, g.AdminUserId, "SchoolAdmin");

        var result = await controller.EnterMarks(g.SchoolId, exam.Id, [Mark(g.OutsideStudentId, g.SubjectId)], CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
        (await db.MarkEntries.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Attendance_RejectsStudentOutsideSelectedSection()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var controller = Attendance(db, g.TenantId, g.TeacherUserId, "Teacher");

        var result = await controller.Mark(g.SchoolId, AttendanceRequest(g, g.OtherStudentId), CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
        (await db.AttendanceSessions.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Attendance_RejectsClassSectionYearMismatch_AndDuplicateSubmission()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var foreignSection = new Section { TenantId = g.TenantId, ClassId = g.OtherClassId, Name = "Z" };
        db.Sections.Add(foreignSection);
        await db.SaveChangesAsync();
        var controller = Attendance(db, g.TenantId, g.TeacherUserId, "Teacher");
        var mismatched = AttendanceRequest(g, g.StudentId) with { SectionId = foreignSection.Id };

        var mismatch = await controller.Mark(g.SchoolId, mismatched, CancellationToken.None);
        var wrongYear = await controller.Mark(g.SchoolId, AttendanceRequest(g, g.StudentId) with { AcademicYearId = g.OtherYearId }, CancellationToken.None);
        var first = await controller.Mark(g.SchoolId, AttendanceRequest(g, g.StudentId), CancellationToken.None);
        var second = await controller.Mark(g.SchoolId, AttendanceRequest(g, g.StudentId), CancellationToken.None);

        mismatch.Should().BeOfType<BadRequestObjectResult>();
        wrongYear.Should().BeOfType<BadRequestObjectResult>();
        first.Should().BeOfType<OkObjectResult>();
        second.Should().BeOfType<ConflictObjectResult>();
        (await db.AttendanceSessions.CountAsync(s => s.TenantId == g.TenantId)).Should().Be(1);
    }

    [Fact]
    public async Task Attendance_TeacherCannotMarkUnassignedSection()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var controller = Attendance(db, g.TenantId, g.OtherTeacherUserId, "Teacher");

        var result = await controller.Mark(g.SchoolId, AttendanceRequest(g, g.StudentId), CancellationToken.None);

        result.Should().BeOfType<ForbidResult>();
        (await db.AttendanceSessions.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task AttendanceGet_DoesNotReturnAnotherTenantsSession()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        db.AttendanceSessions.Add(new AttendanceSession
        {
            TenantId = g.OtherTenantId, SchoolId = g.SchoolId, AcademicYearId = g.YearId,
            ClassId = g.ClassId, SectionId = g.SectionId, Date = new DateOnly(2026, 11, 19), MarkedBy = "other"
        });
        await db.SaveChangesAsync();
        var controller = Attendance(db, g.TenantId, g.TeacherUserId, "Teacher");

        var result = await controller.Get(g.SchoolId, g.ClassId, g.SectionId, new DateOnly(2026, 11, 19), CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Parent_CannotReadUnrelatedOrCrossTenantStudent()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var parent = Principal(g.TenantId, g.ParentUserId, "Parent");
        var fees = new FeesController(db, _audit.Object, _notifications.Object);
        Attach(fees, parent);

        var unrelated = await StudentAccess.CanReadStudent(db, parent, g.SchoolId, g.TenantId, g.OtherStudentId, CancellationToken.None);
        var crossTenant = await StudentAccess.CanReadStudent(db, parent, g.SchoolId, g.TenantId, g.CrossTenantStudentId, CancellationToken.None);
        var own = await StudentAccess.CanReadStudent(db, parent, g.SchoolId, g.TenantId, g.StudentId, CancellationToken.None);
        var payments = await fees.GetStudentPayments(g.SchoolId, g.OtherStudentId, CancellationToken.None);

        own.Should().BeTrue();
        unrelated.Should().BeFalse();
        crossTenant.Should().BeFalse();
        payments.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Teacher_CannotReadAnotherSectionsAttendanceFeesOrResults()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var exam = new Examination
        {
            TenantId = g.TenantId, SchoolId = g.SchoolId, AcademicYearId = g.YearId,
            Name = "Published paper", IsPublished = true
        };
        db.Examinations.Add(exam);
        db.MarkEntries.Add(new MarkEntry
        {
            TenantId = g.TenantId, ExaminationId = exam.Id, StudentId = g.OtherStudentId, SubjectId = g.SubjectId,
            MarksObtained = 15, MaxMarks = 20
        });
        db.Payments.Add(new Payment
        {
            TenantId = g.TenantId, SchoolId = g.SchoolId, StudentId = g.OtherStudentId,
            Amount = 100, Status = PaymentStatus.Successful, Method = "Cash"
        });
        db.AttendanceSessions.Add(new AttendanceSession
        {
            TenantId = g.TenantId, SchoolId = g.SchoolId, AcademicYearId = g.YearId,
            ClassId = g.ClassId, SectionId = g.OtherSectionId, Date = new DateOnly(2026, 11, 18), MarkedBy = "teacher",
            Records = [new StudentAttendance { TenantId = g.TenantId, StudentId = g.OtherStudentId, Code = AttendanceCode.Present }]
        });
        await db.SaveChangesAsync();

        var from = new DateOnly(2026, 11, 1);
        var to = new DateOnly(2026, 11, 30);
        var attendance = Attendance(db, g.TenantId, g.TeacherUserId, "Teacher");
        var fees = new FeesController(db, _audit.Object, _notifications.Object);
        Attach(fees, Principal(g.TenantId, g.TeacherUserId, "Teacher"));
        var exams = Exams(db, g.TenantId, g.TeacherUserId, "Teacher");

        var otherAttendance = await attendance.GetStudentAttendance(g.SchoolId, g.OtherStudentId, from, to, CancellationToken.None);
        var otherFees = await fees.GetStudentPayments(g.SchoolId, g.OtherStudentId, CancellationToken.None);
        var otherResults = await exams.GetStudentResults(g.SchoolId, exam.Id, g.OtherStudentId, CancellationToken.None);

        var otherRegister = await attendance.Get(g.SchoolId, g.ClassId, g.OtherSectionId, new DateOnly(2026, 11, 18), CancellationToken.None);

        otherAttendance.Should().BeOfType<ForbidResult>();
        otherFees.Should().BeOfType<ForbidResult>();
        otherResults.Should().BeOfType<ForbidResult>();
        otherRegister.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Teacher_CanReadAssignedSection_AndAdminCanReadAnyStudent()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var exam = new Examination
        {
            TenantId = g.TenantId, SchoolId = g.SchoolId, AcademicYearId = g.YearId,
            Name = "Published paper", IsPublished = true
        };
        db.Examinations.Add(exam);
        db.MarkEntries.Add(new MarkEntry
        {
            TenantId = g.TenantId, ExaminationId = exam.Id, StudentId = g.StudentId, SubjectId = g.SubjectId,
            MarksObtained = 18, MaxMarks = 20
        });
        db.Payments.Add(new Payment
        {
            TenantId = g.TenantId, SchoolId = g.SchoolId, StudentId = g.StudentId,
            Amount = 100, Status = PaymentStatus.Successful, Method = "Cash"
        });
        db.AttendanceSessions.Add(new AttendanceSession
        {
            TenantId = g.TenantId, SchoolId = g.SchoolId, AcademicYearId = g.YearId,
            ClassId = g.ClassId, SectionId = g.SectionId, Date = new DateOnly(2026, 11, 18), MarkedBy = "teacher",
            Records = [new StudentAttendance { TenantId = g.TenantId, StudentId = g.StudentId, Code = AttendanceCode.Present }]
        });
        await db.SaveChangesAsync();

        var from = new DateOnly(2026, 11, 1);
        var to = new DateOnly(2026, 11, 30);
        var teacherAttendance = await Attendance(db, g.TenantId, g.TeacherUserId, "Teacher")
            .GetStudentAttendance(g.SchoolId, g.StudentId, from, to, CancellationToken.None);
        var teacherFeesController = new FeesController(db, _audit.Object, _notifications.Object);
        Attach(teacherFeesController, Principal(g.TenantId, g.TeacherUserId, "Teacher"));
        var teacherFees = await teacherFeesController.GetStudentPayments(g.SchoolId, g.StudentId, CancellationToken.None);
        var teacherResults = await Exams(db, g.TenantId, g.TeacherUserId, "Teacher")
            .GetStudentResults(g.SchoolId, exam.Id, g.StudentId, CancellationToken.None);

        var adminResults = await Exams(db, g.TenantId, g.AdminUserId, "SchoolAdmin")
            .GetStudentResults(g.SchoolId, exam.Id, g.OtherStudentId, CancellationToken.None);

        teacherAttendance.Should().BeOfType<OkObjectResult>();
        teacherFees.Should().BeOfType<OkObjectResult>();
        teacherResults.Should().BeOfType<OkObjectResult>();
        adminResults.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Student_CannotReadAnotherStudentsAttendance()
    {
        await using var db = CreateDb();
        var g = await SeedSchool(db);
        var controller = Attendance(db, g.TenantId, g.StudentUserId, "Student");

        var result = await controller.GetStudentAttendance(
            g.SchoolId, g.OtherStudentId, new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 30), CancellationToken.None);

        result.Should().BeOfType<ForbidResult>();
    }

    private HomeworkController Homework(AppDbContext db, Guid tenantId, Guid userId, string role)
    {
        var controller = new HomeworkController(db, _notifications.Object);
        Attach(controller, Principal(tenantId, userId, role));
        return controller;
    }

    private ExaminationsController Exams(AppDbContext db, Guid tenantId, Guid userId, string role)
    {
        var controller = new ExaminationsController(db, _audit.Object, _notifications.Object);
        Attach(controller, Principal(tenantId, userId, role));
        return controller;
    }

    private AttendanceController Attendance(AppDbContext db, Guid tenantId, Guid userId, string role)
    {
        var controller = new AttendanceController(db, _audit.Object, _notifications.Object);
        Attach(controller, Principal(tenantId, userId, role));
        return controller;
    }

    private static ClaimsPrincipal Principal(Guid tenantId, Guid userId, string role)
    {
        var identity = new ClaimsIdentity(
        [
            new Claim("tid", tenantId.ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.Email, "user@school.edu"),
            new Claim(ClaimTypes.Role, role)
        ], "test");
        return new ClaimsPrincipal(identity);
    }

    private static void Attach(ControllerBase controller, ClaimsPrincipal user) =>
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = user } };

    private static AppDbContext CreateDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static CreateHomeworkRequest HomeworkRequest(Guid assignmentId) =>
        new(assignmentId, "Worksheet", "Complete the questions", new DateOnly(2026, 11, 19), new DateOnly(2026, 11, 21));

    private static MarkEntryRequest Mark(Guid studentId, Guid subjectId) =>
        new(studentId, subjectId, 18, 20, false, null);

    private static MarkAttendanceRequest AttendanceRequest(SchoolGraph g, Guid studentId) =>
        new(g.YearId, g.ClassId, g.SectionId, new DateOnly(2026, 11, 19),
            [new StudentAttendanceEntry(studentId, AttendanceCode.Present, null)]);

    private static Homework PublishedHomework(SchoolGraph g, Guid assignmentId, string title) =>
        new()
        {
            TenantId = g.TenantId, SchoolId = g.SchoolId, TeacherAssignmentId = assignmentId,
            Title = title, IssueDate = new DateOnly(2026, 11, 18), DueDate = new DateOnly(2026, 11, 21), IsPublished = true
        };

    private static async Task<Examination> AddDraftExam(AppDbContext db, SchoolGraph g)
    {
        var exam = new Examination
        {
            TenantId = g.TenantId, SchoolId = g.SchoolId, AcademicYearId = g.YearId, Name = "Draft paper", IsPublished = false
        };
        db.Examinations.Add(exam);
        await db.SaveChangesAsync();
        return exam;
    }

    private static async Task<SchoolGraph> SeedSchool(AppDbContext db)
    {
        var g = new SchoolGraph(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        db.Tenants.AddRange(
            new Tenant { Id = g.TenantId, Name = "Tenant", Slug = "tenant-" + g.TenantId.ToString()[..8] },
            new Tenant { Id = g.OtherTenantId, Name = "Other", Slug = "other-" + g.OtherTenantId.ToString()[..8] });
        db.Schools.AddRange(
            new School { Id = g.SchoolId, TenantId = g.TenantId, Name = "School" },
            new School { Id = g.OtherSchoolId, TenantId = g.TenantId, Name = "Other school" });
        db.AcademicYears.AddRange(
            new AcademicYear { Id = g.YearId, TenantId = g.TenantId, SchoolId = g.SchoolId, Name = "2026-27", StartDate = new DateOnly(2026, 6, 1), EndDate = new DateOnly(2027, 3, 31) },
            new AcademicYear { Id = g.OtherYearId, TenantId = g.TenantId, SchoolId = g.OtherSchoolId, Name = "2026-27", StartDate = new DateOnly(2026, 6, 1), EndDate = new DateOnly(2027, 3, 31) });
        db.Classes.AddRange(
            new Class { Id = g.ClassId, TenantId = g.TenantId, SchoolId = g.SchoolId, Name = "Grade 5" },
            new Class { Id = g.OtherClassId, TenantId = g.TenantId, SchoolId = g.OtherSchoolId, Name = "Grade 1" });
        db.Sections.AddRange(
            new Section { Id = g.SectionId, TenantId = g.TenantId, ClassId = g.ClassId, Name = "A" },
            new Section { Id = g.OtherSectionId, TenantId = g.TenantId, ClassId = g.ClassId, Name = "B" });
        db.Subjects.AddRange(
            new Subject { Id = g.SubjectId, TenantId = g.TenantId, SchoolId = g.SchoolId, Name = "Math", Code = "MATH" },
            new Subject { Id = g.OtherSubjectId, TenantId = g.TenantId, SchoolId = g.SchoolId, Name = "Science", Code = "SCI" });
        db.Employees.AddRange(
            new Employee { Id = g.TeacherId, TenantId = g.TenantId, SchoolId = g.SchoolId, UserId = g.TeacherUserId, EmployeeCode = "T1", FirstName = "Maya", LastName = "Iyer", JoiningDate = new DateOnly(2020, 6, 1) },
            new Employee { Id = g.OtherTeacherId, TenantId = g.TenantId, SchoolId = g.SchoolId, UserId = g.OtherTeacherUserId, EmployeeCode = "T2", FirstName = "Ravi", LastName = "Kumar", JoiningDate = new DateOnly(2020, 6, 1) });
        db.Students.AddRange(
            new Student { Id = g.StudentId, TenantId = g.TenantId, SchoolId = g.SchoolId, UserId = g.StudentUserId, StudentCode = "S1", FirstName = "Ananya", LastName = "Reddy", DateOfBirth = new DateOnly(2014, 1, 1) },
            new Student { Id = g.OtherStudentId, TenantId = g.TenantId, SchoolId = g.SchoolId, StudentCode = "S2", FirstName = "Kabir", LastName = "Shah", DateOfBirth = new DateOnly(2014, 2, 2) },
            new Student { Id = g.OutsideStudentId, TenantId = g.TenantId, SchoolId = g.SchoolId, StudentCode = "S3", FirstName = "Leela", LastName = "Nair", DateOfBirth = new DateOnly(2014, 3, 3) },
            new Student { Id = g.CrossTenantStudentId, TenantId = g.OtherTenantId, SchoolId = g.SchoolId, StudentCode = "S4", FirstName = "Other", LastName = "Tenant", DateOfBirth = new DateOnly(2014, 4, 4) });
        db.StudentEnrollments.AddRange(
            new StudentEnrollment { TenantId = g.TenantId, StudentId = g.StudentId, AcademicYearId = g.YearId, ClassId = g.ClassId, SectionId = g.SectionId, EffectiveFrom = new DateOnly(2026, 6, 1) },
            new StudentEnrollment { TenantId = g.TenantId, StudentId = g.OtherStudentId, AcademicYearId = g.YearId, ClassId = g.ClassId, SectionId = g.OtherSectionId, EffectiveFrom = new DateOnly(2026, 6, 1) });
        db.Guardians.AddRange(
            new Guardian { Id = g.GuardianId, TenantId = g.TenantId, UserId = g.ParentUserId, FirstName = "Parent", LastName = "One", Phone = "9000000001" },
            new Guardian { Id = g.OtherGuardianId, TenantId = g.OtherTenantId, UserId = g.ParentUserId, FirstName = "Parent", LastName = "Other", Phone = "9000000002" });
        db.StudentGuardians.AddRange(
            new StudentGuardian { TenantId = g.TenantId, StudentId = g.StudentId, GuardianId = g.GuardianId, Relationship = "Mother" },
            new StudentGuardian { TenantId = g.OtherTenantId, StudentId = g.CrossTenantStudentId, GuardianId = g.OtherGuardianId, Relationship = "Mother" });
        db.TeacherAssignments.AddRange(
            new TeacherAssignment
            {
                Id = g.AssignmentId, TenantId = g.TenantId, AcademicYearId = g.YearId, EmployeeId = g.TeacherId,
                SubjectId = g.SubjectId, ClassId = g.ClassId, SectionId = g.SectionId, CanSetHomework = true, CanEnterMarks = true, CanTakeAttendance = true, IsActive = true
            },
            new TeacherAssignment
            {
                Id = g.OtherSectionAssignmentId, TenantId = g.TenantId, AcademicYearId = g.YearId, EmployeeId = g.OtherTeacherId,
                SubjectId = g.SubjectId, ClassId = g.ClassId, SectionId = g.OtherSectionId, CanSetHomework = true, CanEnterMarks = true, CanTakeAttendance = true, IsActive = true
            },
            new TeacherAssignment
            {
                Id = g.OtherSchoolAssignmentId, TenantId = g.TenantId, AcademicYearId = g.OtherYearId, EmployeeId = g.TeacherId,
                SubjectId = g.SubjectId, ClassId = g.OtherClassId, SectionId = g.SectionId, CanSetHomework = true, CanEnterMarks = true, CanTakeAttendance = true, IsActive = true
            });
        await db.SaveChangesAsync();
        return g;
    }

    private sealed record SchoolGraph(
        Guid TenantId, Guid OtherTenantId, Guid SchoolId, Guid OtherSchoolId, Guid YearId, Guid OtherYearId,
        Guid ClassId, Guid OtherClassId, Guid SectionId, Guid OtherSectionId, Guid SubjectId, Guid OtherSubjectId,
        Guid TeacherId, Guid OtherTeacherId, Guid TeacherUserId, Guid OtherTeacherUserId, Guid AdminUserId,
        Guid StudentId, Guid OtherStudentId, Guid OutsideStudentId, Guid CrossTenantStudentId,
        Guid StudentUserId, Guid ParentUserId, Guid GuardianId, Guid OtherGuardianId,
        Guid AssignmentId, Guid OtherSectionAssignmentId, Guid OtherSchoolAssignmentId);
}
