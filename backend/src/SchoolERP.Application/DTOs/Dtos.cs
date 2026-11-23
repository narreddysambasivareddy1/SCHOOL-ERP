namespace SchoolERP.Application.DTOs;

// Auth
public record LoginRequest(string Email, string Password, string? SchoolCode = null);
public record SchoolSessionDto(
    Guid TenantId, Guid SchoolId, string SchoolName, string Slug,
    Guid? AcademicYearId, string? AcademicYearName,
    string? LogoUrl, string? PrimaryColor,
    string Locale, string Currency, string TimeZone);
public record LoginResponse(string AccessToken, string TokenType, int ExpiresIn, UserDto User, SchoolSessionDto? School);
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
    Guid AcademicYearId, Guid ClassId, Guid SectionId, string? RollNumber, string? PhotoUrl = null);

public record UpdateStudentRequest(string FirstName, string LastName, DateOnly DateOfBirth, string? PhotoUrl);

public record GuardianDto(Guid Id, string FirstName, string LastName, string Relationship, string Phone, bool IsPrimary);
public record EnrollmentDto(Guid Id, string AcademicYear, string ClassName, string SectionName, DateOnly EffectiveFrom, string? RollNumber);

// Employees
public record EmployeeListDto(Guid Id, string EmployeeCode, string FirstName, string LastName, string? Department, string? Designation, string Status, string? Email, string? Phone, DateOnly JoiningDate, string? PhotoUrl, decimal BasicSalary);
public record CreateEmployeeRequest(string FirstName, string LastName, string? Email, string? Phone, Guid? DepartmentId, Guid? DesignationId, DateOnly JoiningDate, decimal BasicSalary, string? PhotoUrl = null);
public record UpdateEmployeeRequest(string FirstName, string LastName, string? Email, string? Phone, Guid? DepartmentId, Guid? DesignationId, DateOnly JoiningDate, decimal BasicSalary);
public record SetPhotoRequest(string PhotoUrl);

// Teacher Assignments
public record TeacherAssignmentDto(Guid Id, string TeacherName, string SubjectName, string ClassName, string SectionName, bool CanTakeAttendance, bool CanSetHomework, bool CanEnterMarks, bool IsActive);
public record CreateTeacherAssignmentRequest(
    Guid AcademicYearId, Guid EmployeeId, Guid SubjectId, Guid ClassId, Guid SectionId,
    string? PeriodSlot = null, string? ElectiveGroup = null);

// Registrations
public record CreateRegistrationRequest(
    Guid AcademicYearId,
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string? Gender,
    Guid PreferredClassId,
    Guid PreferredSectionId,
    string GuardianName,
    string GuardianPhone,
    string? GuardianEmail,
    string Relationship,
    decimal RegistrationFeeAmount);

public record PayRegistrationFeeRequest(decimal Amount, string? Method);
public record StatusToggleRequest(string Status);

// School
public record SchoolDto(Guid Id, string Name, string? LogoUrl, string? PrimaryColor, string TimeZone, string DefaultLanguage, string Locale, string Currency);
public record UpdateSchoolRequest(string Name, string? LogoUrl, string? PrimaryColor, string TimeZone, string DefaultLanguage, string Locale, string Currency);
public record AcademicYearDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent);

// Fee structures
public record FeeCategoryDto(Guid Id, string Name);
public record FeeStructureDto(Guid Id, string FeeCategory, Guid FeeCategoryId, Guid ClassId, string ClassName, decimal Amount);
public record CreateFeeCategoryRequest(string Name);
public record CreateFeeStructureRequest(Guid AcademicYearId, Guid ClassId, Guid FeeCategoryId, decimal Amount);

// Transport management
public record CreateVehicleRequest(string RegistrationNumber, int Capacity, DateOnly? InsuranceExpiry, DateOnly? FitnessExpiry);
public record UpdateVehicleRequest(string RegistrationNumber, int Capacity, DateOnly? InsuranceExpiry, DateOnly? FitnessExpiry);
public record CreateTripRequest(Guid RouteId, Guid VehicleId, Guid DriverId, DateOnly TripDate);
public record StudentRouteAllocationRequest(Guid StudentId, Guid RouteId, Guid? StopId);

// Calendar events
public record CalendarEventDto(Guid Id, string Title, string? Description, DateOnly StartDate, DateOnly EndDate, string EventType, string Audience, bool IsHoliday);
public record CreateCalendarEventRequest(string Title, string? Description, DateOnly StartDate, DateOnly EndDate, string EventType, string Audience, bool IsHoliday);

// Payroll salary update
public record UpdateEmployeeSalaryRequest(decimal BasicSalary);
