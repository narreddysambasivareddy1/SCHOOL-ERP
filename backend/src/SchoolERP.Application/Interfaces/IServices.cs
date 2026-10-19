using SchoolERP.Application.DTOs;
using SchoolERP.Domain.Enums;

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
    Task SetStatusAsync(Guid id, Guid schoolId, string status, CancellationToken ct = default);
}

public interface IEmployeeService
{
    Task<PagedResult<EmployeeListDto>> GetEmployeesAsync(Guid schoolId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<EmployeeListDto> CreateEmployeeAsync(CreateEmployeeRequest request, Guid schoolId, Guid tenantId, string createdBy, CancellationToken ct = default);
    Task SetStatusAsync(Guid id, Guid schoolId, string status, CancellationToken ct = default);
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

public record NotificationRecipient(string Ref, string? Email, string? Phone, string? Name);

public record NotificationDispatchRequest(
    Guid TenantId,
    Guid SchoolId,
    string Title,
    string Body,
    IReadOnlyList<NotificationChannel> Channels,
    IReadOnlyList<NotificationRecipient> Recipients,
    string TemplateKey);

public interface INotificationService
{
    Task<int> DispatchAsync(NotificationDispatchRequest request, CancellationToken ct = default);
}

public record EnquiryOtpRequest(
    string Kind,
    string ParentName,
    string Phone,
    string? Email,
    string? StudentName,
    string? GradeInterested,
    string Message);

public record EnquiryOtpRequestResult(Guid ChallengeId, DateTime ExpiresAt, string? SandboxOtp);
public record EnquiryVerifyRequest(Guid ChallengeId, string Otp);

public record EnquiryListItem(
    Guid Id, Guid TenantId, Guid SchoolId, string Kind, string Status, string ParentName, string Phone, string? Email,
    string? StudentName, string? GradeInterested, string Message, string Source,
    Guid? AssignedToUserId, string? AssignedToName, DateOnly? FollowUpOn, DateTime VerifiedAt, DateTime CreatedAt);

public record EnquiryActivityDto(Guid Id, string ActorName, string Action, string? Note, string? OldStatus, string? NewStatus, DateTime CreatedAt);

public record EnquiryDetail(EnquiryListItem Enquiry, IReadOnlyList<EnquiryActivityDto> Activities);

public interface IEnquiryService
{
    Task<EnquiryOtpRequestResult> RequestOtpAsync(string schoolCode, EnquiryOtpRequest request, string ipAddress, CancellationToken ct = default);
    Task<EnquiryListItem> VerifyOtpAsync(EnquiryVerifyRequest request, string ipAddress, CancellationToken ct = default);
    Task<IReadOnlyList<EnquiryListItem>> ListAsync(Guid schoolId, Guid tenantId, string? status, string? kind, CancellationToken ct = default);
    Task<EnquiryDetail?> GetAsync(Guid schoolId, Guid tenantId, Guid enquiryId, CancellationToken ct = default);
    Task<EnquiryListItem> AssignAsync(Guid schoolId, Guid tenantId, Guid enquiryId, Guid assignedToUserId, Guid actorId, string actorName, CancellationToken ct = default);
    Task<EnquiryListItem> UpdateStatusAsync(Guid schoolId, Guid tenantId, Guid enquiryId, string status, DateOnly? followUpOn, Guid actorId, string actorName, CancellationToken ct = default);
    Task AddNoteAsync(Guid schoolId, Guid tenantId, Guid enquiryId, string note, string action, Guid actorId, string actorName, CancellationToken ct = default);
}
