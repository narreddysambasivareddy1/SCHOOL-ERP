using SchoolERP.Domain.Enums;

namespace SchoolERP.Domain.Entities;

// ── Attendance ──────────────────────────────────────────────
public class AttendanceSession : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid AcademicYearId { get; set; }
    public Guid ClassId { get; set; }
    public Guid SectionId { get; set; }
    public Guid? SubjectId { get; set; }
    public DateOnly Date { get; set; }
    public string MarkedBy { get; set; } = string.Empty;
    public ICollection<StudentAttendance> Records { get; set; } = [];
}

public class StudentAttendance : TenantEntity
{
    public Guid SessionId { get; set; }
    public AttendanceSession? Session { get; set; }
    public Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public AttendanceCode Code { get; set; }
    public string? Remarks { get; set; }
}

public class EmployeeAttendance : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly? CheckIn { get; set; }
    public TimeOnly? CheckOut { get; set; }
    public string? Source { get; set; }
    public AttendanceCode Code { get; set; }
}

// ── Homework & Worksheets ───────────────────────────────────
public class Homework : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid TeacherAssignmentId { get; set; }
    public TeacherAssignment? TeacherAssignment { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public DateOnly IssueDate { get; set; }
    public DateOnly DueDate { get; set; }
    public bool IsPublished { get; set; }
    public ICollection<HomeworkSubmission> Submissions { get; set; } = [];
}

public class HomeworkSubmission : TenantEntity
{
    public Guid HomeworkId { get; set; }
    public Homework? Homework { get; set; }
    public Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string? FeedbackByTeacher { get; set; }
}

// ── Examinations ────────────────────────────────────────────
public class Examination : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid AcademicYearId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Term { get; set; }
    public bool IsPublished { get; set; }
    public ICollection<MarkEntry> MarkEntries { get; set; } = [];
}

public class MarkEntry : TenantEntity
{
    public Guid ExaminationId { get; set; }
    public Examination? Examination { get; set; }
    public Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public Guid SubjectId { get; set; }
    public Subject? Subject { get; set; }
    public decimal? MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
    public bool IsAbsent { get; set; }
    public string? Remarks { get; set; }
    public bool IsApproved { get; set; }
}

// ── Fees & Payments ─────────────────────────────────────────
public class FeeCategory : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class FeeStructure : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid AcademicYearId { get; set; }
    public Guid ClassId { get; set; }
    public Guid FeeCategoryId { get; set; }
    public FeeCategory? FeeCategory { get; set; }
    public decimal Amount { get; set; }
}

public class Payment : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; }
    public string? GatewayOrderId { get; set; }
    public string? GatewayPaymentId { get; set; }
    public string? ReceiptNumber { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Method { get; set; }
}

// ── Transport ───────────────────────────────────────────────
public class Vehicle : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public DateOnly? InsuranceExpiry { get; set; }
    public DateOnly? FitnessExpiry { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Route : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<RouteStop> Stops { get; set; } = [];
}

public class RouteStop : TenantEntity
{
    public Guid RouteId { get; set; }
    public Route? Route { get; set; }
    public string Name { get; set; } = string.Empty;
    public int StopOrder { get; set; }
    public TimeOnly? PickupTime { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class Trip : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid RouteId { get; set; }
    public Route? Route { get; set; }
    public Guid VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public Guid DriverId { get; set; }
    public Employee? Driver { get; set; }
    public DateOnly TripDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public bool IsActive { get; set; }
}

// ── Notifications ───────────────────────────────────────────
public class NotificationMessage : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; }
    public string RecipientRef { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public int RetryCount { get; set; }
    public DateTime? SentAt { get; set; }
    public string? ErrorDetails { get; set; }
}

// ── Leave ───────────────────────────────────────────────────
public class LeaveType : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MaxDaysPerYear { get; set; }
    public bool IsCarryForward { get; set; }
}

public class LeaveRequest : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public Guid LeaveTypeId { get; set; }
    public LeaveType? LeaveType { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public string? Reason { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}
