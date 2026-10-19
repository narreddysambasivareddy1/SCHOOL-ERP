namespace SchoolERP.Domain.Enums;

public enum StudentStatus
{
    Enquiry,
    AdmissionPending,
    Active,
    Inactive,
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
    Archived,
    Inactive
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

public enum EnquiryKind
{
    Admission,
    Fees,
    General
}

public enum EnquiryStatus
{
    Unverified,
    New,
    Contacted,
    SiteVisit,
    Converted,
    Rejected
}

public enum RegistrationStatus
{
    Registered,
    FeePaid,
    Confirmed,
    Rejected
}

public enum StudentDocumentKind
{
    Photo,
    Identity,
    TransferCertificate,
    Other
}

public enum PeriodBand
{
    Morning,
    Evening
}

public enum SubstitutionStatus
{
    Open,
    Assigned,
    Cancelled
}

public enum DiaryEntryMode
{
    Digital,
    Scan
}
