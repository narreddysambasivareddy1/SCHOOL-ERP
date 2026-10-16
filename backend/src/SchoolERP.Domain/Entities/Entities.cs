using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public abstract class TenantEntity : BaseEntity
{
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }
}

public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<School> Schools { get; set; } = [];
}

public class School : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string TimeZone { get; set; } = "Asia/Kolkata";
    public string DefaultLanguage { get; set; } = "en";
    public string Locale { get; set; } = "en-IN";
    public string Currency { get; set; } = "INR";
    public ICollection<Campus> Campuses { get; set; } = [];
    public ICollection<AcademicYear> AcademicYears { get; set; } = [];
}

public class Campus : TenantEntity
{
    public Guid SchoolId { get; set; }
    public School? School { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AcademicYear : TenantEntity
{
    public Guid SchoolId { get; set; }
    public School? School { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsCurrent { get; set; }
}

public class User : TenantEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool MfaEnabled { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = [];
}

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = [];
}

public class UserRole : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid RoleId { get; set; }
    public Role? Role { get; set; }
    public Guid? SchoolId { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? GrantedBy { get; set; }
}

public class Student : TenantEntity
{
    public Guid SchoolId { get; set; }
    public School? School { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string? PhotoUrl { get; set; }
    public StudentStatus Status { get; set; } = StudentStatus.Active;
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public ICollection<StudentEnrollment> Enrollments { get; set; } = [];
    public ICollection<StudentGuardian> Guardians { get; set; } = [];
}

public class StudentEnrollment : TenantEntity
{
    public Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public Guid AcademicYearId { get; set; }
    public AcademicYear? AcademicYear { get; set; }
    public Guid ClassId { get; set; }
    public Class? Class { get; set; }
    public Guid SectionId { get; set; }
    public Section? Section { get; set; }
    public string? RollNumber { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
}

public class Guardian : TenantEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public ICollection<StudentGuardian> Students { get; set; } = [];
}

public class StudentGuardian : TenantEntity
{
    public Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public Guid GuardianId { get; set; }
    public Guardian? Guardian { get; set; }
    public string Relationship { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public bool CanPickup { get; set; }
    public bool ReceivesNotifications { get; set; } = true;
}

public class Class : TenantEntity
{
    public Guid SchoolId { get; set; }
    public School? School { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public ICollection<Section> Sections { get; set; } = [];
}

public class Section : TenantEntity
{
    public Guid ClassId { get; set; }
    public Class? Class { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
}

public class Subject : TenantEntity
{
    public Guid SchoolId { get; set; }
    public School? School { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsLanguage { get; set; }
}

public class TeacherAssignment : TenantEntity
{
    public Guid AcademicYearId { get; set; }
    public AcademicYear? AcademicYear { get; set; }
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public Guid SubjectId { get; set; }
    public Subject? Subject { get; set; }
    public Guid ClassId { get; set; }
    public Class? Class { get; set; }
    public Guid SectionId { get; set; }
    public Section? Section { get; set; }
    public bool CanTakeAttendance { get; set; } = true;
    public bool CanSetHomework { get; set; } = true;
    public bool CanEnterMarks { get; set; } = true;
    public bool IsActive { get; set; } = true;
}

public class Employee : TenantEntity
{
    public Guid SchoolId { get; set; }
    public School? School { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public Guid? DesignationId { get; set; }
    public Designation? Designation { get; set; }
    public DateOnly JoiningDate { get; set; }
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;
    public Guid? UserId { get; set; }
    public User? User { get; set; }
}

public class Department : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class Designation : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class AuditEvent : TenantEntity
{
    public string Actor { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}
