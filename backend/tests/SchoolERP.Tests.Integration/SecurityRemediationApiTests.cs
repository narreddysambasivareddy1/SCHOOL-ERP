using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;
using Xunit;

namespace SchoolERP.Tests.Integration;

public class SecurityRemediationApiTests(SecurityApiFactory factory) : IClassFixture<SecurityApiFactory>
{
    private static readonly byte[] Png =
    [
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0
    ];

    [Fact]
    public async Task LoginToken_UsesRoleClaim_AndRoleGatesPermitAdminWhileDenyingStudentAndTeacher()
    {
        var admin = await Login("admin@school.edu");
        var student = await Login("student@school.edu");
        var teacher = await Login("teacher@school.edu");

        Roles(admin.Token).Should().Contain("SchoolAdmin");
        Roles(student.Token).Should().Contain("Student");

        var adminAudit = await Send(admin.Token, HttpMethod.Get, "/api/audit");
        var studentAudit = await Send(student.Token, HttpMethod.Get, "/api/audit");
        var teacherPayroll = await Send(teacher.Token, HttpMethod.Get, $"/api/schools/{admin.SchoolId}/payroll/runs");
        var adminPayroll = await Send(admin.Token, HttpMethod.Get, $"/api/schools/{admin.SchoolId}/payroll/runs");
        var adminDashboard = await Send(admin.Token, HttpMethod.Get, $"/api/schools/{admin.SchoolId}/dashboard?academicYearId={admin.YearId}");
        var studentDashboard = await Send(student.Token, HttpMethod.Get, $"/api/schools/{admin.SchoolId}/dashboard?academicYearId={admin.YearId}");

        adminAudit.StatusCode.Should().Be(HttpStatusCode.OK);
        studentAudit.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        teacherPayroll.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        adminPayroll.StatusCode.Should().Be(HttpStatusCode.OK);
        adminDashboard.StatusCode.Should().Be(HttpStatusCode.OK);
        studentDashboard.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task FamilyCanReadOwnFees_TeacherCannot()
    {
        var parent = await Login("parent@school.edu");
        var teacher = await Login("teacher@school.edu");
        Guid studentId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            studentId = await db.Students.Where(s => s.SchoolId == parent.SchoolId && s.StudentCode == "BF0001")
                .Select(s => s.Id).FirstAsync();
        }

        var family = await Send(parent.Token, HttpMethod.Get, $"/api/schools/{parent.SchoolId}/fees/student/{studentId}");
        var staff = await Send(teacher.Token, HttpMethod.Get, $"/api/schools/{parent.SchoolId}/fees/student/{studentId}");

        family.StatusCode.Should().Be(HttpStatusCode.OK);
        staff.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task PublicEnquiryResponse_DoesNotContainTheOutboxCode()
    {
        var client = factory.CreateClient();
        // Use a unique IP per test run so the rate limiter (3 req/IP/15 min) is not
        // triggered by accumulated challenges from previous test runs on the shared DB.
        var testIp = $"10.{Random.Shared.Next(1, 254)}.{Random.Shared.Next(1, 254)}.{Random.Shared.Next(1, 254)}";
        client.DefaultRequestHeaders.Add("X-Forwarded-For", testIp);
        var phone = "9" + Random.Shared.Next(100000000, 999999999);
        var response = await client.PostAsJsonAsync("/api/public/bright-future/enquiries/otp", new
        {
            kind = "Admission",
            parentName = "Stage One Parent",
            phone,
            email = "stage1.parent@school.edu",
            studentName = "Stage One",
            gradeInterested = "Grade 5",
            message = "Asking about admission."
        });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotContain("sandboxOtp");

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // RecipientRef is stored as "{ref}|{address}" — phone appears in both parts
        var stored = await db.NotificationMessages
            .Where(n => n.TemplateKey == "enquiry.otp" && n.RecipientRef.Contains(phone))
            .Select(n => n.Body)
            .FirstOrDefaultAsync();
        stored.Should().NotBeNull("an OTP notification message must be stored in the outbox");
        var match = System.Text.RegularExpressions.Regex.Match(stored!, @"\b\d{6}\b");
        match.Success.Should().BeTrue("the stored notification body must contain a 6-digit OTP code");
        var code = match.Value;
        // The HTTP response must NOT reveal the OTP code
        body.Should().NotContain(code);
        // The stored outbox body MUST contain the OTP code
        stored.Should().Contain(code);
    }

    [Fact]
    public async Task AdmissionDocument_IsNotPublic_AndIsLimitedToTheOwningSchool()
    {
        var admin = await Login("admin@school.edu");
        var student = await Login("student@school.edu");
        var documentId = Guid.NewGuid();
        string relative;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var env = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
            var yearId = await db.AcademicYears.Where(y => y.SchoolId == admin.SchoolId).Select(y => y.Id).FirstAsync();
            var cls = await db.Classes.Where(c => c.SchoolId == admin.SchoolId).Select(c => new { c.Id }).FirstAsync();
            var sectionId = await db.Sections.Where(s => s.ClassId == cls.Id).Select(s => s.Id).FirstAsync();
            var registration = new StudentRegistration
            {
                TenantId = admin.TenantId, SchoolId = admin.SchoolId, AcademicYearId = yearId,
                RegistrationNumber = "REG-" + Guid.NewGuid().ToString("N")[..12], FirstName = "Doc", LastName = "Child",
                DateOfBirth = new DateOnly(2015, 1, 1), PreferredClassId = cls.Id, PreferredSectionId = sectionId,
                GuardianName = "Guardian", GuardianPhone = "9000000000"
            };
            relative = Path.Combine(admin.TenantId.ToString(), admin.SchoolId.ToString(), registration.Id.ToString(), "identity.png");
            var full = Path.Combine(env.ContentRootPath, "private-uploads", relative);
            Directory.CreateDirectory(Path.GetDirectoryName(full)!);
            await File.WriteAllBytesAsync(full, Png);
            db.StudentRegistrations.Add(registration);
            db.StudentDocuments.Add(new StudentDocument
            {
                Id = documentId, TenantId = admin.TenantId, SchoolId = admin.SchoolId,
                RegistrationId = registration.Id, Kind = StudentDocumentKind.Identity,
                FileName = "identity.png", ContentType = "image/png", RelativePath = relative
            });
            await db.SaveChangesAsync();

            var legacy = Path.Combine(env.ContentRootPath, "uploads", relative);
            Directory.CreateDirectory(Path.GetDirectoryName(legacy)!);
            await File.WriteAllBytesAsync(legacy, Png);
        }

        var anonymous = factory.CreateClient();
        var publicFile = await anonymous.GetAsync("/uploads/" + relative.Replace('\\', '/'));
        var noToken = await anonymous.GetAsync($"/api/schools/{admin.SchoolId}/registrations/documents/{documentId}/file");
        var pupil = await Send(student.Token, HttpMethod.Get, $"/api/schools/{admin.SchoolId}/registrations/documents/{documentId}/file");
        var owner = await Send(admin.Token, HttpMethod.Get, $"/api/schools/{admin.SchoolId}/registrations/documents/{documentId}/file");

        var other = await OtherTenantAdmin();
        var crossTenant = await Send(other.Token, HttpMethod.Get, $"/api/schools/{admin.SchoolId}/registrations/documents/{documentId}/file");

        publicFile.StatusCode.Should().Be(HttpStatusCode.NotFound);
        noToken.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        pupil.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        owner.StatusCode.Should().Be(HttpStatusCode.OK);
        (await owner.Content.ReadAsByteArrayAsync()).Should().StartWith(Png.Take(8));
        crossTenant.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AdmissionUpload_RejectsAFileWhoseBytesDoNotMatchTheExtension()
    {
        var admin = await Login("admin@school.edu");
        Guid registrationId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var yearId = await db.AcademicYears.Where(y => y.SchoolId == admin.SchoolId).Select(y => y.Id).FirstAsync();
            var cls = await db.Classes.Where(c => c.SchoolId == admin.SchoolId).Select(c => new { c.Id }).FirstAsync();
            var sectionId = await db.Sections.Where(s => s.ClassId == cls.Id).Select(s => s.Id).FirstAsync();
            var registration = new StudentRegistration
            {
                TenantId = admin.TenantId, SchoolId = admin.SchoolId, AcademicYearId = yearId,
                RegistrationNumber = "REG-" + Guid.NewGuid().ToString("N")[..12], FirstName = "Bad", LastName = "File",
                DateOfBirth = new DateOnly(2015, 1, 1), PreferredClassId = cls.Id, PreferredSectionId = sectionId,
                GuardianName = "Guardian", GuardianPhone = "9000000000"
            };
            db.StudentRegistrations.Add(registration);
            await db.SaveChangesAsync();
            registrationId = registration.Id;
        }

        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent("not-an-image"u8.ToArray()), "file", "photo.png");
        form.Add(new StringContent("Photo"), "kind");
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin.Token);
        var response = await client.PostAsync($"/api/schools/{admin.SchoolId}/registrations/{registrationId}/documents", form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateStudent_RejectsAnotherSchoolsClass()
    {
        var admin = await Login("admin@school.edu");
        Guid otherClass;
        Guid otherSection;
        Guid otherYear;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var otherSchool = new School { TenantId = admin.TenantId, Name = "Other campus" };
            var year = new AcademicYear
            {
                TenantId = admin.TenantId, SchoolId = otherSchool.Id, Name = "2026-27",
                StartDate = new DateOnly(2026, 6, 1), EndDate = new DateOnly(2027, 3, 31)
            };
            var cls = new Class { TenantId = admin.TenantId, SchoolId = otherSchool.Id, Name = "Grade 1" };
            var section = new Section { TenantId = admin.TenantId, ClassId = cls.Id, Name = "A" };
            db.Schools.Add(otherSchool);
            db.AcademicYears.Add(year);
            db.Classes.Add(cls);
            db.Sections.Add(section);
            await db.SaveChangesAsync();
            otherClass = cls.Id;
            otherSection = section.Id;
            otherYear = year.Id;
        }

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin.Token);
        var response = await client.PostAsJsonAsync($"/api/schools/{admin.SchoolId}/students", new
        {
            firstName = "Cross", lastName = "School", dateOfBirth = "2014-01-01",
            academicYearId = otherYear, classId = otherClass, sectionId = otherSection, rollNumber = "9"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task<SignedIn> OtherTenantAdmin()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        const string email = "other-admin@school.edu";
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existing is null)
        {
            var tenant = new Tenant { Name = "Other tenant", Slug = "other-tenant" };
            var school = new School { TenantId = tenant.Id, Name = "Other school" };
            var roleId = await db.Roles.Where(r => r.Name == "SchoolAdmin").Select(r => r.Id).FirstAsync();
            var user = new User
            {
                TenantId = tenant.Id, Email = email, FirstName = "Other", LastName = "Admin", IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234")
            };
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleId, SchoolId = school.Id, GrantedBy = "test" });
            db.Tenants.Add(tenant);
            db.Schools.Add(school);
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }
        return await Login(email, "other-tenant");
    }

    private async Task<SignedIn> Login(string email, string schoolCode = "bright-future")
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "Admin@1234", schoolCode });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        return new SignedIn(
            root.GetProperty("accessToken").GetString()!,
            json,
            root.GetProperty("school").GetProperty("tenantId").GetGuid(),
            root.GetProperty("school").GetProperty("schoolId").GetGuid(),
            root.GetProperty("school").GetProperty("academicYearId").ValueKind == JsonValueKind.Null
                ? Guid.Empty
                : root.GetProperty("school").GetProperty("academicYearId").GetGuid());
    }

    private async Task<HttpResponseMessage> Send(string token, HttpMethod method, string url)
    {
        var client = factory.CreateClient();
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.SendAsync(request);
    }

    private static IEnumerable<string> Roles(string jwt)
    {
        var payload = jwt.Split('.')[1].Replace('-', '+').Replace('_', '/');
        payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
        using var doc = JsonDocument.Parse(System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(payload)));
        var role = doc.RootElement.GetProperty("role");
        if (role.ValueKind == JsonValueKind.Array)
            return role.EnumerateArray().Select(item => item.GetString()!).ToArray();
        return [role.GetString()!];
    }

    private sealed record SignedIn(string Token, string Payload, Guid TenantId, Guid SchoolId, Guid YearId);
}

public sealed class SecurityApiFactory : WebApplicationFactory<Program>
{
    private const string Database = "schoolerp_security_tests";
    private const string ConnectionString =
        "Host=localhost;Port=8432;Database=schoolerp_security_tests;Username=schoolerp;Password=change_me_strong_password";

    static SecurityApiFactory()
    {
        using var conn = new NpgsqlConnection("Host=localhost;Port=8432;Database=postgres;Username=schoolerp;Password=change_me_strong_password");
        conn.Open();
        using var exists = new NpgsqlCommand("SELECT 1 FROM pg_database WHERE datname = @name", conn);
        exists.Parameters.AddWithValue("name", Database);
        if (exists.ExecuteScalar() is not null) return;
        using var create = new NpgsqlCommand($"CREATE DATABASE {Database}", conn);
        create.ExecuteNonQuery();
    }

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Default", ConnectionString);
        builder.UseSetting("Jwt:Secret", "test-only-secret-min-32-chars-long!!");
        builder.UseSetting("Jwt:Issuer", "schoolerp");
        builder.UseSetting("Jwt:Audience", "schoolerp-clients");
        builder.UseSetting("Integrations:Mode", "Sandbox");
    }
}
