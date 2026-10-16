using SchoolERP.Application.DTOs;

namespace SchoolERP.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request, Guid? tenantId = null, CancellationToken ct = default);
}

public interface IStudentService
{
    Task<PagedResult<StudentListDto>> GetStudentsAsync(Guid schoolId, Guid academicYearId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<StudentDetailDto?> GetStudentAsync(Guid id, Guid schoolId, CancellationToken ct = default);
    Task<StudentDetailDto> CreateStudentAsync(CreateStudentRequest request, Guid schoolId, Guid tenantId, string createdBy, CancellationToken ct = default);
}

public interface IEmployeeService
{
    Task<PagedResult<EmployeeListDto>> GetEmployeesAsync(Guid schoolId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<EmployeeListDto> CreateEmployeeAsync(CreateEmployeeRequest request, Guid schoolId, Guid tenantId, string createdBy, CancellationToken ct = default);
}

public interface ITeacherAssignmentService
{
    Task<IEnumerable<TeacherAssignmentDto>> GetAssignmentsAsync(Guid schoolId, Guid academicYearId, CancellationToken ct = default);
    Task<TeacherAssignmentDto> CreateAssignmentAsync(CreateTeacherAssignmentRequest request, Guid tenantId, string createdBy, CancellationToken ct = default);
}

public interface IAuditService
{
    Task LogAsync(Guid tenantId, string actor, string action, string entityType, string? entityId, object? oldValues = null, object? newValues = null, string? ipAddress = null);
}
