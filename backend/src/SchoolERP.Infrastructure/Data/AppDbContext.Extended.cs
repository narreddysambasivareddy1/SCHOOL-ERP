using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;

namespace SchoolERP.Infrastructure.Data;

public partial class AppDbContext
{
    public DbSet<AttendanceSession> AttendanceSessions => Set<AttendanceSession>();
    public DbSet<StudentAttendance> StudentAttendances => Set<StudentAttendance>();
    public DbSet<EmployeeAttendance> EmployeeAttendances => Set<EmployeeAttendance>();
    public DbSet<Homework> Homeworks => Set<Homework>();
    public DbSet<HomeworkSubmission> HomeworkSubmissions => Set<HomeworkSubmission>();
    public DbSet<Examination> Examinations => Set<Examination>();
    public DbSet<MarkEntry> MarkEntries => Set<MarkEntry>();
    public DbSet<FeeCategory> FeeCategories => Set<FeeCategory>();
    public DbSet<FeeStructure> FeeStructures => Set<FeeStructure>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Route> Routes => Set<Route>();
    public DbSet<RouteStop> RouteStops => Set<RouteStop>();
    public DbSet<Trip> Trips => Set<Trip>();
    public DbSet<NotificationMessage> NotificationMessages => Set<NotificationMessage>();
    public DbSet<IntegrationSetting> IntegrationSettings => Set<IntegrationSetting>();
    public DbSet<SchoolAnnouncement> SchoolAnnouncements => Set<SchoolAnnouncement>();
    public DbSet<LeaveType> LeaveTypes => Set<LeaveType>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<Enquiry> Enquiries => Set<Enquiry>();
    public DbSet<EnquiryActivity> EnquiryActivities => Set<EnquiryActivity>();
    public DbSet<EnquiryOtpChallenge> EnquiryOtpChallenges => Set<EnquiryOtpChallenge>();
    public DbSet<PayrollRun> PayrollRuns => Set<PayrollRun>();
    public DbSet<Payslip> Payslips => Set<Payslip>();
    public DbSet<StudentRegistration> StudentRegistrations => Set<StudentRegistration>();
    public DbSet<StudentDocument> StudentDocuments => Set<StudentDocument>();
    public DbSet<SchoolAcademicSetting> SchoolAcademicSettings => Set<SchoolAcademicSetting>();
    public DbSet<TimetablePeriod> TimetablePeriods => Set<TimetablePeriod>();
    public DbSet<TimetableSlot> TimetableSlots => Set<TimetableSlot>();
    public DbSet<SubstitutionNeed> SubstitutionNeeds => Set<SubstitutionNeed>();
    public DbSet<WeeklyLessonPlan> WeeklyLessonPlans => Set<WeeklyLessonPlan>();
    public DbSet<WeeklyLessonPlanDay> WeeklyLessonPlanDays => Set<WeeklyLessonPlanDay>();
    public DbSet<ClassDiary> ClassDiaries => Set<ClassDiary>();
}
