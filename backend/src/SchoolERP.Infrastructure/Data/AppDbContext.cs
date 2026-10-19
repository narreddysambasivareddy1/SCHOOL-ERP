using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;

namespace SchoolERP.Infrastructure.Data;

public partial class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<School> Schools => Set<School>();
    public DbSet<Campus> Campuses => Set<Campus>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>();
    public DbSet<Guardian> Guardians => Set<Guardian>();
    public DbSet<StudentGuardian> StudentGuardians => Set<StudentGuardian>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TeacherAssignment> TeacherAssignments => Set<TeacherAssignment>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(BuildSoftDeleteFilter(entityType.ClrType));
            }
        }

        modelBuilder.Entity<Tenant>(e => e.HasIndex(x => x.Slug).IsUnique());
        modelBuilder.Entity<User>(e => e.HasIndex(x => new { x.TenantId, x.Email }).IsUnique());
        modelBuilder.Entity<Student>(e => e.HasIndex(x => new { x.SchoolId, x.StudentCode }).IsUnique());
        modelBuilder.Entity<Employee>(e => e.HasIndex(x => new { x.SchoolId, x.EmployeeCode }).IsUnique());
        modelBuilder.Entity<TeacherAssignment>(e =>
            e.HasIndex(x => new { x.AcademicYearId, x.EmployeeId, x.SubjectId, x.SectionId, x.PeriodSlot, x.ElectiveGroup }).IsUnique());
        modelBuilder.Entity<AuditEvent>(e =>
        {
            e.HasIndex(x => new { x.TenantId, x.OccurredAt });
            e.HasIndex(x => new { x.EntityType, x.EntityId });
        });
        modelBuilder.Entity<Payment>(e =>
            e.HasIndex(x => x.GatewayOrderId));
        modelBuilder.Entity<AttendanceSession>(e =>
            e.HasIndex(x => new { x.SchoolId, x.ClassId, x.SectionId, x.Date }));
        modelBuilder.Entity<IntegrationSetting>(e =>
            e.HasIndex(x => new { x.SchoolId, x.ProviderKey }).IsUnique());
        modelBuilder.Entity<PayrollRun>(e =>
            e.HasIndex(x => new { x.SchoolId, x.PeriodYear, x.PeriodMonth }).IsUnique());
        modelBuilder.Entity<Enquiry>(e =>
            e.HasIndex(x => new { x.SchoolId, x.Status, x.CreatedAt }));
        modelBuilder.Entity<EnquiryOtpChallenge>(e =>
            e.HasIndex(x => new { x.Phone, x.CreatedAt }));
        modelBuilder.Entity<StudentRegistration>(e =>
            e.HasIndex(x => new { x.SchoolId, x.RegistrationNumber }).IsUnique());
        modelBuilder.Entity<StudentDocument>(e =>
            e.HasIndex(x => new { x.SchoolId, x.StudentId, x.Kind }));
        modelBuilder.Entity<SchoolAcademicSetting>(e =>
            e.HasIndex(x => x.SchoolId).IsUnique());
        modelBuilder.Entity<TimetablePeriod>(e =>
            e.HasIndex(x => new { x.SchoolId, x.AcademicYearId, x.SortOrder }).IsUnique());
        modelBuilder.Entity<TimetableSlot>(e =>
            e.HasIndex(x => new { x.AcademicYearId, x.SectionId, x.DayOfWeek, x.PeriodId }).IsUnique());
        modelBuilder.Entity<SubstitutionNeed>(e =>
            e.HasIndex(x => new { x.SchoolId, x.Date, x.Status }));
        modelBuilder.Entity<WeeklyLessonPlan>(e =>
            e.HasIndex(x => new { x.SchoolId, x.WeekStart, x.SectionId, x.SubjectId, x.EmployeeId }).IsUnique());
        modelBuilder.Entity<ClassDiary>(e =>
            e.HasIndex(x => new { x.SchoolId, x.Date, x.SectionId, x.EmployeeId, x.SubjectId }).IsUnique());
    }

    private static System.Linq.Expressions.LambdaExpression BuildSoftDeleteFilter(Type type)
    {
        var param = System.Linq.Expressions.Expression.Parameter(type, "e");
        var prop = System.Linq.Expressions.Expression.Property(param, nameof(BaseEntity.IsDeleted));
        var body = System.Linq.Expressions.Expression.Equal(prop, System.Linq.Expressions.Expression.Constant(false));
        return System.Linq.Expressions.Expression.Lambda(body, param);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        return base.SaveChangesAsync(cancellationToken);
    }
}
