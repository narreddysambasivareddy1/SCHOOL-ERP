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
    public string? Provider { get; set; }
    public string? ProviderMessageId { get; set; }
    public string? TemplateKey { get; set; }
}

public class IntegrationSetting : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string ProviderKey { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public bool IsSandbox { get; set; } = true;
    public string ConfigJson { get; set; } = "{}";
}

public class Enquiry : TenantEntity
{
    public Guid SchoolId { get; set; }
    public EnquiryKind Kind { get; set; }
    public EnquiryStatus Status { get; set; } = EnquiryStatus.New;
    public string ParentName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? StudentName { get; set; }
    public string? GradeInterested { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Source { get; set; } = "Website";
    public Guid? AssignedToUserId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.ForeignKey(nameof(AssignedToUserId))]
    public User? AssignedTo { get; set; }
    public DateOnly? FollowUpOn { get; set; }
    public DateTime VerifiedAt { get; set; } = DateTime.UtcNow;
    public ICollection<EnquiryActivity> Activities { get; set; } = [];
}

public class EnquiryActivity : TenantEntity
{
    public Guid EnquiryId { get; set; }
    public Enquiry? Enquiry { get; set; }
    public Guid? ActorUserId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string? OldStatus { get; set; }
    public string? NewStatus { get; set; }
}

public class EnquiryOtpChallenge : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public int VerifyAttempts { get; set; }
    public DateTime? ConsumedAt { get; set; }
    public string PayloadJson { get; set; } = "{}";
}

public class SchoolAnnouncement : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Audience { get; set; } = "All";
    public string Channels { get; set; } = "InApp";
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
    public string PublishedBy { get; set; } = string.Empty;
}

// ── Leave ───────────────────────────────────────────────────
public class LeaveType : TenantEntity
{
    public Guid SchoolId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MaxDaysPerYear { get; set; }
    public bool IsCarryForward { get; set; }
}

public class PayrollRun : TenantEntity
{
    public Guid SchoolId { get; set; }
    public int PeriodYear { get; set; }
    public int PeriodMonth { get; set; }
    public string PeriodLabel { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public int EmployeeCount { get; set; }
    public decimal GrossTotal { get; set; }
    public decimal PfTotal { get; set; }
    public decimal EsiTotal { get; set; }
    public decimal TdsTotal { get; set; }
    public decimal NetTotal { get; set; }
    public DateTime? FinalizedAt { get; set; }
    public ICollection<Payslip> Payslips { get; set; } = [];
}

public class Payslip : TenantEntity
{
    public Guid PayrollRunId { get; set; }
    public PayrollRun? PayrollRun { get; set; }
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public decimal Basic { get; set; }
    public decimal Hra { get; set; }
    public decimal Allowance { get; set; }
    public decimal Gross { get; set; }
    public decimal Pf { get; set; }
    public decimal Esi { get; set; }
    public decimal ProfessionalTax { get; set; }
    public decimal Tds { get; set; }
    public decimal Net { get; set; }
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

public class StudentRegistration : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid AcademicYearId { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public Guid PreferredClassId { get; set; }
    public Guid PreferredSectionId { get; set; }
    public string GuardianName { get; set; } = string.Empty;
    public string GuardianPhone { get; set; } = string.Empty;
    public string? GuardianEmail { get; set; }
    public string Relationship { get; set; } = "Parent";
    public decimal RegistrationFeeAmount { get; set; }
    public bool FeePaid { get; set; }
    public string? FeeReceiptNumber { get; set; }
    public RegistrationStatus Status { get; set; } = RegistrationStatus.Registered;
    public Guid? StudentId { get; set; }
    public Student? Student { get; set; }
    public string? AdmissionNumber { get; set; }
    public string? BonafideNumber { get; set; }
    public string? PhotoUrl { get; set; }
    public string? ConfirmedBy { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public ICollection<StudentDocument> Documents { get; set; } = [];
}

public class StudentDocument : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid? RegistrationId { get; set; }
    public StudentRegistration? Registration { get; set; }
    public Guid? StudentId { get; set; }
    public Student? Student { get; set; }
    public StudentDocumentKind Kind { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public string RelativePath { get; set; } = string.Empty;
    public bool Verified { get; set; }
    public string? VerifiedBy { get; set; }
    public DateTime? VerifiedAt { get; set; }
}

public class SchoolAcademicSetting : TenantEntity
{
    public Guid SchoolId { get; set; }
    public TimeOnly DiaryDeadline { get; set; } = new(16, 30);
    public TimeOnly WeeklyPlanDeadline { get; set; } = new(18, 0);
}

public class TimetablePeriod : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid AcademicYearId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public PeriodBand Band { get; set; }
}

public class TimetableSlot : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid AcademicYearId { get; set; }
    public Guid ClassId { get; set; }
    public Class? Class { get; set; }
    public Guid SectionId { get; set; }
    public Section? Section { get; set; }
    public int DayOfWeek { get; set; }
    public Guid PeriodId { get; set; }
    public TimetablePeriod? Period { get; set; }
    public Guid SubjectId { get; set; }
    public Subject? Subject { get; set; }
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public string? ElectiveGroup { get; set; }
}

public class SubstitutionNeed : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid LeaveRequestId { get; set; }
    public LeaveRequest? LeaveRequest { get; set; }
    public Guid TimetableSlotId { get; set; }
    public TimetableSlot? TimetableSlot { get; set; }
    public DateOnly Date { get; set; }
    public Guid PeriodId { get; set; }
    public TimetablePeriod? Period { get; set; }
    public Guid ClassId { get; set; }
    public Guid SectionId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid OriginalEmployeeId { get; set; }
    public Employee? OriginalEmployee { get; set; }
    public Guid? SubstituteEmployeeId { get; set; }
    public Employee? SubstituteEmployee { get; set; }
    public SubstitutionStatus Status { get; set; } = SubstitutionStatus.Open;
}

public class WeeklyLessonPlan : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid AcademicYearId { get; set; }
    public DateOnly WeekStart { get; set; }
    public Guid ClassId { get; set; }
    public Class? Class { get; set; }
    public Guid SectionId { get; set; }
    public Section? Section { get; set; }
    public Guid SubjectId { get; set; }
    public Subject? Subject { get; set; }
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public ICollection<WeeklyLessonPlanDay> Days { get; set; } = [];
}

public class WeeklyLessonPlanDay : TenantEntity
{
    public Guid PlanId { get; set; }
    public WeeklyLessonPlan? Plan { get; set; }
    public int DayOfWeek { get; set; }
    public string Topic { get; set; } = string.Empty;
}

public class ClassDiary : TenantEntity
{
    public Guid SchoolId { get; set; }
    public Guid AcademicYearId { get; set; }
    public DateOnly Date { get; set; }
    public Guid ClassId { get; set; }
    public Class? Class { get; set; }
    public Guid SectionId { get; set; }
    public Section? Section { get; set; }
    public Guid? SubjectId { get; set; }
    public Subject? Subject { get; set; }
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DiaryEntryMode Mode { get; set; } = DiaryEntryMode.Digital;
    public string? Notes { get; set; }
    public string? Homework { get; set; }
    public string? FileName { get; set; }
    public string? RelativePath { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public bool IsLate { get; set; }
}
