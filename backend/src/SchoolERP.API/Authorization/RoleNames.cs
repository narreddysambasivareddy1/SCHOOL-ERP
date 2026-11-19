namespace SchoolERP.API.Authorization;

public static class RoleNames
{
    public const string Leadership = "SchoolAdmin,PlatformSuperAdmin";
    public const string Hr = "SchoolAdmin,PlatformSuperAdmin,HRManager";
    public const string AdmissionsWrite = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer";
    public const string AdmissionsDesk = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer,FrontOffice";
    public const string StudentDirectory = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer,FrontOffice,Teacher,AttendanceOfficer,Accountant";
    public const string EmployeeDirectory = "SchoolAdmin,PlatformSuperAdmin,HRManager,Teacher,AttendanceOfficer";
    public const string Teaching = "SchoolAdmin,PlatformSuperAdmin,Teacher";
    public const string AttendanceStaff = "SchoolAdmin,PlatformSuperAdmin,Teacher,AttendanceOfficer";
    public const string FeesStaff = "SchoolAdmin,PlatformSuperAdmin,Accountant";
    public const string Payroll = "SchoolAdmin,PlatformSuperAdmin,HRManager,PayrollOfficer";
    public const string LeaveApply = "SchoolAdmin,PlatformSuperAdmin,HRManager,Teacher,AttendanceOfficer";
    public const string LeaveDecide = "SchoolAdmin,PlatformSuperAdmin,HRManager";
    public const string TransportWrite = "SchoolAdmin,PlatformSuperAdmin,TransportManager";
    public const string Substitutions = "SchoolAdmin,PlatformSuperAdmin,HRManager";
}
