namespace SchoolERP.Domain.Enums;

public enum StudentStatus
{
    Enquiry,
    AdmissionPending,
    Active,
    OnLeave,
    TransferredOut,
    Withdrawn,
    Graduated,
    Archived
}

public enum EmployeeStatus
{
    Active,
    Probation,
    OnLeave,
    Suspended,
    ResignationPending,
    Terminated,
    Archived
}

public enum PaymentStatus
{
    Initiated,
    Pending,
    Successful,
    Failed,
    Cancelled,
    Refunded,
    PartiallyRefunded
}

public enum AttendanceCode
{
    Present,
    Absent,
    Late,
    Excused,
    ApprovedLeave,
    Holiday
}

public enum NotificationChannel
{
    InApp,
    Email,
    Sms,
    WhatsApp,
    WebPush
}
