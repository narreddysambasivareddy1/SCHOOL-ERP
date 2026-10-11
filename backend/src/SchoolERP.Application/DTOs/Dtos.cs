namespace SchoolERP.Application.DTOs;

// Auth
public record LoginRequest(string Email, string Password);
public record LoginResponse(string AccessToken, string TokenType, int ExpiresIn, UserDto User);
public record UserDto(Guid Id, string Email, string FirstName, string LastName, IEnumerable<string> Roles);

// Pagination
public record PagedResult<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize);

// Students
public record StudentListDto(
    Guid Id, string StudentCode, string FirstName, string LastName,
    string ClassName, string SectionName, string Status, string? PhotoUrl);

public record StudentDetailDto(
    Guid Id, string StudentCode, string FirstName, string LastName,
    DateOnly DateOfBirth, string Status, string? PhotoUrl,
    IEnumerable<GuardianDto> Guardians, IEnumerable<EnrollmentDto> Enrollments);

public record CreateStudentRequest(
    string FirstName, string LastName, DateOnly DateOfBirth,
    Guid AcademicYearId, Guid ClassId, Guid SectionId, string? RollNumber);

public record GuardianDto(Guid Id, string FirstName, string LastName, string Relationship, string Phone, bool IsPrimary);
public record EnrollmentDto(Guid Id, string AcademicYear, string ClassName, string SectionName, DateOnly EffectiveFrom);

// Employees
public record EmployeeListDto(Guid Id, string EmployeeCode, string FirstName, string LastName, string? Department, string? Designation, string Status);
public record CreateEmployeeRequest(string FirstName, string LastName, string? Email, string? Phone, Guid? DepartmentId, Guid? DesignationId, DateOnly JoiningDate);

// Teacher Assignments
public record TeacherAssignmentDto(Guid Id, string TeacherName, string SubjectName, string ClassName, string SectionName, bool CanTakeAttendance, bool CanSetHomework, bool CanEnterMarks, bool IsActive);
public record CreateTeacherAssignmentRequest(Guid AcademicYearId, Guid EmployeeId, Guid SubjectId, Guid ClassId, Guid SectionId);

// School
public record SchoolDto(Guid Id, string Name, string? LogoUrl, string? PrimaryColor, string TimeZone, string DefaultLanguage);
public record AcademicYearDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent);
