--
-- PostgreSQL database dump
--

\restrict g1iCjePe3rILxecVqYmmPXSIg8VcVZA7Uj3BUFCSyMvCo7z7ibwchSxtWjXgWeD

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AcademicYears; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AcademicYears" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Name" text NOT NULL,
    "StartDate" date NOT NULL,
    "EndDate" date NOT NULL,
    "IsCurrent" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: AttendanceSessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceSessions" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "ClassId" uuid NOT NULL,
    "SectionId" uuid NOT NULL,
    "SubjectId" uuid,
    "Date" date NOT NULL,
    "MarkedBy" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: AuditEvents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditEvents" (
    "Id" uuid NOT NULL,
    "Actor" text NOT NULL,
    "Action" text NOT NULL,
    "EntityType" text NOT NULL,
    "EntityId" text,
    "OldValues" text,
    "NewValues" text,
    "IpAddress" text,
    "OccurredAt" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Campuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Campuses" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Name" text NOT NULL,
    "Address" text,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: ClassDiaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClassDiaries" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "Date" date NOT NULL,
    "ClassId" uuid NOT NULL,
    "SectionId" uuid NOT NULL,
    "SubjectId" uuid,
    "EmployeeId" uuid NOT NULL,
    "Mode" integer NOT NULL,
    "Notes" text,
    "Homework" text,
    "FileName" text,
    "RelativePath" text,
    "SubmittedAt" timestamp with time zone NOT NULL,
    "IsLate" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Classes" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Name" text NOT NULL,
    "SortOrder" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Departments" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Name" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Designations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Designations" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Name" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: EmployeeAttendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmployeeAttendances" (
    "Id" uuid NOT NULL,
    "EmployeeId" uuid NOT NULL,
    "Date" date NOT NULL,
    "CheckIn" time without time zone,
    "CheckOut" time without time zone,
    "Source" text,
    "Code" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Employees" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "EmployeeCode" text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "Email" text,
    "Phone" text,
    "DepartmentId" uuid,
    "DesignationId" uuid,
    "JoiningDate" date NOT NULL,
    "Status" integer NOT NULL,
    "UserId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL,
    "BasicSalary" numeric DEFAULT 0.0 NOT NULL,
    "PhotoUrl" text
);


--
-- Name: Enquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Enquiries" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Kind" integer NOT NULL,
    "Status" integer NOT NULL,
    "ParentName" text NOT NULL,
    "Phone" text NOT NULL,
    "Email" text,
    "StudentName" text,
    "GradeInterested" text,
    "Message" text NOT NULL,
    "Source" text NOT NULL,
    "AssignedToUserId" uuid,
    "FollowUpOn" date,
    "VerifiedAt" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: EnquiryActivities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EnquiryActivities" (
    "Id" uuid NOT NULL,
    "EnquiryId" uuid NOT NULL,
    "ActorUserId" uuid,
    "ActorName" text NOT NULL,
    "Action" text NOT NULL,
    "Note" text,
    "OldStatus" text,
    "NewStatus" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: EnquiryOtpChallenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EnquiryOtpChallenges" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Phone" text NOT NULL,
    "IpAddress" text NOT NULL,
    "CodeHash" text NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "VerifyAttempts" integer NOT NULL,
    "ConsumedAt" timestamp with time zone,
    "PayloadJson" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Examinations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Examinations" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "Name" text NOT NULL,
    "Term" text,
    "IsPublished" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: FeeCategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FeeCategories" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Name" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: FeeStructures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FeeStructures" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "ClassId" uuid NOT NULL,
    "FeeCategoryId" uuid NOT NULL,
    "Amount" numeric NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Guardians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Guardians" (
    "Id" uuid NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "Phone" text NOT NULL,
    "Email" text,
    "UserId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: HomeworkSubmissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HomeworkSubmissions" (
    "Id" uuid NOT NULL,
    "HomeworkId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "SubmittedAt" timestamp with time zone NOT NULL,
    "FeedbackByTeacher" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Homeworks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Homeworks" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "TeacherAssignmentId" uuid NOT NULL,
    "Title" text NOT NULL,
    "Instructions" text,
    "IssueDate" date NOT NULL,
    "DueDate" date NOT NULL,
    "IsPublished" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: IntegrationSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IntegrationSettings" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "ProviderKey" text NOT NULL,
    "ProviderName" text NOT NULL,
    "IsEnabled" boolean NOT NULL,
    "IsSandbox" boolean NOT NULL,
    "ConfigJson" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: LeaveRequests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeaveRequests" (
    "Id" uuid NOT NULL,
    "EmployeeId" uuid NOT NULL,
    "LeaveTypeId" uuid NOT NULL,
    "FromDate" date NOT NULL,
    "ToDate" date NOT NULL,
    "Reason" text,
    "Status" text NOT NULL,
    "ApprovedBy" text,
    "ApprovedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: LeaveTypes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeaveTypes" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Name" text NOT NULL,
    "MaxDaysPerYear" integer NOT NULL,
    "IsCarryForward" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: MarkEntries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MarkEntries" (
    "Id" uuid NOT NULL,
    "ExaminationId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "SubjectId" uuid NOT NULL,
    "MarksObtained" numeric,
    "MaxMarks" numeric NOT NULL,
    "IsAbsent" boolean NOT NULL,
    "Remarks" text,
    "IsApproved" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: NotificationMessages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."NotificationMessages" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Title" text NOT NULL,
    "Body" text NOT NULL,
    "Channel" integer NOT NULL,
    "RecipientRef" text NOT NULL,
    "Status" text NOT NULL,
    "RetryCount" integer NOT NULL,
    "SentAt" timestamp with time zone,
    "ErrorDetails" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL,
    "Provider" text,
    "ProviderMessageId" text,
    "TemplateKey" text
);


--
-- Name: Payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payments" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "Amount" numeric NOT NULL,
    "Status" integer NOT NULL,
    "GatewayOrderId" text,
    "GatewayPaymentId" text,
    "ReceiptNumber" text,
    "PaidAt" timestamp with time zone,
    "Method" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: PayrollRuns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PayrollRuns" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "PeriodYear" integer NOT NULL,
    "PeriodMonth" integer NOT NULL,
    "PeriodLabel" text NOT NULL,
    "Status" text NOT NULL,
    "EmployeeCount" integer NOT NULL,
    "GrossTotal" numeric NOT NULL,
    "PfTotal" numeric NOT NULL,
    "EsiTotal" numeric NOT NULL,
    "TdsTotal" numeric NOT NULL,
    "NetTotal" numeric NOT NULL,
    "FinalizedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Payslips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payslips" (
    "Id" uuid NOT NULL,
    "PayrollRunId" uuid NOT NULL,
    "EmployeeId" uuid NOT NULL,
    "Basic" numeric NOT NULL,
    "Hra" numeric NOT NULL,
    "Allowance" numeric NOT NULL,
    "Gross" numeric NOT NULL,
    "Pf" numeric NOT NULL,
    "Esi" numeric NOT NULL,
    "ProfessionalTax" numeric NOT NULL,
    "Tds" numeric NOT NULL,
    "Net" numeric NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Roles" (
    "Id" uuid NOT NULL,
    "Name" text NOT NULL,
    "Description" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL
);


--
-- Name: RouteStops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RouteStops" (
    "Id" uuid NOT NULL,
    "RouteId" uuid NOT NULL,
    "Name" text NOT NULL,
    "StopOrder" integer NOT NULL,
    "PickupTime" time without time zone,
    "Latitude" double precision,
    "Longitude" double precision,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Routes" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Name" text NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: SchoolAcademicSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SchoolAcademicSettings" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "DiaryDeadline" time without time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL,
    "WeeklyPlanDeadline" time without time zone DEFAULT '18:00:00'::time without time zone NOT NULL
);


--
-- Name: SchoolAnnouncements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SchoolAnnouncements" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Title" text NOT NULL,
    "Body" text NOT NULL,
    "Audience" text NOT NULL,
    "Channels" text NOT NULL,
    "PublishedAt" timestamp with time zone NOT NULL,
    "PublishedBy" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Schools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Schools" (
    "Id" uuid NOT NULL,
    "Name" text NOT NULL,
    "LogoUrl" text,
    "PrimaryColor" text,
    "TimeZone" text NOT NULL,
    "DefaultLanguage" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL,
    "Currency" text DEFAULT 'INR'::text NOT NULL,
    "Locale" text DEFAULT 'en-IN'::text NOT NULL
);


--
-- Name: Sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Sections" (
    "Id" uuid NOT NULL,
    "ClassId" uuid NOT NULL,
    "Name" text NOT NULL,
    "Capacity" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: StudentAttendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StudentAttendances" (
    "Id" uuid NOT NULL,
    "SessionId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "Code" integer NOT NULL,
    "Remarks" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: StudentDocuments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StudentDocuments" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "RegistrationId" uuid,
    "StudentId" uuid,
    "Kind" integer NOT NULL,
    "FileName" text NOT NULL,
    "ContentType" text NOT NULL,
    "RelativePath" text NOT NULL,
    "Verified" boolean NOT NULL,
    "VerifiedBy" text,
    "VerifiedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: StudentEnrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StudentEnrollments" (
    "Id" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "ClassId" uuid NOT NULL,
    "SectionId" uuid NOT NULL,
    "RollNumber" text,
    "EffectiveFrom" date NOT NULL,
    "EffectiveTo" date,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: StudentGuardians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StudentGuardians" (
    "Id" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "GuardianId" uuid NOT NULL,
    "Relationship" text NOT NULL,
    "IsPrimary" boolean NOT NULL,
    "CanPickup" boolean NOT NULL,
    "ReceivesNotifications" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: StudentRegistrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StudentRegistrations" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "RegistrationNumber" text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "DateOfBirth" date NOT NULL,
    "Gender" text,
    "PreferredClassId" uuid NOT NULL,
    "PreferredSectionId" uuid NOT NULL,
    "GuardianName" text NOT NULL,
    "GuardianPhone" text NOT NULL,
    "GuardianEmail" text,
    "Relationship" text NOT NULL,
    "RegistrationFeeAmount" numeric NOT NULL,
    "FeePaid" boolean NOT NULL,
    "FeeReceiptNumber" text,
    "Status" integer NOT NULL,
    "StudentId" uuid,
    "AdmissionNumber" text,
    "BonafideNumber" text,
    "PhotoUrl" text,
    "ConfirmedBy" text,
    "ConfirmedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Students" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "StudentCode" text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "DateOfBirth" date NOT NULL,
    "PhotoUrl" text,
    "Status" integer NOT NULL,
    "UserId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subjects" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "Name" text NOT NULL,
    "Code" text NOT NULL,
    "IsLanguage" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: SubstitutionNeeds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SubstitutionNeeds" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "LeaveRequestId" uuid NOT NULL,
    "TimetableSlotId" uuid NOT NULL,
    "Date" date NOT NULL,
    "PeriodId" uuid NOT NULL,
    "ClassId" uuid NOT NULL,
    "SectionId" uuid NOT NULL,
    "SubjectId" uuid NOT NULL,
    "OriginalEmployeeId" uuid NOT NULL,
    "SubstituteEmployeeId" uuid,
    "Status" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: TeacherAssignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeacherAssignments" (
    "Id" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "EmployeeId" uuid NOT NULL,
    "SubjectId" uuid NOT NULL,
    "ClassId" uuid NOT NULL,
    "SectionId" uuid NOT NULL,
    "CanTakeAttendance" boolean NOT NULL,
    "CanSetHomework" boolean NOT NULL,
    "CanEnterMarks" boolean NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL,
    "ElectiveGroup" text,
    "PeriodSlot" text
);


--
-- Name: Tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tenants" (
    "Id" uuid NOT NULL,
    "Name" text NOT NULL,
    "Slug" text NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL
);


--
-- Name: TimetablePeriods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TimetablePeriods" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "Name" text NOT NULL,
    "SortOrder" integer NOT NULL,
    "StartTime" time without time zone NOT NULL,
    "EndTime" time without time zone NOT NULL,
    "Band" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: TimetableSlots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TimetableSlots" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "ClassId" uuid NOT NULL,
    "SectionId" uuid NOT NULL,
    "DayOfWeek" integer NOT NULL,
    "PeriodId" uuid NOT NULL,
    "SubjectId" uuid NOT NULL,
    "EmployeeId" uuid NOT NULL,
    "ElectiveGroup" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Trips" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "RouteId" uuid NOT NULL,
    "VehicleId" uuid NOT NULL,
    "DriverId" uuid NOT NULL,
    "TripDate" date NOT NULL,
    "StartedAt" timestamp with time zone,
    "EndedAt" timestamp with time zone,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: UserRoles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserRoles" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "RoleId" uuid NOT NULL,
    "SchoolId" uuid,
    "ExpiresAt" timestamp with time zone,
    "GrantedBy" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL
);


--
-- Name: Users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users" (
    "Id" uuid NOT NULL,
    "Email" text NOT NULL,
    "PasswordHash" text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "IsActive" boolean NOT NULL,
    "MfaEnabled" boolean NOT NULL,
    "LastLoginAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: Vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Vehicles" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "RegistrationNumber" text NOT NULL,
    "Capacity" integer NOT NULL,
    "InsuranceExpiry" date,
    "FitnessExpiry" date,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: WeeklyLessonPlanDays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WeeklyLessonPlanDays" (
    "Id" uuid NOT NULL,
    "PlanId" uuid NOT NULL,
    "DayOfWeek" integer NOT NULL,
    "Topic" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: WeeklyLessonPlans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WeeklyLessonPlans" (
    "Id" uuid NOT NULL,
    "SchoolId" uuid NOT NULL,
    "AcademicYearId" uuid NOT NULL,
    "WeekStart" date NOT NULL,
    "ClassId" uuid NOT NULL,
    "SectionId" uuid NOT NULL,
    "SubjectId" uuid NOT NULL,
    "EmployeeId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "UpdatedBy" text,
    "IsDeleted" boolean NOT NULL,
    "TenantId" uuid NOT NULL
);


--
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL
);


--
-- Data for Name: AcademicYears; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AcademicYears" ("Id", "SchoolId", "Name", "StartDate", "EndDate", "IsCurrent", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
f277962c-327e-47e2-b622-a49bbe4b85a9	87e1bf55-4b87-41d5-bf52-f3f462f88b20	2026-27	2026-06-01	2027-03-31	t	2026-10-12 04:07:14.197846+00	2026-10-12 04:07:14.197846+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: AttendanceSessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AttendanceSessions" ("Id", "SchoolId", "AcademicYearId", "ClassId", "SectionId", "SubjectId", "Date", "MarkedBy", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
1de263b1-ccd3-4c7d-8c3b-cf5a48960437	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-16	seed	2026-10-16 03:46:58.423947+00	2026-10-16 03:46:58.423948+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2356acb9-b279-4dec-b3b4-8f3754615e3f	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-14	seed	2026-10-16 03:46:58.721101+00	2026-10-16 03:46:58.721101+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4b8e7c90-bc02-4548-9cdc-466af03a9a0e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-15	seed	2026-10-16 03:46:58.716399+00	2026-10-16 03:46:58.716399+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
710fab9a-d642-4fd7-a79b-bcd9f7e56788	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-12	seed	2026-10-16 03:46:58.731389+00	2026-10-16 03:46:58.731389+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
968984b3-530a-4a6a-a18c-305a5a71a2a8	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-13	seed	2026-10-16 03:46:58.727448+00	2026-10-16 03:46:58.727448+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
aed27eab-4fd4-42b5-9eb7-62af87981f19	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-10	seed	2026-10-16 03:46:58.737149+00	2026-10-16 03:46:58.737149+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1a0d51b3-cfe2-4575-969b-c6fca70b5425	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-17	seed	2026-10-18 02:00:30.942942+00	2026-10-18 02:00:30.942943+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a3774551-070e-4f2a-8ff3-1c941958fc76	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-19	seed	2026-10-20 05:12:37.485247+00	2026-10-20 05:12:37.485248+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
eb806a3c-5ca6-438c-97bf-91021b89d34a	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-20	seed	2026-10-20 05:12:37.333589+00	2026-10-20 05:12:37.333589+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
19c8e907-b3d7-4829-a81f-e96db9274da5	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-21	seed	2026-10-27 02:36:06.509859+00	2026-10-27 02:36:06.509859+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
322ff569-d56b-4828-a0d5-b36c42e5c8fe	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-27	seed	2026-10-27 02:36:06.372294+00	2026-10-27 02:36:06.372294+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3abc563e-22ce-45ae-811a-7c05aa7a1c31	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-23	seed	2026-10-27 02:36:06.501848+00	2026-10-27 02:36:06.501848+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
76930cb7-9ec1-40f1-b627-4ade6330ad53	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-26	seed	2026-10-27 02:36:06.495086+00	2026-10-27 02:36:06.495086+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b5c4a0d4-329b-4bc3-80f3-89c2bfe011d6	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-22	seed	2026-10-27 02:36:06.505982+00	2026-10-27 02:36:06.505982+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d9ca5130-4dbe-4f72-85cb-ac7725e020e1	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-24	seed	2026-10-27 02:36:06.498415+00	2026-10-27 02:36:06.498415+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a2466cd9-43bf-4378-984e-facb2f166d06	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-29	seed	2026-10-30 01:54:47.322256+00	2026-10-30 01:54:47.322256+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b5e19ee7-efb8-4dc1-96e5-3db90ee73efe	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-28	seed	2026-10-30 01:54:47.325531+00	2026-10-30 01:54:47.325531+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f7e5ff9f-1b7b-446c-9f7c-707e47075e80	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-30	seed	2026-10-30 01:54:47.216089+00	2026-10-30 01:54:47.216089+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f25f4222-736f-4983-abb5-955d06e9c563	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-31	seed	2026-11-01 03:16:26.665123+00	2026-11-01 03:16:26.665123+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e641954f-3845-4cc0-afab-916a20bade0a	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-02	seed	2026-11-02 01:23:11.554281+00	2026-11-02 01:23:11.554281+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
80627992-ab60-409b-832d-469931a1b215	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-04	seed	2026-11-04 01:36:27.872545+00	2026-11-04 01:36:27.872546+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ff4955a9-de5f-4e82-ad24-4ad3d815f2c7	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-03	seed	2026-11-04 01:36:28.042157+00	2026-11-04 01:36:28.042157+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
dcd72251-83ec-4586-a3c4-caea73b20e07	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-05	seed	2026-11-05 01:19:19.66121+00	2026-11-05 01:19:19.66121+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
0a4801bf-f463-4488-86b9-73f70ccec46a	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-09	seed	2026-11-10 00:02:04.25746+00	2026-11-10 00:02:04.25746+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
70093511-1624-49c2-89d2-fbe3be561b32	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-07	seed	2026-11-10 00:02:04.259457+00	2026-11-10 00:02:04.259457+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7e5cb509-85da-422f-bd00-726eaa8d6336	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-06	seed	2026-11-10 00:02:04.261189+00	2026-11-10 00:02:04.261189+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c69d2647-004b-4fd9-9a83-32b9d56a1e31	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-10	seed	2026-11-10 00:02:04.173593+00	2026-11-10 00:02:04.173593+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1a56a480-b52f-4c5a-a7e9-9bac42f70ccf	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-11	seed	2026-11-11 01:58:25.252108+00	2026-11-11 01:58:25.252108+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
298357cd-064a-4e91-aada-23a183eb95da	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-13	seed	2026-11-13 02:16:17.150186+00	2026-11-13 02:16:17.150186+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2b93b044-4593-4e07-b4f4-38573a61b3af	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-12	seed	2026-11-13 02:16:17.228306+00	2026-11-13 02:16:17.228306+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
961aee66-1959-43ee-adc8-1ab07e3624c9	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-14	seed	2026-11-15 09:40:50.889425+00	2026-11-15 09:40:50.889425+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6e507aaf-c6bd-4ac6-bf42-b31bee14b371	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-16	seed	2026-11-16 03:24:23.385514+00	2026-11-16 03:24:23.385515+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ac4359c1-2a67-4610-bb3d-4fcfc37cd368	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-19	seed	2026-11-19 00:26:04.020966+00	2026-11-19 00:26:04.020967+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e574bbb5-1b32-40ad-80f2-1c62fcf15d62	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-17	seed	2026-11-19 00:26:04.138117+00	2026-11-19 00:26:04.138117+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f73dc64b-8d8e-4563-ac45-6b5bcbad4259	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-18	seed	2026-11-19 00:26:04.128575+00	2026-11-19 00:26:04.128575+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: AuditEvents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditEvents" ("Id", "Actor", "Action", "EntityType", "EntityId", "OldValues", "NewValues", "IpAddress", "OccurredAt", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
0ec8f963-a657-4cc0-8f0d-cd1244273151	unknown	AnnouncementSent	SchoolAnnouncement	e27a75a5-15f6-491f-98cd-5437aa9655ca	\N	{"Audience":"All parents","dispatched":3}	\N	2026-10-16 01:18:22.334132+00	2026-10-16 01:18:22.330975+00	2026-10-16 01:18:22.330975+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
593a8867-da78-4de1-9ff8-97e5ffa2612f	unknown	TeacherAssigned	TeacherAssignment	2f83d18a-d748-4b32-bdcf-84f0212a0cc6	\N	{"EmployeeId":"ad17df02-3c39-4c6b-b1e3-edc0ede71ef2","SubjectId":"9ea6dc93-764d-4d5e-bfdf-171a267ef5ec","SectionId":"e2c738e5-7d63-4e41-ac98-2d546c0adf33"}	\N	2026-10-18 11:32:44.790493+00	2026-10-18 11:32:44.783642+00	2026-10-18 11:32:44.783642+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
142c608b-6ee9-44f9-a69e-74516085c7da	unknown	LeaveApplied	LeaveRequest	ff997bfa-59d9-46ff-b914-0c4f47b6897d	\N	{"EmployeeId":"9d98a8a7-4274-4f2d-9086-7533a8326272","FromDate":"2026-10-19","ToDate":"2026-10-19"}	\N	2026-10-18 12:44:58.915198+00	2026-10-18 12:44:58.910119+00	2026-10-18 12:44:58.910119+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6c4be5cc-967f-41d2-b164-eca5869e2d1e	unknown	LeaveApproved	LeaveRequest	ff997bfa-59d9-46ff-b914-0c4f47b6897d	\N	\N	\N	2026-10-18 12:44:59.123305+00	2026-10-18 12:44:59.123303+00	2026-10-18 12:44:59.123303+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a0a2d4fe-8896-4af2-a78a-86d74be614e5	unknown	LeaveApplied	LeaveRequest	bfc669bd-ce18-4abd-a4e3-514541e663d4	\N	{"EmployeeId":"9d98a8a7-4274-4f2d-9086-7533a8326272","FromDate":"2026-10-19","ToDate":"2026-10-19"}	\N	2026-10-18 12:46:06.771631+00	2026-10-18 12:46:06.767751+00	2026-10-18 12:46:06.767751+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
87a27813-b24e-4f54-95f3-7f54bb13168b	unknown	LeaveApproved	LeaveRequest	bfc669bd-ce18-4abd-a4e3-514541e663d4	\N	\N	\N	2026-10-18 12:46:06.974082+00	2026-10-18 12:46:06.974081+00	2026-10-18 12:46:06.974081+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7ac14aef-9509-41a9-9f37-a2aec13df7fa	unknown	LeaveApplied	LeaveRequest	0b915fe2-625a-4748-bc16-381bdb64695b	\N	{"EmployeeId":"9d98a8a7-4274-4f2d-9086-7533a8326272","FromDate":"2026-10-19","ToDate":"2026-10-19"}	\N	2026-10-18 12:46:59.69599+00	2026-10-18 12:46:59.692618+00	2026-10-18 12:46:59.692618+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
848daf28-21f6-4303-a1c3-809ab6298c70	unknown	LeaveApproved	LeaveRequest	0b915fe2-625a-4748-bc16-381bdb64695b	\N	\N	\N	2026-10-18 12:46:59.793257+00	2026-10-18 12:46:59.793256+00	2026-10-18 12:46:59.793256+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
64c68d33-a9dd-4168-8672-0c99a6014279	unknown	TeacherAssigned	TeacherAssignment	985ffcb0-5661-4a44-a655-78c922cb9124	\N	{"EmployeeId":"ad17df02-3c39-4c6b-b1e3-edc0ede71ef2","SubjectId":"f8612996-26d0-4611-b845-1de1749e2e5d","SectionId":"e2c738e5-7d63-4e41-ac98-2d546c0adf33"}	\N	2026-10-19 02:34:10.400576+00	2026-10-19 02:34:10.395799+00	2026-10-19 02:34:10.395799+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8646db19-ce68-4a4b-a59a-8018f302d6db	unknown	PaymentRecorded	Payment	a0cd0e9c-6446-4dc8-93ca-9a1d50a9a460	\N	{"Amount":100,"Method":"Cash","ReceiptNumber":"RCT-20261119004957-d2b219d2"}	\N	2026-11-19 00:49:57.281598+00	2026-11-19 00:49:57.279518+00	2026-11-19 00:49:57.279518+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
64efdd59-a831-4124-b2be-243db4a942e5	unknown	PaymentRecorded	Payment	cd96f20c-5adf-49ad-9323-7559b4300e3d	\N	{"Amount":100,"Method":"Cash","ReceiptNumber":"RCT-20261119005011-d2b219d2"}	\N	2026-11-19 00:50:11.973897+00	2026-11-19 00:50:11.973647+00	2026-11-19 00:50:11.973647+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Campuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Campuses" ("Id", "SchoolId", "Name", "Address", "IsActive", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
\.


--
-- Data for Name: ClassDiaries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ClassDiaries" ("Id", "SchoolId", "AcademicYearId", "Date", "ClassId", "SectionId", "SubjectId", "EmployeeId", "Mode", "Notes", "Homework", "FileName", "RelativePath", "SubmittedAt", "IsLate", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
eba47591-5177-4bce-b8ff-db2742f67002	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	2026-10-19	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	0	Fractions revision	Ex 4.1 Q1-Q6	\N	\N	2026-10-18 12:47:00.391443+00	t	2026-10-18 12:44:59.800843+00	2026-10-18 12:47:00.44485+00	staff	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
982455e3-d6b8-4cac-a9b2-5773899ebe9e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	2026-11-19	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	9ea6dc93-764d-4d5e-bfdf-171a267ef5ec	ad17df02-3c39-4c6b-b1e3-edc0ede71ef2	1	\N	\N	1779633493742-sample-pdf-a4-size.pdf	e6ccef8b-1d05-485d-89de-0c61792eb71c/87e1bf55-4b87-41d5-bf52-f3f462f88b20/diaries/diary-30b76495b60a42e4ae8ba0daa2c4011a.pdf	2026-11-19 01:14:37.23786+00	f	2026-11-19 01:14:37.170487+00	2026-11-19 01:14:37.170487+00	staff	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Classes" ("Id", "SchoolId", "Name", "SortOrder", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
1fc5f7e4-7aae-4602-ab23-1fffb750ace6	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Grade 8	8	2026-10-12 04:07:14.451886+00	2026-10-12 04:07:14.451886+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
310dc35d-196a-433e-b20d-aab069d535cc	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Grade 9	9	2026-10-12 04:07:14.451887+00	2026-10-12 04:07:14.451887+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3bffe181-4bf0-499c-b271-9f3f7b128f5c	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Grade 5	5	2026-10-12 04:07:14.451841+00	2026-10-12 04:07:14.451841+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6ffaa108-2264-452d-b7f3-65479ece1729	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Grade 6	6	2026-10-12 04:07:14.451883+00	2026-10-12 04:07:14.451883+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a265d576-f5b6-4a17-9515-58071ce0a2ab	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Grade 7	7	2026-10-12 04:07:14.451885+00	2026-10-12 04:07:14.451885+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Departments" ("Id", "SchoolId", "Name", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
567d1d14-ead5-4746-8f42-3156d86a1148	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Teaching	2026-10-12 04:07:14.452866+00	2026-10-12 04:07:14.452866+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
63cea162-aba8-4042-8e74-21f183757624	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Administration	2026-10-12 04:07:14.452892+00	2026-10-12 04:07:14.452892+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a71cd124-1344-448b-8e4b-47ecd25f153b	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Finance	2026-10-12 04:07:14.452894+00	2026-10-12 04:07:14.452894+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
fb72cf3a-550e-4f8d-91ee-b971fe73939c	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Transport	2026-10-12 04:07:14.452893+00	2026-10-12 04:07:14.452893+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Designations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Designations" ("Id", "SchoolId", "Name", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
07edfaaf-d292-45f2-bcb8-470edcd15252	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Accountant	2026-10-12 04:07:14.452937+00	2026-10-12 04:07:14.452937+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
552171b8-3a46-48c2-8104-803eca6781cd	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Driver	2026-10-12 04:07:14.452932+00	2026-10-12 04:07:14.452932+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
94a45842-e188-46b7-9b2b-e8cddb1f144d	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Teacher	2026-10-12 04:07:14.452908+00	2026-10-12 04:07:14.452908+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ee156d63-640d-4e36-b0e3-f2eccfbaab80	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Senior Teacher	2026-10-12 04:07:14.452931+00	2026-10-12 04:07:14.452931+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f53df76c-5139-4519-b30d-62f0ab479ad1	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Office Manager	2026-10-12 04:07:14.452934+00	2026-10-12 04:07:14.452934+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: EmployeeAttendances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmployeeAttendances" ("Id", "EmployeeId", "Date", "CheckIn", "CheckOut", "Source", "Code", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
\.


--
-- Data for Name: Employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Employees" ("Id", "SchoolId", "EmployeeCode", "FirstName", "LastName", "Email", "Phone", "DepartmentId", "DesignationId", "JoiningDate", "Status", "UserId", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId", "BasicSalary", "PhotoUrl") FROM stdin;
78fbc571-83b5-4bca-a8f0-60d40ffa953a	87e1bf55-4b87-41d5-bf52-f3f462f88b20	EMP1004	Imran	Ali	imran.ali@school.edu	\N	fb72cf3a-550e-4f8d-91ee-b971fe73939c	552171b8-3a46-48c2-8104-803eca6781cd	2022-06-01	0	\N	2026-10-16 03:46:56.269376+00	2026-10-16 03:46:56.269376+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	22000	\N
9d98a8a7-4274-4f2d-9086-7533a8326272	87e1bf55-4b87-41d5-bf52-f3f462f88b20	EMP1001	Maya	Iyer	teacher@school.edu	\N	567d1d14-ead5-4746-8f42-3156d86a1148	ee156d63-640d-4e36-b0e3-f2eccfbaab80	2022-06-01	0	d14aface-ba2e-46a6-b45d-9de5c99ac1e5	2026-10-16 03:46:55.618904+00	2026-10-16 03:46:55.618905+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	55000	\N
ac4b7f02-9789-45c2-afcd-e9a50e46c036	87e1bf55-4b87-41d5-bf52-f3f462f88b20	EMP1002	Ravi	Kumar	ravi.kumar@school.edu	\N	567d1d14-ead5-4746-8f42-3156d86a1148	94a45842-e188-46b7-9b2b-e8cddb1f144d	2022-06-01	0	\N	2026-10-16 03:46:56.230454+00	2026-10-16 03:46:56.230454+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	42000	\N
ad17df02-3c39-4c6b-b1e3-edc0ede71ef2	87e1bf55-4b87-41d5-bf52-f3f462f88b20	EMP1003	Anita	Shah	anita.shah@school.edu	\N	a71cd124-1344-448b-8e4b-47ecd25f153b	07edfaaf-d292-45f2-bcb8-470edcd15252	2022-06-01	0	\N	2026-10-16 03:46:56.259605+00	2026-11-03 00:11:14.216722+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	38000	data:image/jpeg;base64,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
\.


--
-- Data for Name: Enquiries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Enquiries" ("Id", "SchoolId", "Kind", "Status", "ParentName", "Phone", "Email", "StudentName", "GradeInterested", "Message", "Source", "AssignedToUserId", "FollowUpOn", "VerifiedAt", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
c5e1e05b-cb6f-4cd8-b019-31b244151024	87e1bf55-4b87-41d5-bf52-f3f462f88b20	0	2	Test Parent	9876543210	parent@example.com	Aarav	Grade 5	Need admission information for next year.	Website	314184ef-5cf0-4589-988d-687eddfd8e3f	2026-10-20	2026-10-18 02:39:01.592774+00	2026-10-18 02:39:01.592179+00	2026-10-18 02:39:45.544256+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
702661fd-b2c2-45be-86c0-9f47f60cd0b2	87e1bf55-4b87-41d5-bf52-f3f462f88b20	0	1	Website Parent	9123456789	web@example.com	\N	Grade 1-5	Need fee details and admission dates.	Website	\N	\N	2026-10-18 02:55:21.814155+00	2026-10-18 02:55:21.813735+00	2026-10-18 02:55:21.813735+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8e2937ed-cb2c-40de-b0cc-7af4c9490d0f	87e1bf55-4b87-41d5-bf52-f3f462f88b20	0	1	hi	9885841719	aa@g	\N		hi	Website	\N	\N	2026-10-18 03:47:08.93282+00	2026-10-18 03:47:08.932818+00	2026-10-18 03:47:08.932818+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8f25f061-0d2f-460a-bd48-3ad96138a6c5	87e1bf55-4b87-41d5-bf52-f3f462f88b20	1	2	sambasivareddy	9160871719	samba@gmail.com	\N	Grade 1–5	hi	Website	314184ef-5cf0-4589-988d-687eddfd8e3f	2026-10-20	2026-10-18 08:30:49.047996+00	2026-10-18 08:30:49.046753+00	2026-10-18 08:35:06.689846+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
67894dbf-83b4-470c-a261-1b0ce91e4c39	87e1bf55-4b87-41d5-bf52-f3f462f88b20	0	1	hi	9160871719	samba@gmail.com	\N	Nursery / KG	hi	Website	\N	\N	2026-11-10 01:52:14.674412+00	2026-11-10 01:52:14.674006+00	2026-11-10 01:52:14.674007+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: EnquiryActivities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EnquiryActivities" ("Id", "EnquiryId", "ActorUserId", "ActorName", "Action", "Note", "OldStatus", "NewStatus", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
2bb217da-0962-4a4c-8c4f-f7ed3493d525	c5e1e05b-cb6f-4cd8-b019-31b244151024	\N	OTP verification	Verified	Verified from IP ::1	\N	New	2026-10-18 02:39:01.592925+00	2026-10-18 02:39:01.592925+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
eeedd1b1-8d03-42c9-a4dd-e708703552b9	c5e1e05b-cb6f-4cd8-b019-31b244151024	314184ef-5cf0-4589-988d-687eddfd8e3f	frontoffice@school.edu	Assigned	Assigned to Neha Kapoor	\N	\N	2026-10-18 02:39:45.448675+00	2026-10-18 02:39:45.448676+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f40c0763-f9d1-49c0-92b1-93193ad685df	c5e1e05b-cb6f-4cd8-b019-31b244151024	314184ef-5cf0-4589-988d-687eddfd8e3f	frontoffice@school.edu	StatusChange	\N	New	Contacted	2026-10-18 02:39:45.541502+00	2026-10-18 02:39:45.541503+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9311b6bf-27dc-42fc-8f34-4582bd7a8068	c5e1e05b-cb6f-4cd8-b019-31b244151024	314184ef-5cf0-4589-988d-687eddfd8e3f	frontoffice@school.edu	Call	Called parent; visit scheduled.	\N	\N	2026-10-18 02:39:45.605222+00	2026-10-18 02:39:45.605222+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
163272a2-1432-4276-8dbb-aee6e4fb158e	702661fd-b2c2-45be-86c0-9f47f60cd0b2	\N	OTP verification	Verified	Verified from IP ::1	\N	New	2026-10-18 02:55:21.814281+00	2026-10-18 02:55:21.814281+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
23626b05-e186-4281-8c54-eee0a1f3acf0	8e2937ed-cb2c-40de-b0cc-7af4c9490d0f	\N	OTP verification	Verified	Verified from IP ::1	\N	New	2026-10-18 03:47:08.93282+00	2026-10-18 03:47:08.93282+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ff33837e-9aa0-42af-ad38-4549fa917be9	8f25f061-0d2f-460a-bd48-3ad96138a6c5	\N	OTP verification	Verified	Verified from IP ::1	\N	New	2026-10-18 08:30:49.048331+00	2026-10-18 08:30:49.048331+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8450d7fa-7b60-484e-98cc-82f5a64e85ca	8f25f061-0d2f-460a-bd48-3ad96138a6c5	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	admin@school.edu	Assigned	Assigned to Neha Kapoor	\N	\N	2026-10-18 08:34:46.704992+00	2026-10-18 08:34:46.704992+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
5765f70a-49da-4ca0-8f24-4dc22fd4f316	8f25f061-0d2f-460a-bd48-3ad96138a6c5	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	admin@school.edu	StatusChange	\N	New	Contacted	2026-10-18 08:35:06.688628+00	2026-10-18 08:35:06.688628+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
cd30555a-2ab5-44c9-8f67-e23cd9e9ef6d	8f25f061-0d2f-460a-bd48-3ad96138a6c5	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	admin@school.edu	Call	follwing up	\N	\N	2026-10-18 08:35:09.454981+00	2026-10-18 08:35:09.454981+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6e9f413f-a08a-4d27-8842-7bb096d2bea9	67894dbf-83b4-470c-a261-1b0ce91e4c39	\N	OTP verification	Verified	Verified from IP 172.19.0.1	\N	New	2026-11-10 01:52:14.674476+00	2026-11-10 01:52:14.674476+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: EnquiryOtpChallenges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EnquiryOtpChallenges" ("Id", "SchoolId", "Phone", "IpAddress", "CodeHash", "ExpiresAt", "VerifyAttempts", "ConsumedAt", "PayloadJson", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
d09cbfd2-621d-4321-8d35-b8180da34166	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9876543210	::1	$2a$11$xh3gq773PYoXFaLvR4B6hOKXRUv9lnDcDe6rdLwERf7TtLWriR8s6	2026-10-18 02:44:00.747439+00	1	2026-10-18 02:39:01.591629+00	{"Kind":0,"ParentName":"Test Parent","Phone":"9876543210","Email":"parent@example.com","StudentName":"Aarav","GradeInterested":"Grade 5","Message":"Need admission information for next year."}	2026-10-18 02:39:00.530937+00	2026-10-18 02:39:01.776504+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2452983e-4f2a-4e7f-b0c2-6cee0b159372	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9123456789	::1	$2a$11$xTNuV6c4P/GALttFCJJa0OEon4BG7mn.UBa3kS5MRpAG/85eVEVh.	2026-10-18 03:00:21.188471+00	1	2026-10-18 02:55:21.813445+00	{"Kind":0,"ParentName":"Website Parent","Phone":"9123456789","Email":"web@example.com","StudentName":null,"GradeInterested":"Grade 1-5","Message":"Need fee details and admission dates."}	2026-10-18 02:55:20.995479+00	2026-10-18 02:55:21.930218+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7261473e-b2e3-4cc0-b115-06b39bbb7b70	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9000011122	::1	$2a$11$wGVEiAb0s1CV3/ixTGQ0ReAy7NLf3GB39ILWqrVYs.hRdbQ9m4Saa	2026-10-18 03:00:44.248459+00	0	\N	{"Kind":0,"ParentName":"Kiran Reddy","Phone":"9000011122","Email":"kiran@example.com","StudentName":null,"GradeInterested":"","Message":"Interested in Grade 3 admission."}	2026-10-18 02:55:44.036256+00	2026-10-18 02:55:44.036256+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e004246b-64e9-4932-9714-aafdf50b9c85	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9885841719	::1	$2a$11$sui1L3H0mux/EQgrtI6Ude6MeKXl3sXepNyiH82ZDzOuqga.PidyS	2026-10-18 03:23:29.293993+00	0	\N	{"Kind":1,"ParentName":"hi","Phone":"9885841719","Email":"aa@g","StudentName":null,"GradeInterested":"Nursery / KG","Message":"hi"}	2026-10-18 03:18:29.036286+00	2026-10-18 03:18:29.036286+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e5734f43-0cb0-4f8f-a940-f94a91d0d390	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9885841719	::1	$2a$11$xyq5V1kCSEi2pB89klhpqegpyb9E0Ttj5iSyFm/lUCtCdxz6q9fk6	2026-10-18 03:52:00.680243+00	1	2026-10-18 03:47:08.932811+00	{"Kind":0,"ParentName":"hi","Phone":"9885841719","Email":"aa@g","StudentName":null,"GradeInterested":"","Message":"hi"}	2026-10-18 03:47:00.409372+00	2026-10-18 03:47:08.933712+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c2773d3a-f080-4061-a444-8be3d147396e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9160871719	::1	$2a$11$bD9eeJHXMjLLZy35oXnR5uvaVryvxFrVNopfQDBSDJRq0EmfuBeq.	2026-10-18 08:35:40.252306+00	1	2026-10-18 08:30:49.046591+00	{"Kind":1,"ParentName":"sambasivareddy","Phone":"9160871719","Email":"samba@gmail.com","StudentName":null,"GradeInterested":"Grade 1\\u20135","Message":"hi"}	2026-10-18 08:30:39.810498+00	2026-10-18 08:30:49.172336+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
70cd79a3-dd7a-4600-8524-146edea13dac	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9876543210	172.19.0.1	$2a$11$4EuCucT7kor/A1ycFh7V4uYc/kwFYBZJNEgtC5c37bpmOLzeR9of6	2026-11-05 01:47:28.908183+00	0	\N	{"Kind":0,"ParentName":"Test Parent","Phone":"9876543210","Email":"parent@example.com","StudentName":null,"GradeInterested":"Grade 5","Message":"Website enquiry check"}	2026-11-05 01:42:28.699186+00	2026-11-05 01:42:28.699186+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f69ad02e-2169-4ec5-bb0a-b86533a71f1c	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9160871719	172.19.0.1	$2a$11$aQqmzlkYrtzSZzdRuj8uCeQfAWpnbZXhTkcXPdtvZZcLVaPuY.iJC	2026-11-10 01:57:05.55116+00	1	2026-11-10 01:52:14.673938+00	{"Kind":0,"ParentName":"hi","Phone":"9160871719","Email":"samba@gmail.com","StudentName":null,"GradeInterested":"Nursery / KG","Message":"hi"}	2026-11-10 01:52:05.369246+00	2026-11-10 01:52:14.729352+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Examinations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Examinations" ("Id", "SchoolId", "AcademicYearId", "Name", "Term", "IsPublished", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
104362e6-98d7-4dcc-9d0c-7cf0be6a0da4	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	Term 1 Assessment	Term 1	t	2026-10-16 03:46:59.013578+00	2026-10-16 03:46:59.013578+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: FeeCategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FeeCategories" ("Id", "SchoolId", "Name", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
02587910-f19c-4239-a330-a61348a660e5	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Examination Fee	2026-10-12 04:07:14.452972+00	2026-10-12 04:07:14.452972+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
24cb6755-053d-4c67-bf10-f5e8c3c70a45	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Transport Fee	2026-10-12 04:07:14.452971+00	2026-10-12 04:07:14.452971+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3a572c78-86f6-4eed-bce2-1bcf474a618e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Tuition Fee	2026-10-12 04:07:14.452948+00	2026-10-12 04:07:14.452948+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4433f97b-24d1-4a8c-9c5c-e4b55e23dc0e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Activity Fee	2026-10-12 04:07:14.452973+00	2026-10-12 04:07:14.452973+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: FeeStructures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FeeStructures" ("Id", "SchoolId", "AcademicYearId", "ClassId", "FeeCategoryId", "Amount", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
\.


--
-- Data for Name: Guardians; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Guardians" ("Id", "FirstName", "LastName", "Phone", "Email", "UserId", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
2bc239c1-edc3-4ab7-a13b-bad2700f91b6	Priya	Mehta	+910000000000	parent@school.edu	5d7da75c-90d2-4051-86ea-083ce0cd2b88	2026-10-15 03:09:19.05094+00	2026-10-15 03:09:19.05094+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
73a6b99a-13e8-4bc8-a1b9-f3aba24811fb	Meera	Shah	9876500123	meera.shah@example.com	\N	2026-10-18 11:32:44.003867+00	2026-10-18 11:32:44.003867+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
456d2665-1b89-4507-80b4-867d21299367	Anjali	Iyer	9876500999		\N	2026-10-19 02:12:21.9398+00	2026-10-19 02:12:21.9398+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
514b156f-102e-444e-ac2c-03abbdc21a1f	samba		9160871719	nssreddy@live.com	\N	2026-10-20 05:23:22.793818+00	2026-10-20 05:23:22.793818+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e25445bb-093d-44b5-beaf-35d8cf750c9c	samba		9160871719	nssreddy@live.com	\N	2026-11-10 01:26:04.298252+00	2026-11-10 01:26:04.298252+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: HomeworkSubmissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."HomeworkSubmissions" ("Id", "HomeworkId", "StudentId", "SubmittedAt", "FeedbackByTeacher", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
\.


--
-- Data for Name: Homeworks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Homeworks" ("Id", "SchoolId", "TeacherAssignmentId", "Title", "Instructions", "IssueDate", "DueDate", "IsPublished", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
fc3076da-fc17-41b1-a6fc-2fd1b6dfd60b	87e1bf55-4b87-41d5-bf52-f3f462f88b20	5ea0d860-a55e-4e44-9754-e33c85da77f4	Fractions worksheet	Complete exercise 4.2	2026-10-14	2026-10-19	t	2026-10-16 03:46:58.799381+00	2026-10-16 03:46:58.799381+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
80209e93-6b6e-4a3d-a0ce-3fdb514c70e8	87e1bf55-4b87-41d5-bf52-f3f462f88b20	459314db-bb64-4ae7-a801-539cddd11a50	mathc	complte	2026-10-20	2026-10-22	t	2026-10-20 05:20:46.083897+00	2026-10-20 05:20:46.083898+00	unknown	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: IntegrationSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."IntegrationSettings" ("Id", "SchoolId", "ProviderKey", "ProviderName", "IsEnabled", "IsSandbox", "ConfigJson", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
0055db6e-b507-4799-b842-0610be9219df	87e1bf55-4b87-41d5-bf52-f3f462f88b20	google_calendar	Google Calendar / Workspace	t	t	{"clientId":"dummy-google-client-id.apps.googleusercontent.com","clientSecret":"DUMMY_GOOGLE_CLIENT_SECRET_REPLACE_ME","calendarId":"primary"}	2026-10-16 01:15:02.810357+00	2026-10-16 01:15:02.810357+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
03b5629d-2203-4e6a-8000-0a40ef26b989	87e1bf55-4b87-41d5-bf52-f3f462f88b20	fcm	Web / mobile push (FCM)	t	t	{"projectId":"schoolerp-dummy","serverKey":"DUMMY_FCM_SERVER_KEY_REPLACE_ME"}	2026-10-16 01:15:02.810456+00	2026-10-16 01:15:02.810456+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
077fb746-0cbb-4903-b112-2804ce712965	87e1bf55-4b87-41d5-bf52-f3f462f88b20	whatsapp	WhatsApp Business (Meta Cloud)	t	t	{"provider":"meta_cloud","phoneNumberId":"000000000000000","businessAccountId":"000000000000000","accessToken":"DUMMY_WHATSAPP_ACCESS_TOKEN_REPLACE_ME","templateName":"school_notice"}	2026-10-16 01:15:02.810263+00	2026-10-16 01:15:02.810263+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8dd111af-e269-40b0-bce0-cfefd2d1fded	87e1bf55-4b87-41d5-bf52-f3f462f88b20	google_maps	Google Maps Platform	t	t	{"apiKey":"DUMMY_GOOGLE_MAPS_API_KEY_REPLACE_ME","mapId":"DEMO_MAP_ID","libraries":"places,geometry"}	2026-10-16 01:15:02.810319+00	2026-10-16 01:15:02.810319+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a47ded1e-6905-4d5f-ae6f-795649cc8188	87e1bf55-4b87-41d5-bf52-f3f462f88b20	payments	Online fees (Razorpay test)	t	t	{"provider":"razorpay","keyId":"rzp_test_DUMMYKEYID","keySecret":"DUMMY_RAZORPAY_KEY_SECRET_REPLACE_ME"}	2026-10-16 01:15:02.810396+00	2026-10-16 01:15:02.810397+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a57dee8f-39ce-46f7-aa53-de70cfdad6b6	87e1bf55-4b87-41d5-bf52-f3f462f88b20	email	Transactional email (SMTP)	t	t	{"provider":"smtp","host":"smtp.school-placeholder.invalid","port":587,"username":"noreply@school-placeholder.invalid","password":"REPLACE_WITH_SCHOOL_SMTP_PASSWORD","fromName":"Bright Future International School","fromAddress":"noreply@school-placeholder.invalid","useStartTls":true}	2026-10-16 01:15:02.766961+00	2026-10-16 01:15:02.766962+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ca2131d2-932f-4e3f-b697-effcfc7602ce	87e1bf55-4b87-41d5-bf52-f3f462f88b20	sms	SMS gateway	t	t	{"provider":"msg91","apiKey":"DUMMY_SMS_API_KEY_REPLACE_ME","senderId":"SCHERP","dltTemplateId":"DUMMY_DLT_TEMPLATE_ID","countryCode":"91"}	2026-10-16 01:15:02.809997+00	2026-10-16 01:15:02.809997+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: LeaveRequests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeaveRequests" ("Id", "EmployeeId", "LeaveTypeId", "FromDate", "ToDate", "Reason", "Status", "ApprovedBy", "ApprovedAt", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
ff997bfa-59d9-46ff-b914-0c4f47b6897d	9d98a8a7-4274-4f2d-9086-7533a8326272	76dd1e0a-8079-4edc-a847-5b9b71c5b670	2026-10-19	2026-10-19	Smoke leave	Approved	unknown	2026-10-18 12:44:59.005363+00	2026-10-18 12:44:58.837866+00	2026-10-18 12:44:59.005523+00	unknown	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
bfc669bd-ce18-4abd-a4e3-514541e663d4	9d98a8a7-4274-4f2d-9086-7533a8326272	76dd1e0a-8079-4edc-a847-5b9b71c5b670	2026-10-19	2026-10-19	Smoke leave	Approved	unknown	2026-10-18 12:46:06.913613+00	2026-10-18 12:46:06.690152+00	2026-10-18 12:46:06.91379+00	unknown	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
0b915fe2-625a-4748-bc16-381bdb64695b	9d98a8a7-4274-4f2d-9086-7533a8326272	76dd1e0a-8079-4edc-a847-5b9b71c5b670	2026-10-19	2026-10-19	Smoke leave	Approved	unknown	2026-10-18 12:46:59.762336+00	2026-10-18 12:46:59.616376+00	2026-10-18 12:46:59.76253+00	unknown	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: LeaveTypes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeaveTypes" ("Id", "SchoolId", "Name", "MaxDaysPerYear", "IsCarryForward", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
76dd1e0a-8079-4edc-a847-5b9b71c5b670	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Earned Leave	15	t	2026-10-16 01:15:02.706708+00	2026-10-16 01:15:02.706708+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d1977f83-1e21-4c6c-be7c-661291e3cea4	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Sick Leave	10	f	2026-10-16 01:15:02.706707+00	2026-10-16 01:15:02.706707+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
da0b5591-3882-471e-95ba-28e2291fd4b3	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Casual Leave	12	f	2026-10-16 01:15:02.706523+00	2026-10-16 01:15:02.706524+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: MarkEntries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MarkEntries" ("Id", "ExaminationId", "StudentId", "SubjectId", "MarksObtained", "MaxMarks", "IsAbsent", "Remarks", "IsApproved", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
224e2ac8-f93f-469b-ab9a-35b483a308c9	104362e6-98d7-4dcc-9d0c-7cf0be6a0da4	d2b219d2-e689-4088-b943-2704584f82ea	01321fba-cecf-4b52-a929-d661331a21e6	78	100	f	\N	t	2026-10-16 03:46:59.233503+00	2026-10-16 03:46:59.233503+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2454e489-7489-4ba6-b721-509120ace4bf	104362e6-98d7-4dcc-9d0c-7cf0be6a0da4	9d57d8a2-fc65-44ef-8025-b3d4be391ae0	01321fba-cecf-4b52-a929-d661331a21e6	88	100	f	\N	t	2026-10-16 03:46:59.132768+00	2026-10-16 03:46:59.132769+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2ae94933-d5d3-4415-99e1-778b9df2b12c	104362e6-98d7-4dcc-9d0c-7cf0be6a0da4	67557cfc-aec9-4812-a65a-439ba467ceee	01321fba-cecf-4b52-a929-d661331a21e6	80	100	f	\N	t	2026-10-16 03:46:59.233318+00	2026-10-16 03:46:59.233318+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
98be2936-9a58-4c8d-b333-91260b5bfc7c	104362e6-98d7-4dcc-9d0c-7cf0be6a0da4	50eafd3b-e33e-466e-8f14-c977ec0cf85d	01321fba-cecf-4b52-a929-d661331a21e6	85	100	f	\N	t	2026-10-16 03:46:59.233679+00	2026-10-16 03:46:59.233679+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e7254daf-45a0-47f2-babb-6655416db248	104362e6-98d7-4dcc-9d0c-7cf0be6a0da4	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	01321fba-cecf-4b52-a929-d661331a21e6	79	100	f	\N	t	2026-10-16 03:46:59.233068+00	2026-10-16 03:46:59.233068+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
fd6d74e5-3adf-4a77-b519-51b41f05e9ca	104362e6-98d7-4dcc-9d0c-7cf0be6a0da4	ae9724fd-b9ea-484f-87cb-6583084d0384	01321fba-cecf-4b52-a929-d661331a21e6	74	100	f	\N	t	2026-10-16 03:46:59.233842+00	2026-10-16 03:46:59.233842+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: NotificationMessages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NotificationMessages" ("Id", "SchoolId", "Title", "Body", "Channel", "RecipientRef", "Status", "RetryCount", "SentAt", "ErrorDetails", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId", "Provider", "ProviderMessageId", "TemplateKey") FROM stdin;
e832b462-fc63-4fe3-a363-a3328d7c8714	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Sandbox integration test	Test message from School ERP via Transactional email (SMTP). No live provider was called.	1	test|parent@school.edu	SandboxSent	0	2026-10-16 01:18:22.136381+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-16 01:18:22.135169+00	2026-10-16 01:18:22.13517+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_98e91be9591440bd947b4577925cfe7a	integration.test
2a47e330-5b58-4861-be56-9d7ade27ab0e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Sandbox notice	Welcome to the parent portal.	0	2bc239c1-edc3-4ab7-a13b-bad2700f91b6|2bc239c1-edc3-4ab7-a13b-bad2700f91b6	SandboxSent	0	2026-10-16 01:18:22.317982+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-16 01:18:22.317979+00	2026-10-16 01:18:22.31798+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_6ae38483b31e4d23b6e2d90f4d671bd6	announcement
466aab08-1258-4050-8d91-1c521df61ca6	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Sandbox notice	Welcome to the parent portal.	1	2bc239c1-edc3-4ab7-a13b-bad2700f91b6|parent@school.edu	SandboxSent	0	2026-10-16 01:18:22.318212+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-16 01:18:22.31821+00	2026-10-16 01:18:22.318211+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_2a5d9e3b387949eaa0f2b37c8e61745a	announcement
e95f0953-ad16-4131-b3e8-3acba23db893	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Sandbox notice	Welcome to the parent portal.	2	2bc239c1-edc3-4ab7-a13b-bad2700f91b6|+910000000000	SandboxSent	0	2026-10-16 01:18:22.318509+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-16 01:18:22.318507+00	2026-10-16 01:18:22.318508+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	sms	dummy_sms_fcc8d62f0d794ec593104934c9b23e4a	announcement
18d3dd8d-1d5b-4865-a20b-c69d989bd4ca	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Sandbox integration test	Test message from School ERP via Transactional email (SMTP). No live provider was called.	1	test|parent@school.edu	SandboxSent	0	2026-10-16 01:19:40.251072+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-16 01:19:40.251071+00	2026-10-16 01:19:40.251071+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_9ff59b70982a4d2cbde2a20ae562e38b	integration.test
162d5bfc-f295-435a-932a-a03bf829cf32	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 933201. It expires in 5 minutes.	2	9876543210|9876543210	SandboxSent	0	2026-10-18 02:39:01.002945+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.002516+00	2026-10-18 02:39:01.002517+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	sms	dummy_sms_f3bb2548e6cc4fdbbf0b46c6b612713e	enquiry.otp
6ce7e8ad-93aa-43b4-95e4-8c353557f1c6	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 933201. It expires in 5 minutes.	3	9876543210|9876543210	SandboxSent	0	2026-10-18 02:39:01.064103+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.064101+00	2026-10-18 02:39:01.064101+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_e0324375f2494e109101657faaa399d9	enquiry.otp
27bc5bca-222f-46dc-ae7d-4780c54e34d4	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Test Parent (9876543210) — Need admission information for next year.	3	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|+910000000000	SandboxSent	0	2026-10-18 02:39:01.976428+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.976428+00	2026-10-18 02:39:01.976428+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_e3c9f5af28714cf7993b183c1c0ea2fd	enquiry.verified
29ef4d9a-b3af-47b8-b884-a019e883b690	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Test Parent (9876543210) — Need admission information for next year.	1	314184ef-5cf0-4589-988d-687eddfd8e3f|frontoffice@school.edu	SandboxSent	0	2026-10-18 02:39:01.976023+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.97602+00	2026-10-18 02:39:01.97602+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_c7c2368d603f41a0a5a67c7f42ce5ece	enquiry.verified
9bc24ef8-9330-4949-9b70-40e97acd2575	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Test Parent (9876543210) — Need admission information for next year.	3	314184ef-5cf0-4589-988d-687eddfd8e3f|+910000000000	SandboxSent	0	2026-10-18 02:39:01.976244+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.976243+00	2026-10-18 02:39:01.976243+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_02b49772097d44c785104349f91177ef	enquiry.verified
a87a252e-7204-4ba6-aed0-bcd279943246	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Test Parent (9876543210) — Need admission information for next year.	0	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-10-18 02:39:01.976324+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.976323+00	2026-10-18 02:39:01.976323+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_f7d9a59356084deca6a7b9c471812a96	enquiry.verified
b8a061bb-1f00-4d1f-95c9-e3765788b33d	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Test Parent (9876543210) — Need admission information for next year.	4	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-10-18 02:39:01.976463+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.976462+00	2026-10-18 02:39:01.976462+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_ec23f1e22abb44cdb15eef636d1c5c3c	enquiry.verified
b8a2acd4-ea5d-46b7-b7cc-757cc3277c44	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Test Parent (9876543210) — Need admission information for next year.	0	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-10-18 02:39:01.976492+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.976492+00	2026-10-18 02:39:01.976492+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_bca76f3a2334442cb462503286c2adfc	enquiry.verified
e8cdb91f-0fe3-4549-942d-516336c70e56	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Test Parent (9876543210) — Need admission information for next year.	1	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|admin@school.edu	SandboxSent	0	2026-10-18 02:39:01.976385+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.976385+00	2026-10-18 02:39:01.976385+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_fd5e241736e147c499ce81e71ca4d8b1	enquiry.verified
f4f91c4a-7635-4276-85b1-bbb4fdbfd6b9	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Test Parent (9876543210) — Need admission information for next year.	4	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-10-18 02:39:01.976294+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:39:01.976293+00	2026-10-18 02:39:01.976293+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_48a11800704c4955b4778678518bc781	enquiry.verified
c7e6f25a-0a80-4065-b883-7aa27c6b2414	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 551256. It expires in 5 minutes.	2	9123456789|9123456789	SandboxSent	0	2026-10-18 02:55:21.370868+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:21.370473+00	2026-10-18 02:55:21.370474+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	sms	dummy_sms_e69343a886994f1791a486d372128480	enquiry.otp
e00086db-71bc-49e9-a28b-1a730e7e8b29	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 551256. It expires in 5 minutes.	3	9123456789|9123456789	SandboxSent	0	2026-10-18 02:55:21.400771+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:21.400767+00	2026-10-18 02:55:21.400768+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_6c88311d2b2f435bbe53faf2b919c912	enquiry.otp
1e655d6d-257a-4d18-96bd-938d9e0fdea8	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Website Parent (9123456789) — Need fee details and admission dates.	3	314184ef-5cf0-4589-988d-687eddfd8e3f|+910000000000	SandboxSent	0	2026-10-18 02:55:22.103834+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:22.103833+00	2026-10-18 02:55:22.103833+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_a728d48865dc4584a699acc1ddc9735c	enquiry.verified
2300e1bd-b1e7-40ad-9e8d-c5fe8562343d	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Website Parent (9123456789) — Need fee details and admission dates.	3	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|+910000000000	SandboxSent	0	2026-10-18 02:55:22.103998+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:22.103998+00	2026-10-18 02:55:22.103998+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_be0bd191989f48c3a9eb175fb3947dba	enquiry.verified
40bf12be-4019-4a95-86d0-cc5f49d56ece	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Website Parent (9123456789) — Need fee details and admission dates.	0	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-10-18 02:55:22.103914+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:22.103914+00	2026-10-18 02:55:22.103914+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_9b921cec32a14127a1963797ee47e71a	enquiry.verified
48d32123-c672-4cb0-865c-0c4483c6f911	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Website Parent (9123456789) — Need fee details and admission dates.	4	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-10-18 02:55:22.104027+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:22.104027+00	2026-10-18 02:55:22.104027+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_7dbf100b2c0d481a965786d12c992c74	enquiry.verified
51cf7610-9705-491c-bf8f-993939312353	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Website Parent (9123456789) — Need fee details and admission dates.	0	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-10-18 02:55:22.10405+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:22.10405+00	2026-10-18 02:55:22.10405+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_af8f9582069341a595a973a52a395bb9	enquiry.verified
b70dee33-4580-4614-aa78-8af991005b8f	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Website Parent (9123456789) — Need fee details and admission dates.	4	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-10-18 02:55:22.103878+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:22.103877+00	2026-10-18 02:55:22.103877+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_7028fd606cec49c4a289616dfd55b419	enquiry.verified
d3d667df-4a82-44af-9dff-61659848c1f2	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Website Parent (9123456789) — Need fee details and admission dates.	1	314184ef-5cf0-4589-988d-687eddfd8e3f|frontoffice@school.edu	SandboxSent	0	2026-10-18 02:55:22.103666+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:22.103664+00	2026-10-18 02:55:22.103665+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_39efa22b44a045a5888b5d69f2fb4fc6	enquiry.verified
f538d241-daad-492e-a57b-a2e5bfa03834	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	Website Parent (9123456789) — Need fee details and admission dates.	1	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|admin@school.edu	SandboxSent	0	2026-10-18 02:55:22.10396+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:22.10396+00	2026-10-18 02:55:22.10396+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_e1445fd5a6ae45d5a92a44e5b2134ef1	enquiry.verified
14858b80-ed47-4901-b193-8a709a3036be	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 344625. It expires in 5 minutes.	3	9000011122|9000011122	SandboxSent	0	2026-10-18 02:55:44.256961+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:44.25696+00	2026-10-18 02:55:44.25696+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_c0ed05f0162340c3855b56b8b61fc664	enquiry.otp
c9db726d-c738-4b62-bc4a-9a2e3e287e47	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 344625. It expires in 5 minutes.	2	9000011122|9000011122	SandboxSent	0	2026-10-18 02:55:44.256842+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 02:55:44.25684+00	2026-10-18 02:55:44.25684+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	sms	dummy_sms_ee717e7ef82c452fbafe447a037301a7	enquiry.otp
87feea14-63ec-490f-b678-1d620d1fa8f9	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 296988. It expires in 5 minutes.	2	9885841719|9885841719	SandboxSent	0	2026-10-18 03:18:29.30248+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:18:29.302474+00	2026-10-18 03:18:29.302474+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	sms	dummy_sms_8c00b590ff9548b3831bad729873d742	enquiry.otp
a2be07f1-edc3-4007-9af3-b8989a129b0a	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 296988. It expires in 5 minutes.	3	9885841719|9885841719	SandboxSent	0	2026-10-18 03:18:29.302747+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:18:29.302745+00	2026-10-18 03:18:29.302746+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_ead56a08b54b47948738527e9196a897	enquiry.otp
a8a84a3d-d488-46b7-b6e3-d8abc86187b5	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 672418. It expires in 5 minutes.	3	9885841719|9885841719	SandboxSent	0	2026-10-18 03:47:00.691614+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:00.691613+00	2026-10-18 03:47:00.691613+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_2b91d92383d34097bac1401488cc154a	enquiry.otp
ee54f316-c676-41a1-bf66-d859316fdc88	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 672418. It expires in 5 minutes.	2	9885841719|9885841719	SandboxSent	0	2026-10-18 03:47:00.691421+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:00.691419+00	2026-10-18 03:47:00.691419+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	sms	dummy_sms_6a3e631a74644f5f93fb622a1fa4a15a	enquiry.otp
0677a2a1-1415-44c1-83a2-57745a70f3c6	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9885841719) — hi	3	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|+910000000000	SandboxSent	0	2026-10-18 03:47:08.953655+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:08.953654+00	2026-10-18 03:47:08.953654+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_c13ad77395f44b53999760e0efb0cda4	enquiry.verified
31464796-06e3-400c-89e7-db8aa4eaf0c1	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9885841719) — hi	3	314184ef-5cf0-4589-988d-687eddfd8e3f|+910000000000	SandboxSent	0	2026-10-18 03:47:08.953414+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:08.953412+00	2026-10-18 03:47:08.953412+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_91bf642e8c1d49fe883cc5ba5b131563	enquiry.verified
5d800c4c-1eec-4c27-9c9d-65b16c98ab46	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9885841719) — hi	0	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-10-18 03:47:08.953739+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:08.953739+00	2026-10-18 03:47:08.953739+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_3cdb48b9dd924e6c81976ecd0bba0688	enquiry.verified
994b9da9-dc64-4f61-9d0b-f7093bc3b8a1	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9885841719) — hi	4	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-10-18 03:47:08.953515+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:08.953514+00	2026-10-18 03:47:08.953514+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_da6f9348dce943408fd707721c953774	enquiry.verified
ab1f2c30-a7aa-4c87-81ba-f988ffe9a5b4	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9885841719) — hi	4	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-10-18 03:47:08.953698+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:08.953697+00	2026-10-18 03:47:08.953697+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_ee6d5dfda0174f6592124df3ccbefd0d	enquiry.verified
bde579aa-17a5-4dd9-ae98-1dcfd45c5e32	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9885841719) — hi	1	314184ef-5cf0-4589-988d-687eddfd8e3f|frontoffice@school.edu	SandboxSent	0	2026-10-18 03:47:08.9531+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:08.953099+00	2026-10-18 03:47:08.953099+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_0a2657efa1a04709b457b82ae6d8af1d	enquiry.verified
ccd7e3ed-330b-4642-808d-d6f6ad60daf7	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9885841719) — hi	1	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|admin@school.edu	SandboxSent	0	2026-10-18 03:47:08.953612+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:08.953607+00	2026-10-18 03:47:08.953607+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_7928888239bb4f43a4d54f6884c9e6d1	enquiry.verified
db0f2b3b-750d-4c3e-a9f5-14c11ed3cd30	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9885841719) — hi	0	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-10-18 03:47:08.953563+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 03:47:08.953562+00	2026-10-18 03:47:08.953562+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_4bafc6d054c34c86bdd968aa1ff321ae	enquiry.verified
8320de8f-419f-4c21-a2fe-b47657cbe000	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 465254. It expires in 5 minutes.	2	9160871719|9160871719	SandboxSent	0	2026-10-18 08:30:40.592736+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:40.591845+00	2026-10-18 08:30:40.591845+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	sms	dummy_sms_95cc0d8c75d24598a54e2d1aee715ac2	enquiry.otp
8923cc64-12e3-4476-ba27-b514c29301b5	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 465254. It expires in 5 minutes.	3	9160871719|9160871719	SandboxSent	0	2026-10-18 08:30:40.649046+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:40.649044+00	2026-10-18 08:30:40.649044+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_2756e85fb7e74ce6961c5de35d99ae54	enquiry.otp
0eebc615-a6f9-4b18-a73d-876d58a7e312	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Fees enquiry	sambasivareddy (9160871719) — hi	0	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-10-18 08:30:49.270065+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:49.270064+00	2026-10-18 08:30:49.270064+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_0e4f899824c94b9c96e15176d8a63bc1	enquiry.verified
1bea752c-8b24-4d1f-b1c7-7bf292386a96	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Fees enquiry	sambasivareddy (9160871719) — hi	4	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-10-18 08:30:49.270006+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:49.270005+00	2026-10-18 08:30:49.270006+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_67e3e75c2f564a878b6a25f80458c4ad	enquiry.verified
449100fa-5056-434b-afca-653fcb661dc4	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Fees enquiry	sambasivareddy (9160871719) — hi	1	314184ef-5cf0-4589-988d-687eddfd8e3f|frontoffice@school.edu	SandboxSent	0	2026-10-18 08:30:49.269243+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:49.26924+00	2026-10-18 08:30:49.26924+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_3f439401f5414e8da92d3e378ff1954e	enquiry.verified
79bc1602-8f8e-499e-ad4d-e9c351c4504e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Fees enquiry	sambasivareddy (9160871719) — hi	4	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-10-18 08:30:49.269684+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:49.269683+00	2026-10-18 08:30:49.269683+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_de636f5267724f34a47511aec5a16086	enquiry.verified
954cec6e-0615-4da5-9ceb-2f746facfbf0	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Fees enquiry	sambasivareddy (9160871719) — hi	3	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|+910000000000	SandboxSent	0	2026-10-18 08:30:49.269949+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:49.269948+00	2026-10-18 08:30:49.269948+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_3c5476b82508415bbb3640d8c4995dd0	enquiry.verified
c2d6d87b-4aaf-4330-8005-7c6d46398656	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Fees enquiry	sambasivareddy (9160871719) — hi	0	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-10-18 08:30:49.269734+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:49.269733+00	2026-10-18 08:30:49.269734+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_17c335b57c8b484099607295c6ee35c5	enquiry.verified
e43e7748-7049-4b93-bb4e-77163d17ebd0	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Fees enquiry	sambasivareddy (9160871719) — hi	3	314184ef-5cf0-4589-988d-687eddfd8e3f|+910000000000	SandboxSent	0	2026-10-18 08:30:49.269601+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:49.269599+00	2026-10-18 08:30:49.269599+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_d4e192bf35cd4ac1b1de3f91eda2daf7	enquiry.verified
f4df20a9-4ccc-4f9a-a4ea-ee57b15a83aa	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Fees enquiry	sambasivareddy (9160871719) — hi	1	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|admin@school.edu	SandboxSent	0	2026-10-18 08:30:49.269872+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 08:30:49.269871+00	2026-10-18 08:30:49.269871+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_8fdf15e8ab5f4f1ea8c5d048f38437db	enquiry.verified
1729f4db-9795-4317-b55b-860a678737dc	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Leave approved	Your leave from 19 Oct to 19 Oct was approved.	0	9d98a8a7-4274-4f2d-9086-7533a8326272|9d98a8a7-4274-4f2d-9086-7533a8326272	SandboxSent	0	2026-10-18 12:44:59.227628+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 12:44:59.227626+00	2026-10-18 12:44:59.227627+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_3139fe05099f4ca9bf16fceae52d6a98	leave.decision
5cdb0898-308d-41bb-b0a3-92ab99d2cb21	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Leave approved	Your leave from 19 Oct to 19 Oct was approved.	1	9d98a8a7-4274-4f2d-9086-7533a8326272|teacher@school.edu	SandboxSent	0	2026-10-18 12:44:59.191588+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 12:44:59.191288+00	2026-10-18 12:44:59.191289+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_db0fb149d7c448bbbeb3455f112f15ce	leave.decision
01ee5b22-4a56-45c8-9ed1-3d02794ec7f8	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Leave approved	Your leave from 19 Oct to 19 Oct was approved.	1	9d98a8a7-4274-4f2d-9086-7533a8326272|teacher@school.edu	SandboxSent	0	2026-10-18 12:46:07.05638+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 12:46:07.056069+00	2026-10-18 12:46:07.056069+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_1bc23459361f4ccc8f0ad3aef1d735c7	leave.decision
b2c2e8c2-6d83-45f0-8562-972584545e95	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Leave approved	Your leave from 19 Oct to 19 Oct was approved.	0	9d98a8a7-4274-4f2d-9086-7533a8326272|9d98a8a7-4274-4f2d-9086-7533a8326272	SandboxSent	0	2026-10-18 12:46:07.099387+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 12:46:07.099385+00	2026-10-18 12:46:07.099386+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_f07bb0ee78b64b6c829fc11d6e86ba91	leave.decision
d5c3d00d-fb03-4b0f-9604-d8648f714517	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Leave approved	Your leave from 19 Oct to 19 Oct was approved.	0	9d98a8a7-4274-4f2d-9086-7533a8326272|9d98a8a7-4274-4f2d-9086-7533a8326272	SandboxSent	0	2026-10-18 12:46:59.91093+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 12:46:59.910923+00	2026-10-18 12:46:59.910927+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_b274d14981024a0e9d990326065f90c0	leave.decision
f9bad65f-0966-4c3a-bb95-5fc93898a1ca	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Leave approved	Your leave from 19 Oct to 19 Oct was approved.	1	9d98a8a7-4274-4f2d-9086-7533a8326272|teacher@school.edu	SandboxSent	0	2026-10-18 12:46:59.871223+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-18 12:46:59.870924+00	2026-10-18 12:46:59.870924+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_4019d7fb1b204653a4ac449df2eb1ca6	leave.decision
1b76da2c-6a63-40bd-8f92-10e5572ed73a	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New homework	mathc is due 22 Oct 2026.	0	2bc239c1-edc3-4ab7-a13b-bad2700f91b6|2bc239c1-edc3-4ab7-a13b-bad2700f91b6	SandboxSent	0	2026-10-20 05:20:46.304465+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-20 05:20:46.302648+00	2026-10-20 05:20:46.302649+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_3805712c42a441828a23196e6e5676b6	homework.published
ffea667e-f487-4582-8584-66771cfaa2bf	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New homework	mathc is due 22 Oct 2026.	1	2bc239c1-edc3-4ab7-a13b-bad2700f91b6|parent@school.edu	SandboxSent	0	2026-10-20 05:20:46.369235+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-10-20 05:20:46.369231+00	2026-10-20 05:20:46.369232+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_4f3c411131234b8880eb1a3e11392eb5	homework.published
49e7a4e9-b7a6-42d0-b389-62176ec1bd81	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 626030. It expires in 5 minutes.	3	9876543210|9876543210	SandboxSent	0	2026-11-05 01:42:29.095168+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-05 01:42:29.095166+00	2026-11-05 01:42:29.095166+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_5e90798500a443cca5f964a2a6687c03	enquiry.otp
acc3aa07-b4be-4ff0-879a-db40cbbc16fb	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 626030. It expires in 5 minutes.	2	9876543210|9876543210	SandboxSent	0	2026-11-05 01:42:29.050986+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-05 01:42:29.050596+00	2026-11-05 01:42:29.050596+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	sms	dummy_sms_d90f472298894878af4fb7c41977291b	enquiry.otp
0b8e2b68-6fb1-4113-8e53-0883999893a1	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 202712. It expires in 5 minutes.	3	9160871719|9160871719	SandboxSent	0	2026-11-10 01:52:05.669592+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:05.669588+00	2026-11-10 01:52:05.669588+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_4d7a8f885dc045209219e8decacd7e09	enquiry.otp
8a4c3c6e-af43-4f90-9b0b-bbd7f557d169	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Enquiry verification OTP	Your Bright Future verification code is 202712. It expires in 5 minutes.	2	9160871719|9160871719	SandboxSent	0	2026-11-10 01:52:05.638414+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:05.638126+00	2026-11-10 01:52:05.638126+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	sms	dummy_sms_86bcc26688224fb4becab518bc4b7013	enquiry.otp
0d773595-f0dc-4b13-9d16-b6a33d8ce0b4	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9160871719) — hi	1	314184ef-5cf0-4589-988d-687eddfd8e3f|frontoffice@school.edu	SandboxSent	0	2026-11-10 01:52:14.766787+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:14.766784+00	2026-11-10 01:52:14.766784+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_f3690302b73e495eab0cffa53a33592d	enquiry.verified
31b149ac-74b8-4801-903b-b7ce135136ff	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9160871719) — hi	3	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|+910000000000	SandboxSent	0	2026-11-10 01:52:14.767053+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:14.767053+00	2026-11-10 01:52:14.767053+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_c68cd2bb19834323b4e57a4e8aaa3805	enquiry.verified
88bef7d2-a5be-45df-9c72-61d66dafc253	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9160871719) — hi	0	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-11-10 01:52:14.76701+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:14.76701+00	2026-11-10 01:52:14.76701+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_d85366f662c84a219ae3fb6c8fa08e29	enquiry.verified
965cc5b2-192a-4b16-98d0-a2ccbb2813f6	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9160871719) — hi	1	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|admin@school.edu	SandboxSent	0	2026-11-10 01:52:14.767039+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:14.767038+00	2026-11-10 01:52:14.767038+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	email	dummy_email_24ef618dbc7d45f2b493c2daacd4bdde	enquiry.verified
9d70e64f-5abf-4ccc-8973-ec9b0acc07f7	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9160871719) — hi	4	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-11-10 01:52:14.76706+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:14.76706+00	2026-11-10 01:52:14.76706+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_5b6b292b80f441c9a2f1fb7e31179993	enquiry.verified
b8763a5f-9f63-49e1-8463-3d8bc0a14985	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9160871719) — hi	0	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab|4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	SandboxSent	0	2026-11-10 01:52:14.767071+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:14.76707+00	2026-11-10 01:52:14.76707+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	inapp	dummy_inapp_82caafd8c7b94a109ee8c135180383e8	enquiry.verified
e2c57f87-5c5d-48af-a032-db67f197cff8	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9160871719) — hi	4	314184ef-5cf0-4589-988d-687eddfd8e3f|314184ef-5cf0-4589-988d-687eddfd8e3f	SandboxSent	0	2026-11-10 01:52:14.766998+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:14.766997+00	2026-11-10 01:52:14.766997+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	fcm	dummy_webpush_9e1bcf2189fb4a9cb084afd167f556da	enquiry.verified
e51c48b6-de24-40f8-8af0-0a39d755a670	87e1bf55-4b87-41d5-bf52-f3f462f88b20	New Admission enquiry	hi (9160871719) — hi	3	314184ef-5cf0-4589-988d-687eddfd8e3f|+910000000000	SandboxSent	0	2026-11-10 01:52:14.766973+00	Sandbox mode — no external provider call. Replace dummy keys when the school provides live credentials.	2026-11-10 01:52:14.766972+00	2026-11-10 01:52:14.766972+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	whatsapp	dummy_whatsapp_c880ebf304dc43d3b9e0edbee8e6e6f6	enquiry.verified
\.


--
-- Data for Name: Payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payments" ("Id", "SchoolId", "StudentId", "Amount", "Status", "GatewayOrderId", "GatewayPaymentId", "ReceiptNumber", "PaidAt", "Method", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
411aaa60-c68e-4fc5-b49e-5f1d52f6cd05	87e1bf55-4b87-41d5-bf52-f3f462f88b20	67557cfc-aec9-4812-a65a-439ba467ceee	22500	2	\N	\N	RCT-2026-0003	2026-10-15 03:46:58.342871+00	Online (sandbox)	2026-10-16 03:46:58.342868+00	2026-10-16 03:46:58.342868+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
728bb1a7-3131-420b-baae-65f3ec7a5362	87e1bf55-4b87-41d5-bf52-f3f462f88b20	d2b219d2-e689-4088-b943-2704584f82ea	22500	2	\N	\N	RCT-2026-0004	2026-10-15 03:46:58.347335+00	Online (sandbox)	2026-10-16 03:46:58.347332+00	2026-10-16 03:46:58.347332+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
803f7b39-285a-4f9d-af74-723379071bd1	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9d57d8a2-fc65-44ef-8025-b3d4be391ae0	8000	2	\N	\N	RCT-2026-0002	2026-10-16 03:46:58.1135+00	Cash	2026-10-16 03:46:58.113499+00	2026-10-16 03:46:58.113499+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
81391276-056e-4f22-a18e-cf122fa77c0e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9d57d8a2-fc65-44ef-8025-b3d4be391ae0	45000	2	\N	\N	RCT-2026-0001	2026-10-13 03:46:58.113387+00	UPI	2026-10-16 03:46:58.11277+00	2026-10-16 03:46:58.112771+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
880b4b0e-2cb7-4ce5-8a47-170e68774b08	87e1bf55-4b87-41d5-bf52-f3f462f88b20	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	22500	2	\N	\N	RCT-2026-0002	2026-10-15 03:46:58.336798+00	Online (sandbox)	2026-10-16 03:46:58.336794+00	2026-10-16 03:46:58.336794+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ad114b09-2331-41fe-82f8-9b5b0c2f7bc7	87e1bf55-4b87-41d5-bf52-f3f462f88b20	a8110ca5-c889-4192-afbe-b04f3241df03	22500	2	\N	\N	RCT-2026-0007	2026-10-15 03:46:58.358216+00	Online (sandbox)	2026-10-16 03:46:58.358213+00	2026-10-16 03:46:58.358213+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c803d035-1b75-45b4-bda6-0b3fbe539228	87e1bf55-4b87-41d5-bf52-f3f462f88b20	ae9724fd-b9ea-484f-87cb-6583084d0384	22500	2	\N	\N	RCT-2026-0006	2026-10-15 03:46:58.353831+00	Online (sandbox)	2026-10-16 03:46:58.353828+00	2026-10-16 03:46:58.353828+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c9022279-9176-43f5-b565-a9ff4af0cb50	87e1bf55-4b87-41d5-bf52-f3f462f88b20	50eafd3b-e33e-466e-8f14-c977ec0cf85d	22500	2	\N	\N	RCT-2026-0005	2026-10-15 03:46:58.350134+00	Online (sandbox)	2026-10-16 03:46:58.350131+00	2026-10-16 03:46:58.350131+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a0cd0e9c-6446-4dc8-93ca-9a1d50a9a460	87e1bf55-4b87-41d5-bf52-f3f462f88b20	d2b219d2-e689-4088-b943-2704584f82ea	100	2	\N	\N	RCT-20261119004957-d2b219d2	2026-11-19 00:49:57.205597+00	Cash	2026-11-19 00:49:57.205476+00	2026-11-19 00:49:57.205476+00	unknown	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
cd96f20c-5adf-49ad-9323-7559b4300e3d	87e1bf55-4b87-41d5-bf52-f3f462f88b20	d2b219d2-e689-4088-b943-2704584f82ea	100	2	\N	\N	RCT-20261119005011-d2b219d2	2026-11-19 00:50:11.967189+00	Cash	2026-11-19 00:50:11.967188+00	2026-11-19 00:50:11.967188+00	unknown	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: PayrollRuns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollRuns" ("Id", "SchoolId", "PeriodYear", "PeriodMonth", "PeriodLabel", "Status", "EmployeeCount", "GrossTotal", "PfTotal", "EsiTotal", "TdsTotal", "NetTotal", "FinalizedAt", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
fd6d92c4-0793-4fd3-9822-dc1730bfaa0b	87e1bf55-4b87-41d5-bf52-f3f462f88b20	2026	9	September 2026	Finalized	4	235500.00	7200.00	0	5124.99	222375.01	2026-10-04 03:46:59.269661+00	2026-10-16 03:46:59.269088+00	2026-10-16 03:46:59.269088+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Payslips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payslips" ("Id", "PayrollRunId", "EmployeeId", "Basic", "Hra", "Allowance", "Gross", "Pf", "Esi", "ProfessionalTax", "Tds", "Net", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
2c0da101-a732-452e-9147-644e681c2a22	fd6d92c4-0793-4fd3-9822-dc1730bfaa0b	78fbc571-83b5-4bca-a8f0-60d40ffa953a	22000	8800.00	2200.00	33000.00	1800.00	0	200	0.00	31000.00	2026-10-16 03:46:59.273216+00	2026-10-16 03:46:59.273216+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4b9a9ad6-6ea9-45f2-b9e2-c86409288859	fd6d92c4-0793-4fd3-9822-dc1730bfaa0b	ac4b7f02-9789-45c2-afcd-e9a50e46c036	42000	16800.00	4200.00	63000.00	1800.00	0	200	1483.33	59516.67	2026-10-16 03:46:59.273208+00	2026-10-16 03:46:59.273208+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7bf0b7c8-d26c-4224-af2a-32cf9b6cf7b1	fd6d92c4-0793-4fd3-9822-dc1730bfaa0b	ad17df02-3c39-4c6b-b1e3-edc0ede71ef2	38000	15200.00	3800.00	57000.00	1800.00	0	200	1183.33	53816.67	2026-10-16 03:46:59.273215+00	2026-10-16 03:46:59.273215+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b048b0b2-100c-4fb8-9f8b-7899a0def990	fd6d92c4-0793-4fd3-9822-dc1730bfaa0b	9d98a8a7-4274-4f2d-9086-7533a8326272	55000	22000.00	5500.00	82500.00	1800.00	0	200	2458.33	78041.67	2026-10-16 03:46:59.271369+00	2026-10-16 03:46:59.27137+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Roles" ("Id", "Name", "Description", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted") FROM stdin;
0620de26-3ce4-412e-8734-5ed10ee2edd1	HRManager	\N	2026-10-12 04:07:14.201931+00	2026-10-12 04:07:14.201931+00	\N	\N	f
23cfe9b9-2906-4644-b1e5-5d5b6f442b7c	Parent	\N	2026-10-12 04:07:14.201925+00	2026-10-12 04:07:14.201926+00	\N	\N	f
371c6e14-82d4-4016-979c-8269e5808924	PlatformSuperAdmin	\N	2026-10-12 04:07:14.201872+00	2026-10-12 04:07:14.201872+00	\N	\N	f
3f132259-84d3-4a49-9dfe-7dcf23f4c7b9	Teacher	\N	2026-10-12 04:07:14.20192+00	2026-10-12 04:07:14.20192+00	\N	\N	f
40a41723-8ace-4909-a680-a9deda7d174b	Driver	\N	2026-10-12 04:07:14.201928+00	2026-10-12 04:07:14.201928+00	\N	\N	f
4b187cf2-a193-4dd5-8dc5-e143ec9e3716	TransportManager	\N	2026-10-12 04:07:14.201941+00	2026-10-12 04:07:14.201941+00	\N	\N	f
6d852668-d7ed-48f3-8e95-9e6d315f0e63	PayrollOfficer	\N	2026-10-12 04:07:14.201943+00	2026-10-12 04:07:14.201943+00	\N	\N	f
7a3215d8-6176-43bf-8e27-dc4281308999	SchoolAdmin	\N	2026-10-12 04:07:14.201917+00	2026-10-12 04:07:14.201917+00	\N	\N	f
91f9ce74-8ec9-4de0-9436-d7cf4d253eac	AdmissionOfficer	\N	2026-10-12 04:07:14.201937+00	2026-10-12 04:07:14.201937+00	\N	\N	f
c60bc392-b239-4ab1-84c2-d81dcbabdd54	Accountant	\N	2026-10-12 04:07:14.201934+00	2026-10-12 04:07:14.201934+00	\N	\N	f
cf87873f-afd5-43c8-bc30-8fa9259fa879	Student	\N	2026-10-12 04:07:14.201923+00	2026-10-12 04:07:14.201923+00	\N	\N	f
e63a0ede-496d-4894-84be-e33c3ca8bde9	AttendanceOfficer	\N	2026-10-12 04:07:14.201939+00	2026-10-12 04:07:14.201939+00	\N	\N	f
de5d6674-8dc2-4e1c-99ed-4cd8f0cf59a2	FrontOffice	Front office / admission counselor	2026-10-18 02:32:21.951464+00	2026-10-18 02:32:21.951464+00	\N	\N	f
\.


--
-- Data for Name: RouteStops; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RouteStops" ("Id", "RouteId", "Name", "StopOrder", "PickupTime", "Latitude", "Longitude", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
1d09b0d0-982c-4806-a0fc-6d75f6c3c1a6	307e206c-a7e2-4daf-8dea-dd6a06cbe887	Campus gate	1	07:10:00	17.4126	78.409	2026-10-16 01:15:02.82179+00	2026-10-16 01:15:02.82179+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6e2620e9-74f8-44fc-91db-8ff220f66ab1	307e206c-a7e2-4daf-8dea-dd6a06cbe887	Banjara Hills Rd 12	2	07:25:00	17.4148	78.4378	2026-10-16 01:15:02.821999+00	2026-10-16 01:15:02.821999+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a6c01767-fbc4-4f33-b928-80e047014292	307e206c-a7e2-4daf-8dea-dd6a06cbe887	Jubilee Hills checkpost	3	07:40:00	17.4319	78.407	2026-10-16 01:15:02.822+00	2026-10-16 01:15:02.822+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Routes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Routes" ("Id", "SchoolId", "Name", "IsActive", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
307e206c-a7e2-4daf-8dea-dd6a06cbe887	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Route 1 — Banjara Hills	t	2026-10-16 01:15:02.821594+00	2026-10-16 01:15:02.821594+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: SchoolAcademicSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SchoolAcademicSettings" ("Id", "SchoolId", "DiaryDeadline", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId", "WeeklyPlanDeadline") FROM stdin;
44f73722-8b8c-4fa8-aef5-f71f82306280	87e1bf55-4b87-41d5-bf52-f3f462f88b20	16:30:00	2026-10-18 12:44:17.707589+00	2026-11-02 02:05:37.022503+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	09:00:00
\.


--
-- Data for Name: SchoolAnnouncements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SchoolAnnouncements" ("Id", "SchoolId", "Title", "Body", "Audience", "Channels", "PublishedAt", "PublishedBy", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
e27a75a5-15f6-491f-98cd-5437aa9655ca	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Sandbox notice	Welcome to the parent portal.	All parents	InApp,Email,Sms	2026-10-16 01:18:22.276602+00	unknown	2026-10-16 01:18:22.272727+00	2026-10-16 01:18:22.272727+00	unknown	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Schools; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Schools" ("Id", "Name", "LogoUrl", "PrimaryColor", "TimeZone", "DefaultLanguage", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId", "Currency", "Locale") FROM stdin;
87e1bf55-4b87-41d5-bf52-f3f462f88b20	Bright Future International School	\N	#17365D	Asia/Kolkata	en	2026-10-12 04:07:14.197772+00	2026-10-12 04:07:14.197772+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	INR	en-IN
\.


--
-- Data for Name: Sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Sections" ("Id", "ClassId", "Name", "Capacity", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
19a2f070-f32c-462a-acb4-5c1bf814c93f	6ffaa108-2264-452d-b7f3-65479ece1729	A	40	2026-10-12 04:07:14.452581+00	2026-10-12 04:07:14.452581+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
82ac6cb1-bf14-4f41-a2a9-8f3910101a5a	310dc35d-196a-433e-b20d-aab069d535cc	A	40	2026-10-12 04:07:14.452595+00	2026-10-12 04:07:14.452596+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8a3990e3-7a34-4009-bb95-e5dabd9df9f7	1fc5f7e4-7aae-4602-ab23-1fffb750ace6	B	40	2026-10-12 04:07:14.452594+00	2026-10-12 04:07:14.452594+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
91c87d02-5d57-4f81-9639-5ff45ddc1a82	6ffaa108-2264-452d-b7f3-65479ece1729	B	40	2026-10-12 04:07:14.452582+00	2026-10-12 04:07:14.452582+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
982821c7-5a81-41ec-80c1-12f657393406	3bffe181-4bf0-499c-b271-9f3f7b128f5c	B	40	2026-10-12 04:07:14.452435+00	2026-10-12 04:07:14.452435+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a4ddc056-ce54-4645-bd74-8b77297c1800	310dc35d-196a-433e-b20d-aab069d535cc	B	40	2026-10-12 04:07:14.4526+00	2026-10-12 04:07:14.4526+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b9223971-8280-4669-9a13-c0812ea08f73	a265d576-f5b6-4a17-9515-58071ce0a2ab	B	40	2026-10-12 04:07:14.452587+00	2026-10-12 04:07:14.452587+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d04992c8-4044-411a-857c-b899f72fa2a8	a265d576-f5b6-4a17-9515-58071ce0a2ab	A	40	2026-10-12 04:07:14.452586+00	2026-10-12 04:07:14.452586+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
dae2d869-2459-49ae-a2f6-a725f1aba698	1fc5f7e4-7aae-4602-ab23-1fffb750ace6	A	40	2026-10-12 04:07:14.452588+00	2026-10-12 04:07:14.452588+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e2c738e5-7d63-4e41-ac98-2d546c0adf33	3bffe181-4bf0-499c-b271-9f3f7b128f5c	A	40	2026-10-12 04:07:14.45239+00	2026-10-12 04:07:14.45239+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: StudentAttendances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StudentAttendances" ("Id", "SessionId", "StudentId", "Code", "Remarks", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
0005302b-d0b6-42d4-aba3-c527d2bebbd8	4b8e7c90-bc02-4548-9cdc-466af03a9a0e	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-16 03:46:58.716498+00	2026-10-16 03:46:58.716498+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
11f3ff47-62d4-42e2-abb4-d135463f30f4	4b8e7c90-bc02-4548-9cdc-466af03a9a0e	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-16 03:46:58.716499+00	2026-10-16 03:46:58.716499+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1b38206b-060e-4222-8c52-46ad723638fa	968984b3-530a-4a6a-a18c-305a5a71a2a8	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-16 03:46:58.727464+00	2026-10-16 03:46:58.727464+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2893448e-7904-412c-a7c7-522475fa242c	710fab9a-d642-4fd7-a79b-bcd9f7e56788	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-16 03:46:58.731402+00	2026-10-16 03:46:58.731402+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2ab2b4bf-158e-484b-9210-8a3fa42b1013	968984b3-530a-4a6a-a18c-305a5a71a2a8	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-16 03:46:58.727465+00	2026-10-16 03:46:58.727465+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
413f9318-b5f9-4311-9845-cd01ba14575e	2356acb9-b279-4dec-b3b4-8f3754615e3f	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-16 03:46:58.721113+00	2026-10-16 03:46:58.721113+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
46f8a82b-e4a2-4c5f-a5b0-9fa2b15de45f	1de263b1-ccd3-4c7d-8c3b-cf5a48960437	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-10-16 03:46:58.430593+00	2026-10-16 03:46:58.430593+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
59201a68-2695-4783-aafc-661ac8867006	710fab9a-d642-4fd7-a79b-bcd9f7e56788	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-16 03:46:58.7314+00	2026-10-16 03:46:58.7314+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7cb33418-2112-4f84-992c-c4fff3cefccb	2356acb9-b279-4dec-b3b4-8f3754615e3f	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-16 03:46:58.721114+00	2026-10-16 03:46:58.721114+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7cd675f8-d649-480d-a7f7-b4083520a9f5	aed27eab-4fd4-42b5-9eb7-62af87981f19	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-16 03:46:58.737164+00	2026-10-16 03:46:58.737164+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
91c15f4c-86a4-4032-b762-a1a8a393d078	710fab9a-d642-4fd7-a79b-bcd9f7e56788	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-16 03:46:58.731402+00	2026-10-16 03:46:58.731402+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9cccf01f-5ae1-486b-921c-c90c91c373a0	2356acb9-b279-4dec-b3b4-8f3754615e3f	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-16 03:46:58.721111+00	2026-10-16 03:46:58.721112+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c1e5f432-b31f-4070-be8e-132623334fbf	aed27eab-4fd4-42b5-9eb7-62af87981f19	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-16 03:46:58.737161+00	2026-10-16 03:46:58.737161+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c3061c19-1339-408c-9c22-219364099367	aed27eab-4fd4-42b5-9eb7-62af87981f19	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-16 03:46:58.737163+00	2026-10-16 03:46:58.737163+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f3ade754-e141-4745-a78c-cbf582b0467a	1de263b1-ccd3-4c7d-8c3b-cf5a48960437	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-16 03:46:58.430054+00	2026-10-16 03:46:58.430055+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f5ad80c9-fd5e-46f3-9116-cdf3d611f33b	1de263b1-ccd3-4c7d-8c3b-cf5a48960437	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-16 03:46:58.430557+00	2026-10-16 03:46:58.430557+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f6768e32-341f-4be1-bfca-5ac473993d52	4b8e7c90-bc02-4548-9cdc-466af03a9a0e	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-16 03:46:58.716496+00	2026-10-16 03:46:58.716496+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
fce9d7c2-bac9-4f0f-b21d-c8255afc73ab	968984b3-530a-4a6a-a18c-305a5a71a2a8	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-16 03:46:58.727461+00	2026-10-16 03:46:58.727461+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
02905b3d-9d6d-4373-a089-4563297d74a1	1a0d51b3-cfe2-4575-969b-c6fca70b5425	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-18 02:00:30.94688+00	2026-10-18 02:00:30.946881+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
892313cc-0f14-406d-933f-bce0972f076d	1a0d51b3-cfe2-4575-969b-c6fca70b5425	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-18 02:00:30.946139+00	2026-10-18 02:00:30.94614+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d883a96c-3b28-4fcf-9406-fac6116f4f4d	1a0d51b3-cfe2-4575-969b-c6fca70b5425	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-18 02:00:30.946954+00	2026-10-18 02:00:30.946955+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3903d3b3-c9ff-459c-a836-3278d1be6f57	eb806a3c-5ca6-438c-97bf-91021b89d34a	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-20 05:12:37.334871+00	2026-10-20 05:12:37.334871+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
519c3a61-0796-489f-a989-f5510f883b2a	eb806a3c-5ca6-438c-97bf-91021b89d34a	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-20 05:12:37.334578+00	2026-10-20 05:12:37.334579+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
58b799be-ee0e-4447-831e-762fdd6b31de	a3774551-070e-4f2a-8ff3-1c941958fc76	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-20 05:12:37.485411+00	2026-10-20 05:12:37.485411+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
5aa596d8-52f9-4128-8eab-81e4826b1691	eb806a3c-5ca6-438c-97bf-91021b89d34a	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-20 05:12:37.33487+00	2026-10-20 05:12:37.33487+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7b6bdaec-ba26-40ec-aabd-0ac6a9c2a16c	a3774551-070e-4f2a-8ff3-1c941958fc76	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-20 05:12:37.485411+00	2026-10-20 05:12:37.485411+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a8fabac3-68e0-4c33-942e-6859e32f6f6d	a3774551-070e-4f2a-8ff3-1c941958fc76	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-20 05:12:37.485412+00	2026-10-20 05:12:37.485412+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
aa146c8c-4e8a-499c-ba8f-9ff30b2e5cdb	a3774551-070e-4f2a-8ff3-1c941958fc76	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-20 05:12:37.485407+00	2026-10-20 05:12:37.485407+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b946fa9a-9a3f-4f00-a9a2-2e29fc51d555	eb806a3c-5ca6-438c-97bf-91021b89d34a	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-20 05:12:37.334836+00	2026-10-20 05:12:37.334836+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c3674910-ef5d-45cf-a3bb-e6a8ff94fadf	eb806a3c-5ca6-438c-97bf-91021b89d34a	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-10-20 05:12:37.33487+00	2026-10-20 05:12:37.33487+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
fdbff807-d55d-48e9-a78f-61ae717c48e3	a3774551-070e-4f2a-8ff3-1c941958fc76	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-20 05:12:37.485413+00	2026-10-20 05:12:37.485413+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
08e0da2f-f424-4b5e-ae72-f33c03765a00	d9ca5130-4dbe-4f72-85cb-ac7725e020e1	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-27 02:36:06.498433+00	2026-10-27 02:36:06.498433+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
09728609-20fc-4115-a166-8c52ce7df351	19c8e907-b3d7-4829-a81f-e96db9274da5	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-27 02:36:06.509877+00	2026-10-27 02:36:06.509877+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
09d98027-3816-41ee-8f46-af0742d7bb75	76930cb7-9ec1-40f1-b627-4ade6330ad53	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-27 02:36:06.495247+00	2026-10-27 02:36:06.495247+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1335e08e-0120-4477-8704-fc629ee77185	76930cb7-9ec1-40f1-b627-4ade6330ad53	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-27 02:36:06.495254+00	2026-10-27 02:36:06.495254+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1ac08d8b-1df0-4369-a61f-725c57d3c856	76930cb7-9ec1-40f1-b627-4ade6330ad53	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-27 02:36:06.495252+00	2026-10-27 02:36:06.495252+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1ea6033e-a62f-483b-968b-acba2be37dd7	19c8e907-b3d7-4829-a81f-e96db9274da5	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-27 02:36:06.509878+00	2026-10-27 02:36:06.509878+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
23d3968d-e5fa-4670-b97b-822781c1f8cf	d9ca5130-4dbe-4f72-85cb-ac7725e020e1	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-27 02:36:06.498435+00	2026-10-27 02:36:06.498435+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2af6039a-fa9c-4463-a108-e01477cb19c4	19c8e907-b3d7-4829-a81f-e96db9274da5	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-27 02:36:06.509875+00	2026-10-27 02:36:06.509875+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2c8b2c42-2d7d-4b9e-9434-efa4b05a97e8	322ff569-d56b-4828-a0d5-b36c42e5c8fe	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-27 02:36:06.373609+00	2026-10-27 02:36:06.373609+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3236da10-7e88-4bc1-bee2-f646f461e72b	76930cb7-9ec1-40f1-b627-4ade6330ad53	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-27 02:36:06.495251+00	2026-10-27 02:36:06.495251+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3f4bc049-07a9-4acb-b776-e1a2be6d458d	3abc563e-22ce-45ae-811a-7c05aa7a1c31	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-27 02:36:06.50187+00	2026-10-27 02:36:06.50187+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4141fb7d-7227-4473-b469-db928fef2aba	b5c4a0d4-329b-4bc3-80f3-89c2bfe011d6	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-27 02:36:06.506008+00	2026-10-27 02:36:06.506008+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
554473dd-59c0-481d-bd18-46273b691b36	3abc563e-22ce-45ae-811a-7c05aa7a1c31	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-27 02:36:06.501871+00	2026-10-27 02:36:06.501871+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
58072ed1-39b2-4f70-a789-eb5280d244a1	3abc563e-22ce-45ae-811a-7c05aa7a1c31	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-27 02:36:06.501869+00	2026-10-27 02:36:06.501869+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
61929b18-ff3a-4156-a958-16002750caf9	322ff569-d56b-4828-a0d5-b36c42e5c8fe	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-27 02:36:06.373545+00	2026-10-27 02:36:06.373545+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
67b62097-b2b8-4f87-b67d-db9a216d54c3	19c8e907-b3d7-4829-a81f-e96db9274da5	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-27 02:36:06.509879+00	2026-10-27 02:36:06.509879+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
68669b10-a118-4149-bcbc-02277e56c68c	322ff569-d56b-4828-a0d5-b36c42e5c8fe	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-27 02:36:06.373354+00	2026-10-27 02:36:06.373354+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7409690b-a792-4dc1-b03f-180bbd390d47	322ff569-d56b-4828-a0d5-b36c42e5c8fe	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-10-27 02:36:06.373608+00	2026-10-27 02:36:06.373608+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
77279a36-a110-4740-8621-21b46ff406b1	322ff569-d56b-4828-a0d5-b36c42e5c8fe	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-27 02:36:06.373609+00	2026-10-27 02:36:06.373609+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
78abc81f-c401-4654-addf-f97aee794f52	b5c4a0d4-329b-4bc3-80f3-89c2bfe011d6	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-27 02:36:06.506004+00	2026-10-27 02:36:06.506004+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8582734b-735b-419d-bfc5-20e2c4e8c81c	76930cb7-9ec1-40f1-b627-4ade6330ad53	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-27 02:36:06.495253+00	2026-10-27 02:36:06.495253+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
868af19a-2aa3-4d41-8d8a-8b96ebca63b3	b5c4a0d4-329b-4bc3-80f3-89c2bfe011d6	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-27 02:36:06.50601+00	2026-10-27 02:36:06.50601+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
86bb27bd-ab47-41ad-b278-3f829d9acdbf	d9ca5130-4dbe-4f72-85cb-ac7725e020e1	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-27 02:36:06.498437+00	2026-10-27 02:36:06.498437+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9bd4fa67-1fac-4fc4-ba70-15d4eaf595fd	3abc563e-22ce-45ae-811a-7c05aa7a1c31	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-27 02:36:06.501866+00	2026-10-27 02:36:06.501866+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9e1df072-63ec-41d1-9de9-c1eace26b336	19c8e907-b3d7-4829-a81f-e96db9274da5	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-27 02:36:06.509879+00	2026-10-27 02:36:06.509879+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a657707c-6691-425b-a558-2065b088cea0	b5c4a0d4-329b-4bc3-80f3-89c2bfe011d6	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-27 02:36:06.506011+00	2026-10-27 02:36:06.506011+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
da33aa39-0ca5-41b1-a1ab-b5b1adfd53d5	b5c4a0d4-329b-4bc3-80f3-89c2bfe011d6	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-27 02:36:06.506009+00	2026-10-27 02:36:06.506009+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e09bd10e-2cbf-4717-90bf-04dcf89a0b46	3abc563e-22ce-45ae-811a-7c05aa7a1c31	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-27 02:36:06.501872+00	2026-10-27 02:36:06.501872+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e2c3fdfe-87a2-404d-90ef-de0de9a15c5f	d9ca5130-4dbe-4f72-85cb-ac7725e020e1	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-27 02:36:06.498437+00	2026-10-27 02:36:06.498437+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
eac104f5-feb1-415e-8b8f-e0ee56d1f295	d9ca5130-4dbe-4f72-85cb-ac7725e020e1	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-27 02:36:06.498436+00	2026-10-27 02:36:06.498436+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
04afe243-3d10-4191-8e8b-518d7e72b153	b5e19ee7-efb8-4dc1-96e5-3db90ee73efe	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-30 01:54:47.325547+00	2026-10-30 01:54:47.325547+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
0cda09f4-1a28-45f4-8e23-ad74d822d72f	f7e5ff9f-1b7b-446c-9f7c-707e47075e80	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-30 01:54:47.217594+00	2026-10-30 01:54:47.217594+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1481e5d1-ce43-43cf-91d1-dacf2713c80b	f7e5ff9f-1b7b-446c-9f7c-707e47075e80	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-30 01:54:47.217593+00	2026-10-30 01:54:47.217593+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
159999b5-29bb-4a80-b598-de3507b127e5	a2466cd9-43bf-4378-984e-facb2f166d06	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-30 01:54:47.322321+00	2026-10-30 01:54:47.322321+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
586ed1fa-81fc-4ace-b561-fc0ea5c30a6d	b5e19ee7-efb8-4dc1-96e5-3db90ee73efe	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-30 01:54:47.325544+00	2026-10-30 01:54:47.325544+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9c70d44c-a913-42d7-b71f-610da3913c4d	a2466cd9-43bf-4378-984e-facb2f166d06	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-30 01:54:47.322319+00	2026-10-30 01:54:47.322319+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9d7c3225-c948-4f0e-b44b-214237fc7191	a2466cd9-43bf-4378-984e-facb2f166d06	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-30 01:54:47.322322+00	2026-10-30 01:54:47.322322+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ae8ac273-c8cc-4cff-9164-b6e1036b81f2	b5e19ee7-efb8-4dc1-96e5-3db90ee73efe	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-10-30 01:54:47.325546+00	2026-10-30 01:54:47.325546+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b1d9aac9-9ae8-41f6-8151-3eb5df7dea9d	a2466cd9-43bf-4378-984e-facb2f166d06	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-30 01:54:47.32232+00	2026-10-30 01:54:47.32232+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b27bbaff-c247-4f47-9af1-c1b635d969ca	b5e19ee7-efb8-4dc1-96e5-3db90ee73efe	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-10-30 01:54:47.325547+00	2026-10-30 01:54:47.325547+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
be49a9da-212a-4160-bd89-c4f95b9e2dcf	f7e5ff9f-1b7b-446c-9f7c-707e47075e80	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-10-30 01:54:47.217437+00	2026-10-30 01:54:47.217438+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
bf72cc2c-4f21-4f70-a17f-5b2e7aa8e375	f7e5ff9f-1b7b-446c-9f7c-707e47075e80	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-10-30 01:54:47.217585+00	2026-10-30 01:54:47.217585+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c5090afc-5ef2-40da-b6b7-1b67ccc3316d	f7e5ff9f-1b7b-446c-9f7c-707e47075e80	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-30 01:54:47.217563+00	2026-10-30 01:54:47.217563+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d428ae89-999a-4065-8983-f6e6ae6862c8	a2466cd9-43bf-4378-984e-facb2f166d06	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-10-30 01:54:47.322322+00	2026-10-30 01:54:47.322322+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f1d6c698-d682-4238-9e19-3dd93f98ed6f	b5e19ee7-efb8-4dc1-96e5-3db90ee73efe	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-10-30 01:54:47.325546+00	2026-10-30 01:54:47.325546+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
55cc7683-cad0-40b5-8a00-a573021ff135	f25f4222-736f-4983-abb5-955d06e9c563	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-01 03:16:26.667062+00	2026-11-01 03:16:26.667062+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
67898df6-efcf-435c-be82-c47bda67ad9f	f25f4222-736f-4983-abb5-955d06e9c563	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-01 03:16:26.667123+00	2026-11-01 03:16:26.667123+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
84727a22-246d-4849-9282-0a552bfe2ddb	f25f4222-736f-4983-abb5-955d06e9c563	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-11-01 03:16:26.667121+00	2026-11-01 03:16:26.667121+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8addaae5-bb9a-460d-9206-125dea5e953d	f25f4222-736f-4983-abb5-955d06e9c563	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-01 03:16:26.666917+00	2026-11-01 03:16:26.666917+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
cf845ca3-0612-4f24-8ab5-352a1f0a425e	f25f4222-736f-4983-abb5-955d06e9c563	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-01 03:16:26.667124+00	2026-11-01 03:16:26.667124+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3a332e7f-36c8-4dfd-8200-a8da21ae6d19	e641954f-3845-4cc0-afab-916a20bade0a	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-02 01:23:11.554975+00	2026-11-02 01:23:11.554975+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3c09daa3-5903-4fc6-b06f-29dd2289456e	e641954f-3845-4cc0-afab-916a20bade0a	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-11-02 01:23:11.555175+00	2026-11-02 01:23:11.555175+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4d31a607-59b4-4cff-9cfb-796bff16386c	e641954f-3845-4cc0-afab-916a20bade0a	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-02 01:23:11.555134+00	2026-11-02 01:23:11.555134+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
5a7494b6-7a47-463f-9924-0ab1f93b636d	e641954f-3845-4cc0-afab-916a20bade0a	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-02 01:23:11.555176+00	2026-11-02 01:23:11.555176+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e98b69a3-95f3-4b6a-bea3-f40cd2c765b5	e641954f-3845-4cc0-afab-916a20bade0a	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-02 01:23:11.555176+00	2026-11-02 01:23:11.555176+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
12406d85-da8f-4303-844c-87cc80706fd9	80627992-ab60-409b-832d-469931a1b215	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-04 01:36:27.874102+00	2026-11-04 01:36:27.874102+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1d51333a-cce6-4f21-ac06-09ed1d6dbb43	ff4955a9-de5f-4e82-ad24-4ad3d815f2c7	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-04 01:36:28.042246+00	2026-11-04 01:36:28.042246+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
23048d69-8804-4cdd-8c7b-be57701d9946	80627992-ab60-409b-832d-469931a1b215	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-11-04 01:36:27.874185+00	2026-11-04 01:36:27.874185+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
69ec76a0-5e2a-451b-8c86-c36fa19fc4bd	ff4955a9-de5f-4e82-ad24-4ad3d815f2c7	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-11-04 01:36:28.042249+00	2026-11-04 01:36:28.042249+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7175dc4e-3b83-4626-94d9-f70a1e768db2	80627992-ab60-409b-832d-469931a1b215	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-04 01:36:27.874186+00	2026-11-04 01:36:27.874186+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b1ecf1b5-a354-42d0-b8bc-66731de396d3	ff4955a9-de5f-4e82-ad24-4ad3d815f2c7	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-04 01:36:28.04225+00	2026-11-04 01:36:28.04225+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c0826411-955a-4b72-9d6b-c53833392bd1	80627992-ab60-409b-832d-469931a1b215	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-04 01:36:27.873775+00	2026-11-04 01:36:27.873775+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e582e17c-6b50-4793-896c-43e485dadebc	ff4955a9-de5f-4e82-ad24-4ad3d815f2c7	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-04 01:36:28.042248+00	2026-11-04 01:36:28.042248+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f6b8bc77-1d46-4953-9861-781830708309	ff4955a9-de5f-4e82-ad24-4ad3d815f2c7	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-04 01:36:28.042251+00	2026-11-04 01:36:28.042251+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f98ecf33-6e39-483f-baf4-c0c5c1e81a1f	80627992-ab60-409b-832d-469931a1b215	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-04 01:36:27.874187+00	2026-11-04 01:36:27.874187+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
08da5360-db6f-45b2-b7b2-86925f5f7076	dcd72251-83ec-4586-a3c4-caea73b20e07	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-05 01:19:19.661875+00	2026-11-05 01:19:19.661875+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
442ca088-69c5-490d-8d62-8d35b078acfc	dcd72251-83ec-4586-a3c4-caea73b20e07	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-05 01:19:19.661839+00	2026-11-05 01:19:19.661839+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
90e4da7a-976b-4cb7-9035-3a444bf13f83	dcd72251-83ec-4586-a3c4-caea73b20e07	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-05 01:19:19.661875+00	2026-11-05 01:19:19.661875+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a31ea0b3-06ab-4c22-b599-f7c6eaead57b	dcd72251-83ec-4586-a3c4-caea73b20e07	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-11-05 01:19:19.661874+00	2026-11-05 01:19:19.661874+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
bc0750af-c438-47c8-94bd-0b22af0202d9	dcd72251-83ec-4586-a3c4-caea73b20e07	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-05 01:19:19.661738+00	2026-11-05 01:19:19.661738+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
0707eccf-fa30-42ff-90de-174b38789b9e	7e5cb509-85da-422f-bd00-726eaa8d6336	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-10 00:02:04.261202+00	2026-11-10 00:02:04.261202+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
08aa6a24-5c62-445d-aa30-c0c0a8786f54	70093511-1624-49c2-89d2-fbe3be561b32	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-11-10 00:02:04.25947+00	2026-11-10 00:02:04.25947+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
0f81cae8-4534-4b54-b786-f6efdf511482	70093511-1624-49c2-89d2-fbe3be561b32	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-10 00:02:04.25947+00	2026-11-10 00:02:04.25947+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
14c0ba45-57e2-40a7-a8d4-39a1c3293b3a	7e5cb509-85da-422f-bd00-726eaa8d6336	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-11-10 00:02:04.261201+00	2026-11-10 00:02:04.261201+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
165c6312-5768-429d-8ea0-dfce4c8bbb24	7e5cb509-85da-422f-bd00-726eaa8d6336	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-10 00:02:04.261199+00	2026-11-10 00:02:04.261199+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1bcdb0f3-9277-475c-96d5-c99408b5a11d	7e5cb509-85da-422f-bd00-726eaa8d6336	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-10 00:02:04.261202+00	2026-11-10 00:02:04.261202+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
34685463-27ff-468c-b902-c528257a9dec	c69d2647-004b-4fd9-9a83-32b9d56a1e31	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-11-10 00:02:04.174539+00	2026-11-10 00:02:04.174539+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
440e758a-ebd0-4adf-a677-e77bf63abff0	c69d2647-004b-4fd9-9a83-32b9d56a1e31	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-10 00:02:04.174511+00	2026-11-10 00:02:04.174511+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
46eb5404-c886-428f-8d71-7e04d57a77b4	0a4801bf-f463-4488-86b9-73f70ccec46a	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-10 00:02:04.257519+00	2026-11-10 00:02:04.257519+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
576f4a87-0ad4-4034-863e-2896fafe79e1	0a4801bf-f463-4488-86b9-73f70ccec46a	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-10 00:02:04.257517+00	2026-11-10 00:02:04.257517+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7604e58b-4de7-4795-bdae-c89ff347be79	70093511-1624-49c2-89d2-fbe3be561b32	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-10 00:02:04.259471+00	2026-11-10 00:02:04.259471+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7d16c6ab-7b70-4fef-98d9-1d21b57f90bf	70093511-1624-49c2-89d2-fbe3be561b32	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-10 00:02:04.259469+00	2026-11-10 00:02:04.259469+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7d4f918d-5454-4187-90ec-6fdfac903be7	7e5cb509-85da-422f-bd00-726eaa8d6336	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-10 00:02:04.2612+00	2026-11-10 00:02:04.2612+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8acd1ad5-8a1f-4380-a1de-65b97daa054e	0a4801bf-f463-4488-86b9-73f70ccec46a	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-10 00:02:04.257521+00	2026-11-10 00:02:04.257521+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8c22eed2-94f8-4d4a-8a24-e39537c2f684	0a4801bf-f463-4488-86b9-73f70ccec46a	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-11-10 00:02:04.25752+00	2026-11-10 00:02:04.25752+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9413a43e-2fa3-4aa2-826f-0f8ae900d091	c69d2647-004b-4fd9-9a83-32b9d56a1e31	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-10 00:02:04.174541+00	2026-11-10 00:02:04.174541+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
960c7f7f-dccb-4c27-bae2-a1a3dda98ba1	c69d2647-004b-4fd9-9a83-32b9d56a1e31	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-10 00:02:04.17454+00	2026-11-10 00:02:04.17454+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b17efc81-1a06-4cd9-8a4c-369b31431174	70093511-1624-49c2-89d2-fbe3be561b32	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-10 00:02:04.259467+00	2026-11-10 00:02:04.259467+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b993808f-5e22-44c8-a900-ab7cb5237571	0a4801bf-f463-4488-86b9-73f70ccec46a	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-10 00:02:04.25752+00	2026-11-10 00:02:04.25752+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f252274f-ae2d-429e-8054-45cc525f0da0	c69d2647-004b-4fd9-9a83-32b9d56a1e31	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-10 00:02:04.174386+00	2026-11-10 00:02:04.174386+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1e01dac9-eed1-4c60-9f2a-a15f3f309ba8	1a56a480-b52f-4c5a-a7e9-9bac42f70ccf	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-11 01:58:25.254679+00	2026-11-11 01:58:25.254679+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
20371a39-74cb-4167-8f6f-192a5a9bc746	1a56a480-b52f-4c5a-a7e9-9bac42f70ccf	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-11 01:58:25.254651+00	2026-11-11 01:58:25.254651+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7d3b5edf-cc4c-4eeb-9760-b9b62bc3d422	1a56a480-b52f-4c5a-a7e9-9bac42f70ccf	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-11-11 01:58:25.254675+00	2026-11-11 01:58:25.254675+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9ae6919b-d22b-4222-855c-5de8e5a97d08	1a56a480-b52f-4c5a-a7e9-9bac42f70ccf	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	0	\N	2026-11-11 01:58:25.254683+00	2026-11-11 01:58:25.254683+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9b4afe23-4260-4ef9-8f5d-819bd6bae816	1a56a480-b52f-4c5a-a7e9-9bac42f70ccf	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-11 01:58:25.254204+00	2026-11-11 01:58:25.254204+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
adf181b3-895f-4a47-9086-b22f4ad05d44	1a56a480-b52f-4c5a-a7e9-9bac42f70ccf	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-11 01:58:25.254676+00	2026-11-11 01:58:25.254676+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
09185721-c9c4-4ae0-9ad9-d4fbb39fe589	2b93b044-4593-4e07-b4f4-38573a61b3af	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	0	\N	2026-11-13 02:16:17.228367+00	2026-11-13 02:16:17.228367+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
0ce8fdea-4de0-458c-852c-fe542e0327e2	298357cd-064a-4e91-aada-23a183eb95da	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-13 02:16:17.150986+00	2026-11-13 02:16:17.150986+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
16bb3797-c21c-419b-87ff-ccc533d27d3c	298357cd-064a-4e91-aada-23a183eb95da	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-11-13 02:16:17.150985+00	2026-11-13 02:16:17.150985+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3c4e8331-ec8e-4532-9886-54976c51f4e7	2b93b044-4593-4e07-b4f4-38573a61b3af	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-13 02:16:17.228365+00	2026-11-13 02:16:17.228365+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
5d2bc616-1dce-403a-ac1f-c85e6424677f	298357cd-064a-4e91-aada-23a183eb95da	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	0	\N	2026-11-13 02:16:17.150995+00	2026-11-13 02:16:17.150995+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6dedf904-3bda-4f3b-9508-9d79c38eb06e	2b93b044-4593-4e07-b4f4-38573a61b3af	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-13 02:16:17.228364+00	2026-11-13 02:16:17.228364+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
70c4b48b-1b2e-4135-a701-d7bf399dbc78	298357cd-064a-4e91-aada-23a183eb95da	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-13 02:16:17.150838+00	2026-11-13 02:16:17.150838+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
731a2a92-f68b-4eb1-a261-51ed3f9c00e3	2b93b044-4593-4e07-b4f4-38573a61b3af	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-13 02:16:17.228361+00	2026-11-13 02:16:17.228361+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7498ba10-4ba7-4e51-93a9-7992554ccff1	2b93b044-4593-4e07-b4f4-38573a61b3af	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-13 02:16:17.228365+00	2026-11-13 02:16:17.228365+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
904046e6-80a1-49cb-8a7f-d27b0758deb5	2b93b044-4593-4e07-b4f4-38573a61b3af	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-11-13 02:16:17.228364+00	2026-11-13 02:16:17.228364+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a595571c-3e47-493a-8b84-bfd18b78d9a4	298357cd-064a-4e91-aada-23a183eb95da	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-13 02:16:17.150988+00	2026-11-13 02:16:17.150988+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
efbb48f1-f2bb-4925-8394-3e0b7e2e3992	298357cd-064a-4e91-aada-23a183eb95da	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-13 02:16:17.150949+00	2026-11-13 02:16:17.150949+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
0f841bb0-1fd3-4e68-956d-d8e504beb0eb	961aee66-1959-43ee-adc8-1ab07e3624c9	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-11-15 09:40:50.890736+00	2026-11-15 09:40:50.890736+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
420ba0f5-9781-4349-ae2a-a9056aa72c56	961aee66-1959-43ee-adc8-1ab07e3624c9	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-15 09:40:50.890737+00	2026-11-15 09:40:50.890737+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
73fba223-692b-4af7-9f94-1dd4d66234cc	961aee66-1959-43ee-adc8-1ab07e3624c9	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-15 09:40:50.89074+00	2026-11-15 09:40:50.89074+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7c2b967d-1108-4fe9-a0ba-08d66a3e0fbb	961aee66-1959-43ee-adc8-1ab07e3624c9	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-15 09:40:50.89066+00	2026-11-15 09:40:50.89066+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
945554e3-ba5c-4862-8587-5be259ab8ef1	961aee66-1959-43ee-adc8-1ab07e3624c9	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	0	\N	2026-11-15 09:40:50.890744+00	2026-11-15 09:40:50.890744+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
97dee26f-24e8-4e38-ac8b-6a5bcfec90e8	961aee66-1959-43ee-adc8-1ab07e3624c9	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-15 09:40:50.890395+00	2026-11-15 09:40:50.890395+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
177c28a8-ad39-4166-964b-067d943865f8	6e507aaf-c6bd-4ac6-bf42-b31bee14b371	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-16 03:24:23.386987+00	2026-11-16 03:24:23.386987+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
33f59020-6494-4f4e-b163-ab2836e31b84	6e507aaf-c6bd-4ac6-bf42-b31bee14b371	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-16 03:24:23.386925+00	2026-11-16 03:24:23.386925+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
39a19e23-843e-47eb-b5f7-47d1ea4e85fc	6e507aaf-c6bd-4ac6-bf42-b31bee14b371	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-11-16 03:24:23.386985+00	2026-11-16 03:24:23.386985+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4d4cdc96-4284-42af-b4aa-361d6d9cd256	6e507aaf-c6bd-4ac6-bf42-b31bee14b371	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-16 03:24:23.386719+00	2026-11-16 03:24:23.386719+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
870ec723-da63-4a56-9926-21fceec0b6b9	6e507aaf-c6bd-4ac6-bf42-b31bee14b371	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	0	\N	2026-11-16 03:24:23.386996+00	2026-11-16 03:24:23.386996+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
fe397885-37e2-46c2-b081-c2047f4b9107	6e507aaf-c6bd-4ac6-bf42-b31bee14b371	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-16 03:24:23.386991+00	2026-11-16 03:24:23.386991+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
0b30077d-3b14-4302-8c8a-19ed83aaecfa	ac4359c1-2a67-4610-bb3d-4fcfc37cd368	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-19 00:26:04.021836+00	2026-11-19 00:26:04.021837+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
24b95845-04c7-45ba-a2dc-6eff8556228a	e574bbb5-1b32-40ad-80f2-1c62fcf15d62	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-19 00:26:04.138174+00	2026-11-19 00:26:04.138174+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
34a9ff9e-bcf5-46e1-b898-e7b6213ea849	f73dc64b-8d8e-4563-ac45-6b5bcbad4259	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-19 00:26:04.128665+00	2026-11-19 00:26:04.128665+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3693bfbb-2135-4c35-8f26-7362255cc517	ac4359c1-2a67-4610-bb3d-4fcfc37cd368	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-19 00:26:04.022001+00	2026-11-19 00:26:04.022001+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4f6f3c08-8c3c-40ba-b513-f9f44110486e	e574bbb5-1b32-40ad-80f2-1c62fcf15d62	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-19 00:26:04.138171+00	2026-11-19 00:26:04.138171+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
81f1d206-5246-4e44-9e44-4c5b9ebd2d41	e574bbb5-1b32-40ad-80f2-1c62fcf15d62	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-11-19 00:26:04.138172+00	2026-11-19 00:26:04.138172+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
85582e86-9d71-4bfd-8f0a-8a0ff0e99528	f73dc64b-8d8e-4563-ac45-6b5bcbad4259	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-19 00:26:04.12866+00	2026-11-19 00:26:04.12866+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8afbbd63-b60f-4dda-bf0f-4b55730809c7	f73dc64b-8d8e-4563-ac45-6b5bcbad4259	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-19 00:26:04.128666+00	2026-11-19 00:26:04.128666+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
942cd9de-28e2-476a-880c-c3c0bb048b8f	f73dc64b-8d8e-4563-ac45-6b5bcbad4259	d2b219d2-e689-4088-b943-2704584f82ea	0	\N	2026-11-19 00:26:04.128664+00	2026-11-19 00:26:04.128664+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
97df0eeb-5b3a-401c-a216-7d02f32b50f5	f73dc64b-8d8e-4563-ac45-6b5bcbad4259	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	0	\N	2026-11-19 00:26:04.128663+00	2026-11-19 00:26:04.128663+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9ffdaa40-1560-46d3-9818-45c2dab7aeba	ac4359c1-2a67-4610-bb3d-4fcfc37cd368	d42237de-3656-406f-974b-07153aa83221	0	\N	2026-11-19 00:26:04.022033+00	2026-11-19 00:26:04.022034+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b69c1a74-55c3-4293-a2d7-3ef7a52ca34d	e574bbb5-1b32-40ad-80f2-1c62fcf15d62	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	0	\N	2026-11-19 00:26:04.138177+00	2026-11-19 00:26:04.138177+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
bd33a42b-c829-473a-87c8-32f42c6b8391	ac4359c1-2a67-4610-bb3d-4fcfc37cd368	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-19 00:26:04.02203+00	2026-11-19 00:26:04.02203+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
bfaa790c-86fa-4178-91cf-c70db9c8a481	ac4359c1-2a67-4610-bb3d-4fcfc37cd368	d2b219d2-e689-4088-b943-2704584f82ea	1	\N	2026-11-19 00:26:04.022029+00	2026-11-19 00:26:04.022029+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e345009f-df20-47f4-93f8-b2c00e17178c	e574bbb5-1b32-40ad-80f2-1c62fcf15d62	703b97eb-767c-4976-baaf-065cce573a67	0	\N	2026-11-19 00:26:04.138173+00	2026-11-19 00:26:04.138173+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
eb7d2475-a44c-47c2-adde-94c06b109af5	e574bbb5-1b32-40ad-80f2-1c62fcf15d62	67557cfc-aec9-4812-a65a-439ba467ceee	0	\N	2026-11-19 00:26:04.138167+00	2026-11-19 00:26:04.138167+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f7474dd4-9f9a-4bf5-a150-b4b7f9be4635	f73dc64b-8d8e-4563-ac45-6b5bcbad4259	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	0	\N	2026-11-19 00:26:04.128669+00	2026-11-19 00:26:04.128669+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f9f6e6a1-aec4-4242-98fc-0c6de4c91716	ac4359c1-2a67-4610-bb3d-4fcfc37cd368	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	0	\N	2026-11-19 00:26:04.022037+00	2026-11-19 00:26:04.022037+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: StudentDocuments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StudentDocuments" ("Id", "SchoolId", "RegistrationId", "StudentId", "Kind", "FileName", "ContentType", "RelativePath", "Verified", "VerifiedBy", "VerifiedAt", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
13b82ee6-2d13-4d76-8906-d0fe10da15e6	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9e263208-def7-48b8-8ab9-64fe40773765	d42237de-3656-406f-974b-07153aa83221	0	live-photo.jpg	image/jpeg	e6ccef8b-1d05-485d-89de-0c61792eb71c\\87e1bf55-4b87-41d5-bf52-f3f462f88b20\\9e263208-def7-48b8-8ab9-64fe40773765\\Photo-3c35a8909077434ba30dba0c15d61651.jpg	t	admin@school.edu	2026-10-19 02:13:23.335386+00	2026-10-19 02:13:07.579631+00	2026-10-19 02:13:23.335674+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7ca44057-006e-4db9-8c0f-d8eaa37e9a7c	87e1bf55-4b87-41d5-bf52-f3f462f88b20	9e263208-def7-48b8-8ab9-64fe40773765	d42237de-3656-406f-974b-07153aa83221	0	live-photo.jpg	image/jpeg	e6ccef8b-1d05-485d-89de-0c61792eb71c\\87e1bf55-4b87-41d5-bf52-f3f462f88b20\\9e263208-def7-48b8-8ab9-64fe40773765\\Photo-be101545b5e045ffbe2292be412d7eb0.jpg	t	admin@school.edu	2026-10-19 02:13:25.866454+00	2026-10-19 02:13:12.410887+00	2026-10-19 02:13:25.866657+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4f3412b4-da05-4815-9353-931c14bc52a9	87e1bf55-4b87-41d5-bf52-f3f462f88b20	98a48776-0232-4813-a75d-7ee20d5d9605	c6e430f3-2ab1-446a-855a-9d74b927b04e	0	live-photo.jpg	image/jpeg	e6ccef8b-1d05-485d-89de-0c61792eb71c\\87e1bf55-4b87-41d5-bf52-f3f462f88b20\\98a48776-0232-4813-a75d-7ee20d5d9605\\Photo-f6a9744b5fac464a91c3cc61602eb083.jpg	t	admin@school.edu	2026-10-20 05:23:39.60302+00	2026-10-20 05:23:36.940101+00	2026-10-20 05:23:39.603286+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7dcff290-bc06-4408-a116-76b71aa261d8	87e1bf55-4b87-41d5-bf52-f3f462f88b20	98a48776-0232-4813-a75d-7ee20d5d9605	c6e430f3-2ab1-446a-855a-9d74b927b04e	2	Campaign Template for Level 3 Oxford.pdf	application/pdf	e6ccef8b-1d05-485d-89de-0c61792eb71c\\87e1bf55-4b87-41d5-bf52-f3f462f88b20\\98a48776-0232-4813-a75d-7ee20d5d9605\\TransferCertificate-88538fff45cb4be4888d5bbed198eb19.pdf	t	admin@school.edu	2026-10-20 05:24:18.491752+00	2026-10-20 05:24:16.006985+00	2026-10-20 05:24:18.491882+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
464bcc51-0509-41a7-9027-2937f8c3dbe8	87e1bf55-4b87-41d5-bf52-f3f462f88b20	4ec74ee9-d925-4a97-ba02-a30d6e9c8204	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	0	live-photo.jpg	image/jpeg	e6ccef8b-1d05-485d-89de-0c61792eb71c/87e1bf55-4b87-41d5-bf52-f3f462f88b20/4ec74ee9-d925-4a97-ba02-a30d6e9c8204/Photo-d228c2fdb8884e139089d677d9dbc255.jpg	t	admin@school.edu	2026-11-10 01:26:27.697554+00	2026-11-10 01:26:25.126168+00	2026-11-10 01:26:27.697733+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: StudentEnrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StudentEnrollments" ("Id", "StudentId", "AcademicYearId", "ClassId", "SectionId", "RollNumber", "EffectiveFrom", "EffectiveTo", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
f0232ee0-62f7-45c9-8ce4-3093942bb59b	9d57d8a2-fc65-44ef-8025-b3d4be391ae0	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	982821c7-5a81-41ec-80c1-12f657393406	1	2026-06-01	\N	2026-10-15 03:09:18.933677+00	2026-10-15 03:09:18.933678+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
234ba757-945b-4801-be77-d6264971bc73	67557cfc-aec9-4812-a65a-439ba467ceee	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	3	2026-06-01	\N	2026-10-16 03:46:57.736236+00	2026-10-16 03:46:57.736236+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
39dd9b2b-b66f-4bd6-adce-a245edf90e7e	f703d44d-f09d-4977-9303-302f4ad75930	f277962c-327e-47e2-b622-a49bbe4b85a9	6ffaa108-2264-452d-b7f3-65479ece1729	19a2f070-f32c-462a-acb4-5c1bf814c93f	2	2026-06-01	\N	2026-10-16 03:46:57.76699+00	2026-10-16 03:46:57.766991+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
423957f5-dbe0-4998-a526-90893c0b6df9	ae9724fd-b9ea-484f-87cb-6583084d0384	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	982821c7-5a81-41ec-80c1-12f657393406	2	2026-06-01	\N	2026-10-16 03:46:57.754514+00	2026-10-16 03:46:57.754515+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8256ba9b-8404-4c6b-99eb-8e3df2c04c8f	a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	2	2026-06-01	\N	2026-10-16 03:46:57.549357+00	2026-10-16 03:46:57.549358+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
87def5d8-a7c9-4750-9725-f37219b3840e	e4d23eec-99b5-41a5-9192-c7763b083070	f277962c-327e-47e2-b622-a49bbe4b85a9	6ffaa108-2264-452d-b7f3-65479ece1729	19a2f070-f32c-462a-acb4-5c1bf814c93f	3	2026-06-01	\N	2026-10-16 03:46:57.771223+00	2026-10-16 03:46:57.771224+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
972d575b-d5b7-4ed0-89f5-931304c10149	d2b219d2-e689-4088-b943-2704584f82ea	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	4	2026-06-01	\N	2026-10-16 03:46:57.745619+00	2026-10-16 03:46:57.745619+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b65903f4-7270-42a6-95ed-5267b77039d7	a8110ca5-c889-4192-afbe-b04f3241df03	f277962c-327e-47e2-b622-a49bbe4b85a9	6ffaa108-2264-452d-b7f3-65479ece1729	19a2f070-f32c-462a-acb4-5c1bf814c93f	1	2026-06-01	\N	2026-10-16 03:46:57.761635+00	2026-10-16 03:46:57.761636+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c5d41c4a-53e4-4e71-8f0a-9ac8234ab557	76e0df35-586b-402b-acd4-39b55c3db779	f277962c-327e-47e2-b622-a49bbe4b85a9	6ffaa108-2264-452d-b7f3-65479ece1729	19a2f070-f32c-462a-acb4-5c1bf814c93f	4	2026-06-01	\N	2026-10-16 03:46:57.775399+00	2026-10-16 03:46:57.775399+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
eff2b4f4-29d6-4e06-a265-05a616b835b4	50eafd3b-e33e-466e-8f14-c977ec0cf85d	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	982821c7-5a81-41ec-80c1-12f657393406	1	2026-06-01	\N	2026-10-16 03:46:57.748978+00	2026-10-16 03:46:57.748978+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
abff6a2e-16af-4acf-9d6d-1a05061dc60f	703b97eb-767c-4976-baaf-065cce573a67	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-18	\N	2026-10-18 11:32:44.001851+00	2026-10-18 11:32:44.001851+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e682413a-8e73-435e-a8e6-cb5a42490a36	d42237de-3656-406f-974b-07153aa83221	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-10-19	\N	2026-10-19 02:12:21.938525+00	2026-10-19 02:12:21.938526+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7c00b59d-8a1e-4bdc-b31c-6a1fcbfce363	c6e430f3-2ab1-446a-855a-9d74b927b04e	f277962c-327e-47e2-b622-a49bbe4b85a9	310dc35d-196a-433e-b20d-aab069d535cc	82ac6cb1-bf14-4f41-a2a9-8f3910101a5a	\N	2026-10-20	\N	2026-10-20 05:23:22.788488+00	2026-10-20 05:23:22.788488+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
1f1030c6-5318-49bb-b8e9-71c9f4bfb5b6	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	\N	2026-11-10	\N	2026-11-10 01:26:04.29782+00	2026-11-10 01:26:04.29782+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: StudentGuardians; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StudentGuardians" ("Id", "StudentId", "GuardianId", "Relationship", "IsPrimary", "CanPickup", "ReceivesNotifications", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
1290ec8b-45a1-4c6b-8acd-86e7fa345feb	9d57d8a2-fc65-44ef-8025-b3d4be391ae0	2bc239c1-edc3-4ab7-a13b-bad2700f91b6	Mother	t	t	t	2026-10-15 03:09:19.112254+00	2026-10-15 03:09:19.112254+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
5f268c1f-30a0-4ad5-b623-af728b88be45	703b97eb-767c-4976-baaf-065cce573a67	73a6b99a-13e8-4bc8-a1b9-f3aba24811fb	Mother	t	f	t	2026-10-18 11:32:44.004634+00	2026-10-18 11:32:44.004634+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e822bbec-97f5-4cd7-b4b2-e6a51a080c7a	d42237de-3656-406f-974b-07153aa83221	456d2665-1b89-4507-80b4-867d21299367	Parent	t	f	t	2026-10-19 02:12:21.943585+00	2026-10-19 02:12:21.943586+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
46e5b0fa-76e9-45f1-892b-6ba328b980f3	c6e430f3-2ab1-446a-855a-9d74b927b04e	514b156f-102e-444e-ac2c-03abbdc21a1f	Father	t	f	t	2026-10-20 05:23:22.797422+00	2026-10-20 05:23:22.797423+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
90d4eea8-7c29-4c24-940f-e4fad5fe7672	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	e25445bb-093d-44b5-beaf-35d8cf750c9c	Parent	t	f	t	2026-11-10 01:26:04.298562+00	2026-11-10 01:26:04.298562+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: StudentRegistrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StudentRegistrations" ("Id", "SchoolId", "AcademicYearId", "RegistrationNumber", "FirstName", "LastName", "DateOfBirth", "Gender", "PreferredClassId", "PreferredSectionId", "GuardianName", "GuardianPhone", "GuardianEmail", "Relationship", "RegistrationFeeAmount", "FeePaid", "FeeReceiptNumber", "Status", "StudentId", "AdmissionNumber", "BonafideNumber", "PhotoUrl", "ConfirmedBy", "ConfirmedAt", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
77272bd5-2818-4165-84a6-f02de0d4f31f	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	REG-2026-0001	Kiara	Shah	2015-04-21	Female	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	Meera Shah	9876500123	meera.shah@example.com	Mother	2500	t	RFE-2026-7465D6	2	703b97eb-767c-4976-baaf-065cce573a67	STU-2026-0011	\N	\N	admin@school.edu	2026-10-18 11:32:44.250496+00	2026-10-18 11:32:43.651118+00	2026-10-18 11:32:44.262967+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9e263208-def7-48b8-8ab9-64fe40773765	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	REG-2026-0002	Dev	Iyer	2015-08-09	Female	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	Anjali Iyer	9876500999		Parent	2500	t	RFE-2026-3B4224	2	d42237de-3656-406f-974b-07153aa83221	STU-2026-0012	\N	/uploads/e6ccef8b-1d05-485d-89de-0c61792eb71c/87e1bf55-4b87-41d5-bf52-f3f462f88b20/9e263208-def7-48b8-8ab9-64fe40773765/Photo-be101545b5e045ffbe2292be412d7eb0.jpg	admin@school.edu	2026-10-19 02:12:22.205313+00	2026-10-18 12:11:12.427646+00	2026-10-19 02:13:12.411273+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
98a48776-0232-4813-a75d-7ee20d5d9605	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	REG-2026-0003	SourishReddy	n	2012-09-28	Male	310dc35d-196a-433e-b20d-aab069d535cc	82ac6cb1-bf14-4f41-a2a9-8f3910101a5a	samba	9160871719	nssreddy@live.com	Father	2500	t	RFE-2026-D00F62	2	c6e430f3-2ab1-446a-855a-9d74b927b04e	STU-2026-0013	BON-2026-0001	/uploads/e6ccef8b-1d05-485d-89de-0c61792eb71c/87e1bf55-4b87-41d5-bf52-f3f462f88b20/98a48776-0232-4813-a75d-7ee20d5d9605/Photo-f6a9744b5fac464a91c3cc61602eb083.jpg	admin@school.edu	2026-10-20 05:23:22.985649+00	2026-10-20 05:23:05.819714+00	2026-10-20 05:24:24.180424+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4ec74ee9-d925-4a97-ba02-a30d6e9c8204	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	REG-2026-0004	SourishReddy	n	2012-09-28	Female	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	samba	9160871719	nssreddy@live.com	Parent	2500	t	RFE-2026-2F8706	2	e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	STU-2026-0014	\N	/uploads/e6ccef8b-1d05-485d-89de-0c61792eb71c/87e1bf55-4b87-41d5-bf52-f3f462f88b20/4ec74ee9-d925-4a97-ba02-a30d6e9c8204/Photo-d228c2fdb8884e139089d677d9dbc255.jpg	admin@school.edu	2026-11-10 01:26:04.414661+00	2026-11-10 01:25:29.212298+00	2026-11-10 01:26:25.183131+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Students" ("Id", "SchoolId", "StudentCode", "FirstName", "LastName", "DateOfBirth", "PhotoUrl", "Status", "UserId", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
9d57d8a2-fc65-44ef-8025-b3d4be391ae0	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0001	Aarav	Mehta	2014-04-12	\N	2	eb7aba08-1f42-4b51-b2b0-df2c78cb5a67	2026-10-15 03:09:18.843779+00	2026-10-15 03:09:18.843779+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
50eafd3b-e33e-466e-8f14-c977ec0cf85d	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0005	Ishaan	Nair	2014-01-15	\N	2	\N	2026-10-16 03:46:57.748611+00	2026-10-16 03:46:57.748611+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
76e0df35-586b-402b-acd4-39b55c3db779	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0010	Zara	Ali	2014-01-15	\N	2	\N	2026-10-16 03:46:57.775059+00	2026-10-16 03:46:57.775059+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a8110ca5-c889-4192-afbe-b04f3241df03	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0007	Vivaan	Patel	2014-01-15	\N	2	\N	2026-10-16 03:46:57.761271+00	2026-10-16 03:46:57.761271+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ae9724fd-b9ea-484f-87cb-6583084d0384	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0006	Meera	Gupta	2014-01-15	\N	2	\N	2026-10-16 03:46:57.753785+00	2026-10-16 03:46:57.753785+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e4d23eec-99b5-41a5-9192-c7763b083070	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0009	Arjun	Iyer	2014-01-15	\N	2	\N	2026-10-16 03:46:57.770882+00	2026-10-16 03:46:57.770882+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f703d44d-f09d-4977-9303-302f4ad75930	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0008	Sara	Khan	2014-01-15	\N	2	\N	2026-10-16 03:46:57.766183+00	2026-10-16 03:46:57.766183+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
703b97eb-767c-4976-baaf-065cce573a67	87e1bf55-4b87-41d5-bf52-f3f462f88b20	STU-2026-0011	Kiara	Shah	2015-04-21	\N	2	\N	2026-10-18 11:32:44.000707+00	2026-10-18 11:32:45.070752+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c6e430f3-2ab1-446a-855a-9d74b927b04e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	STU-2026-0013	SourishReddy	n	2012-09-28	\N	2	\N	2026-10-20 05:23:22.787096+00	2026-10-20 05:23:22.787096+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d42237de-3656-406f-974b-07153aa83221	87e1bf55-4b87-41d5-bf52-f3f462f88b20	STU-2026-0012	Dev	Iyer	2015-08-09	\N	2	\N	2026-10-19 02:12:21.933889+00	2026-10-30 02:52:31.358725+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a0f4fe6e-2e23-46fe-b2cc-f64c2cd4f836	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0002	Diya	Rao	2014-01-15	\N	2	\N	2026-10-16 03:46:57.539881+00	2026-10-30 02:52:32.620909+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
67557cfc-aec9-4812-a65a-439ba467ceee	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0003	Kabir	Shah	2014-01-15	\N	2	\N	2026-10-16 03:46:57.735724+00	2026-10-30 02:52:33.837324+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d2b219d2-e689-4088-b943-2704584f82ea	87e1bf55-4b87-41d5-bf52-f3f462f88b20	BF0004	Ananya	Reddy	2014-01-15	data:image/jpeg;base64,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	2	\N	2026-10-16 03:46:57.745253+00	2026-10-30 03:33:43.182196+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e38bcc3f-98bb-4ae5-b9bd-7bf3f62e1b91	87e1bf55-4b87-41d5-bf52-f3f462f88b20	STU-2026-0014	SourishReddy	n	2012-09-28	\N	2	\N	2026-11-10 01:26:04.29722+00	2026-11-10 01:26:04.29722+00	admin@school.edu	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Subjects" ("Id", "SchoolId", "Name", "Code", "IsLanguage", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
01321fba-cecf-4b52-a929-d661331a21e6	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Mathematics	MATH	f	2026-10-12 04:07:14.452744+00	2026-10-12 04:07:14.452744+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
14a9b135-6166-4ead-83ce-601b9d70cce7	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Social Studies	SS	f	2026-10-12 04:07:14.452847+00	2026-10-12 04:07:14.452847+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6fcdc2b2-98a7-4415-9c31-6a617af47dab	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Hindi	HIN	t	2026-10-12 04:07:14.452845+00	2026-10-12 04:07:14.452845+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9ea6dc93-764d-4d5e-bfdf-171a267ef5ec	87e1bf55-4b87-41d5-bf52-f3f462f88b20	English	ENG	f	2026-10-12 04:07:14.452831+00	2026-10-12 04:07:14.452831+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f7a7b34b-c723-4052-a6a7-36159d40e939	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Science	SCI	f	2026-10-12 04:07:14.452829+00	2026-10-12 04:07:14.452829+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f9347a13-a653-4ea5-9577-523511a28637	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Telugu	TEL	t	2026-10-12 04:07:14.452832+00	2026-10-12 04:07:14.452832+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
379bcfb8-ff47-419b-b664-b89987bd3073	87e1bf55-4b87-41d5-bf52-f3f462f88b20	P.T.	PT	f	2026-10-18 12:44:17.513486+00	2026-10-18 12:44:17.513486+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f8612996-26d0-4611-b845-1de1749e2e5d	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Craft	CRAFT	f	2026-10-18 12:44:17.674371+00	2026-10-18 12:44:17.674371+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c63b5af5-46f8-4375-b8af-96531c969145	87e1bf55-4b87-41d5-bf52-f3f462f88b20	Karate	KARATE	f	2026-10-18 12:44:17.683062+00	2026-10-18 12:44:17.683062+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: SubstitutionNeeds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SubstitutionNeeds" ("Id", "SchoolId", "LeaveRequestId", "TimetableSlotId", "Date", "PeriodId", "ClassId", "SectionId", "SubjectId", "OriginalEmployeeId", "SubstituteEmployeeId", "Status", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
c2430fba-4f01-4dfd-8c1b-115cecfc5a7d	87e1bf55-4b87-41d5-bf52-f3f462f88b20	ff997bfa-59d9-46ff-b914-0c4f47b6897d	036c7639-00c0-4dda-ac74-db196bf2805c	2026-10-19	04473184-02c6-4136-a87e-6280f8d56ddd	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	ac4b7f02-9789-45c2-afcd-e9a50e46c036	1	2026-10-18 12:44:59.034569+00	2026-10-18 12:44:59.505231+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ad0efaff-d5b6-48ed-bd8b-5a7a565a8470	87e1bf55-4b87-41d5-bf52-f3f462f88b20	ff997bfa-59d9-46ff-b914-0c4f47b6897d	8f11115b-a8f8-414d-93e2-339a4af8f69f	2026-10-19	5559c227-58f8-4f74-afe5-ee83377db20a	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	379bcfb8-ff47-419b-b664-b89987bd3073	9d98a8a7-4274-4f2d-9086-7533a8326272	ac4b7f02-9789-45c2-afcd-e9a50e46c036	1	2026-10-18 12:44:59.085813+00	2026-10-18 12:46:07.502437+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: TeacherAssignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeacherAssignments" ("Id", "AcademicYearId", "EmployeeId", "SubjectId", "ClassId", "SectionId", "CanTakeAttendance", "CanSetHomework", "CanEnterMarks", "IsActive", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId", "ElectiveGroup", "PeriodSlot") FROM stdin;
459314db-bb64-4ae7-a801-539cddd11a50	f277962c-327e-47e2-b622-a49bbe4b85a9	9d98a8a7-4274-4f2d-9086-7533a8326272	01321fba-cecf-4b52-a929-d661331a21e6	3bffe181-4bf0-499c-b271-9f3f7b128f5c	982821c7-5a81-41ec-80c1-12f657393406	t	t	t	t	2026-10-16 03:46:57.494279+00	2026-10-16 03:46:57.49428+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	\N	\N
5ea0d860-a55e-4e44-9754-e33c85da77f4	f277962c-327e-47e2-b622-a49bbe4b85a9	9d98a8a7-4274-4f2d-9086-7533a8326272	01321fba-cecf-4b52-a929-d661331a21e6	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	t	t	t	t	2026-10-16 03:46:57.049951+00	2026-10-16 03:46:57.049952+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	\N	\N
d80f161a-ea29-40e2-a3bc-0c1b353d439c	f277962c-327e-47e2-b622-a49bbe4b85a9	ac4b7f02-9789-45c2-afcd-e9a50e46c036	f7a7b34b-c723-4052-a6a7-36159d40e939	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	t	t	t	t	2026-10-16 03:46:57.500544+00	2026-10-16 03:46:57.500544+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	\N	\N
e79f5240-5517-444e-b158-7760a7688ca1	f277962c-327e-47e2-b622-a49bbe4b85a9	ac4b7f02-9789-45c2-afcd-e9a50e46c036	f7a7b34b-c723-4052-a6a7-36159d40e939	6ffaa108-2264-452d-b7f3-65479ece1729	19a2f070-f32c-462a-acb4-5c1bf814c93f	t	t	t	t	2026-10-16 03:46:57.510113+00	2026-10-16 03:46:57.510114+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	\N	\N
2f83d18a-d748-4b32-bdcf-84f0212a0cc6	f277962c-327e-47e2-b622-a49bbe4b85a9	ad17df02-3c39-4c6b-b1e3-edc0ede71ef2	9ea6dc93-764d-4d5e-bfdf-171a267ef5ec	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	t	t	t	t	2026-10-18 11:32:44.763772+00	2026-10-18 11:32:44.763772+00	unknown	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	SmokeGroup	Thu-P9
1170de16-697f-4f2c-ae63-712e36e19a86	f277962c-327e-47e2-b622-a49bbe4b85a9	9d98a8a7-4274-4f2d-9086-7533a8326272	c63b5af5-46f8-4375-b8af-96531c969145	3bffe181-4bf0-499c-b271-9f3f7b128f5c	982821c7-5a81-41ec-80c1-12f657393406	t	t	t	t	2026-10-18 12:44:17.70035+00	2026-10-18 12:44:17.70035+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	\N	\N
82230df8-e583-4282-b544-84ca8eb10f20	f277962c-327e-47e2-b622-a49bbe4b85a9	ac4b7f02-9789-45c2-afcd-e9a50e46c036	f8612996-26d0-4611-b845-1de1749e2e5d	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	t	t	t	t	2026-10-18 12:44:17.698436+00	2026-10-18 12:44:17.698436+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	\N	\N
dcb0021f-ee66-4f48-acee-96051a30560c	f277962c-327e-47e2-b622-a49bbe4b85a9	9d98a8a7-4274-4f2d-9086-7533a8326272	379bcfb8-ff47-419b-b664-b89987bd3073	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	t	t	t	t	2026-10-18 12:44:17.69027+00	2026-10-18 12:44:17.69027+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	\N	\N
985ffcb0-5661-4a44-a655-78c922cb9124	f277962c-327e-47e2-b622-a49bbe4b85a9	ad17df02-3c39-4c6b-b1e3-edc0ede71ef2	f8612996-26d0-4611-b845-1de1749e2e5d	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	t	t	t	t	2026-10-19 02:34:10.375719+00	2026-10-19 02:34:10.375719+00	unknown	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c	\N	\N
\.


--
-- Data for Name: Tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Tenants" ("Id", "Name", "Slug", "IsActive", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted") FROM stdin;
e6ccef8b-1d05-485d-89de-0c61792eb71c	Bright Future School	bright-future	t	2026-10-12 04:07:14.19748+00	2026-10-12 04:07:14.197481+00	\N	\N	f
\.


--
-- Data for Name: TimetablePeriods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TimetablePeriods" ("Id", "SchoolId", "AcademicYearId", "Name", "SortOrder", "StartTime", "EndTime", "Band", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
04473184-02c6-4136-a87e-6280f8d56ddd	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	M1	1	08:00:00	08:45:00	0	2026-10-18 12:44:17.736257+00	2026-10-18 12:44:17.736257+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
3699aea2-ac30-4d93-b9b4-1e59f6b6db59	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	E3	6	12:15:00	13:00:00	1	2026-10-18 12:44:17.770949+00	2026-10-18 12:44:17.770949+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4caaab49-45a6-4f36-b9d6-3b58dd2eaa86	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	E4	7	13:45:00	14:30:00	1	2026-10-18 12:44:17.770962+00	2026-10-18 12:44:17.770962+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
5559c227-58f8-4f74-afe5-ee83377db20a	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	M3	3	09:30:00	10:15:00	0	2026-10-18 12:44:17.770894+00	2026-10-18 12:44:17.770894+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a02c4890-765a-4459-9a8d-9a7c09dadace	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	M2	2	08:45:00	09:30:00	0	2026-10-18 12:44:17.770769+00	2026-10-18 12:44:17.77077+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
a2436a7a-43d0-48bd-bcd4-f77e4f540aed	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	E1	4	10:45:00	11:30:00	1	2026-10-18 12:44:17.770918+00	2026-10-18 12:44:17.770918+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
c91ac7fd-ef0c-4f43-a226-0def0d09422b	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	E2	5	11:30:00	12:15:00	1	2026-10-18 12:44:17.770936+00	2026-10-18 12:44:17.770936+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: TimetableSlots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TimetableSlots" ("Id", "SchoolId", "AcademicYearId", "ClassId", "SectionId", "DayOfWeek", "PeriodId", "SubjectId", "EmployeeId", "ElectiveGroup", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
0f8e3b9b-bfbd-4445-812d-c43175343b3c	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	2	04473184-02c6-4136-a87e-6280f8d56ddd	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.888386+00	2026-10-18 12:44:17.888386+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
332e34cd-7d99-44f5-ad34-013f5b10ddbe	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	3	a2436a7a-43d0-48bd-bcd4-f77e4f540aed	f8612996-26d0-4611-b845-1de1749e2e5d	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.889094+00	2026-10-18 12:44:17.889094+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
413c56f1-cb8a-4668-b13a-3a1fd209a483	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	4	04473184-02c6-4136-a87e-6280f8d56ddd	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.889131+00	2026-10-18 12:44:17.889131+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
44bba782-e556-46b5-b6f2-39e144b93e81	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	2	5559c227-58f8-4f74-afe5-ee83377db20a	379bcfb8-ff47-419b-b664-b89987bd3073	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.888728+00	2026-10-18 12:44:17.888728+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4e88f035-d0ef-4c01-88ee-9b403c16e10a	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	6	a2436a7a-43d0-48bd-bcd4-f77e4f540aed	f8612996-26d0-4611-b845-1de1749e2e5d	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.889697+00	2026-10-18 12:44:17.889697+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
581650dc-46f2-40de-981e-42076c7b1053	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	2	a2436a7a-43d0-48bd-bcd4-f77e4f540aed	f8612996-26d0-4611-b845-1de1749e2e5d	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.888783+00	2026-10-18 12:44:17.888783+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
5b2ee4a4-db64-4eea-8629-0589bb4a8a6b	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	1	a02c4890-765a-4459-9a8d-9a7c09dadace	f7a7b34b-c723-4052-a6a7-36159d40e939	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.887903+00	2026-10-18 12:44:17.887903+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
5f1228ff-a7f5-4999-9be6-6656ee2897b9	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	5	a02c4890-765a-4459-9a8d-9a7c09dadace	f7a7b34b-c723-4052-a6a7-36159d40e939	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.889353+00	2026-10-18 12:44:17.889354+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6a29814f-9cae-487e-b619-cdb0dce6233c	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	5	a2436a7a-43d0-48bd-bcd4-f77e4f540aed	f8612996-26d0-4611-b845-1de1749e2e5d	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.889473+00	2026-10-18 12:44:17.889473+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6f626766-8d54-4378-a1d6-1ad1bb5123cc	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	4	5559c227-58f8-4f74-afe5-ee83377db20a	379bcfb8-ff47-419b-b664-b89987bd3073	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.8892+00	2026-10-18 12:44:17.8892+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
70f1f3c3-f834-4080-8bb9-c0d1446b3e04	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	3	04473184-02c6-4136-a87e-6280f8d56ddd	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.888971+00	2026-10-18 12:44:17.888972+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7a93bf17-46d5-4661-a826-099616875ae9	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	1	a2436a7a-43d0-48bd-bcd4-f77e4f540aed	f8612996-26d0-4611-b845-1de1749e2e5d	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.888303+00	2026-10-18 12:44:17.888304+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
852ba0d0-5dd7-4629-926a-a67f077be952	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	2	a02c4890-765a-4459-9a8d-9a7c09dadace	f7a7b34b-c723-4052-a6a7-36159d40e939	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.888615+00	2026-10-18 12:44:17.888615+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8f11115b-a8f8-414d-93e2-339a4af8f69f	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	1	5559c227-58f8-4f74-afe5-ee83377db20a	379bcfb8-ff47-419b-b664-b89987bd3073	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.888125+00	2026-10-18 12:44:17.888125+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9ea478ae-0f7a-4b15-a472-c218fc1e1ef1	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	6	04473184-02c6-4136-a87e-6280f8d56ddd	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.889523+00	2026-10-18 12:44:17.889523+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b34f0278-10c3-48ae-bf14-52f8c8def14e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	5	04473184-02c6-4136-a87e-6280f8d56ddd	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.889297+00	2026-10-18 12:44:17.889297+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d2d0a09b-faa0-4159-9541-0874b37ca4a7	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	3	a02c4890-765a-4459-9a8d-9a7c09dadace	f7a7b34b-c723-4052-a6a7-36159d40e939	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.889023+00	2026-10-18 12:44:17.889023+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d98cd62a-182a-4a90-88b2-e2e6fde5bd87	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	6	a02c4890-765a-4459-9a8d-9a7c09dadace	f7a7b34b-c723-4052-a6a7-36159d40e939	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.889588+00	2026-10-18 12:44:17.889588+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
df5ecd37-123e-463a-b102-927eed9049bd	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	6	5559c227-58f8-4f74-afe5-ee83377db20a	379bcfb8-ff47-419b-b664-b89987bd3073	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.88964+00	2026-10-18 12:44:17.88964+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
dfc0a683-af67-467f-90f6-99f2e060f8cd	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	4	a2436a7a-43d0-48bd-bcd4-f77e4f540aed	f8612996-26d0-4611-b845-1de1749e2e5d	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.889236+00	2026-10-18 12:44:17.889236+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
e5d6ac85-eb81-4594-88dc-a21f3fe29299	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	3	5559c227-58f8-4f74-afe5-ee83377db20a	379bcfb8-ff47-419b-b664-b89987bd3073	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.889059+00	2026-10-18 12:44:17.889059+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ec3235a0-a131-4499-8440-e3db7c82718e	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	5	5559c227-58f8-4f74-afe5-ee83377db20a	379bcfb8-ff47-419b-b664-b89987bd3073	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.889392+00	2026-10-18 12:44:17.889392+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f4386a03-7ea9-4426-a19f-b6a5a1f94969	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	4	a02c4890-765a-4459-9a8d-9a7c09dadace	f7a7b34b-c723-4052-a6a7-36159d40e939	ac4b7f02-9789-45c2-afcd-e9a50e46c036	\N	2026-10-18 12:44:17.889165+00	2026-10-18 12:44:17.889165+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
036c7639-00c0-4dda-ac74-db196bf2805c	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	1	04473184-02c6-4136-a87e-6280f8d56ddd	f8612996-26d0-4611-b845-1de1749e2e5d	9d98a8a7-4274-4f2d-9086-7533a8326272	\N	2026-10-18 12:44:17.843133+00	2026-10-19 02:34:49.367768+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Trips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Trips" ("Id", "SchoolId", "RouteId", "VehicleId", "DriverId", "TripDate", "StartedAt", "EndedAt", "IsActive", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
\.


--
-- Data for Name: UserRoles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserRoles" ("Id", "UserId", "RoleId", "SchoolId", "ExpiresAt", "GrantedBy", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted") FROM stdin;
f3d6dc7b-1c96-41de-993c-55e76aa36aac	4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	7a3215d8-6176-43bf-8e27-dc4281308999	87e1bf55-4b87-41d5-bf52-f3f462f88b20	\N	seed	2026-10-12 04:07:14.451524+00	2026-10-12 04:07:14.451524+00	\N	\N	f
d48438ea-3b39-4789-b982-7aae04b1bd54	eb7aba08-1f42-4b51-b2b0-df2c78cb5a67	cf87873f-afd5-43c8-bc30-8fa9259fa879	\N	\N	\N	2026-10-14 03:14:06.199073+00	2026-10-14 03:14:06.199073+00	\N	\N	f
3808cd14-6ab4-43bd-8221-634de3714b97	d14aface-ba2e-46a6-b45d-9de5c99ac1e5	3f132259-84d3-4a49-9dfe-7dcf23f4c7b9	\N	\N	\N	2026-10-14 03:14:06.199073+00	2026-10-14 03:14:06.199073+00	\N	\N	f
448626d6-28b4-46aa-9244-f0f5d7d1ac8d	5d7da75c-90d2-4051-86ea-083ce0cd2b88	23cfe9b9-2906-4644-b1e5-5d5b6f442b7c	87e1bf55-4b87-41d5-bf52-f3f462f88b20	\N	seed	2026-10-15 03:09:18.73621+00	2026-10-15 03:09:18.73621+00	\N	\N	f
09654e5a-17b1-4144-b596-46f078d2e5ab	314184ef-5cf0-4589-988d-687eddfd8e3f	de5d6674-8dc2-4e1c-99ed-4cd8f0cf59a2	87e1bf55-4b87-41d5-bf52-f3f462f88b20	\N	seed	2026-10-18 02:32:22.909825+00	2026-10-18 02:32:22.909825+00	\N	\N	f
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Users" ("Id", "Email", "PasswordHash", "FirstName", "LastName", "IsActive", "MfaEnabled", "LastLoginAt", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
eb7aba08-1f42-4b51-b2b0-df2c78cb5a67	student@school.edu	$2a$11$xsGmh3TRpnv.3TvR7AEUZOkmQQi6bQUHWpvYXz0zyfXJL3mwta4kC	Demo	Student	t	f	2026-10-29 02:41:11.477245+00	2026-10-14 03:14:06.199073+00	2026-10-29 02:41:11.548082+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4a4a956f-e6e0-4a3b-8c79-cf1afaba30ab	admin@school.edu	$2a$11$xsGmh3TRpnv.3TvR7AEUZOkmQQi6bQUHWpvYXz0zyfXJL3mwta4kC	School	Admin	t	f	2026-11-19 01:13:32.110872+00	2026-10-12 04:07:14.202341+00	2026-11-19 01:13:32.130684+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
314184ef-5cf0-4589-988d-687eddfd8e3f	frontoffice@school.edu	$2a$11$8BwZhlsvUmtNj9gL4qgCK.QwKDx0Y/AQi.TQ5kviobBNGlo3TLbpu	Neha	Kapoor	t	f	2026-10-18 02:42:47.972445+00	2026-10-18 02:32:22.909415+00	2026-10-18 02:42:47.972713+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
5d7da75c-90d2-4051-86ea-083ce0cd2b88	parent@school.edu	$2a$11$yrxjx4ptuxlYdbF5Tja.2Ohj14iScXCn3yxZ2xh.bRW0hxX4gb0zW	Priya	Mehta	t	f	2026-10-21 03:09:43.118082+00	2026-10-15 03:09:18.735665+00	2026-10-21 03:09:43.11821+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d14aface-ba2e-46a6-b45d-9de5c99ac1e5	teacher@school.edu	$2a$11$xsGmh3TRpnv.3TvR7AEUZOkmQQi6bQUHWpvYXz0zyfXJL3mwta4kC	Demo	Teacher	t	f	2026-10-21 03:11:29.492421+00	2026-10-14 03:14:06.199073+00	2026-10-21 03:11:29.494325+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: Vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Vehicles" ("Id", "SchoolId", "RegistrationNumber", "Capacity", "InsuranceExpiry", "FitnessExpiry", "IsActive", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
\.


--
-- Data for Name: WeeklyLessonPlanDays; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WeeklyLessonPlanDays" ("Id", "PlanId", "DayOfWeek", "Topic", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
69361a21-a768-489e-a440-60e0e86cc2d5	977a9897-0d71-4cb4-bdef-4e858e229e47	2	Smoke topic Tue	2026-10-18 12:47:00.19514+00	2026-10-18 12:47:00.19514+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
d576109d-985d-429e-80df-e82b1eaab28f	977a9897-0d71-4cb4-bdef-4e858e229e47	1	Smoke topic Mon	2026-10-18 12:47:00.158574+00	2026-10-18 12:47:00.158575+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2ebd3f73-423d-494a-bdeb-03ffca74895b	2c4d39e3-aeb1-45ab-b394-575e57781219	1	Fractions — like and unlike	2026-10-20 05:12:37.795153+00	2026-10-20 05:12:37.795154+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6b348069-997f-498c-9593-63a38b7947aa	2c4d39e3-aeb1-45ab-b394-575e57781219	4	Word problems	2026-10-20 05:12:37.795218+00	2026-10-20 05:12:37.795218+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
7cf9b06b-be8f-4140-bb06-948cd2e5a7e5	2c4d39e3-aeb1-45ab-b394-575e57781219	6	Weekly recap quiz	2026-10-20 05:12:37.795218+00	2026-10-20 05:12:37.795218+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
93fb9e98-d979-413a-9f6b-4c983cc2d41d	2c4d39e3-aeb1-45ab-b394-575e57781219	2	Equivalent fractions	2026-10-20 05:12:37.795217+00	2026-10-20 05:12:37.795217+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
9f157970-a872-4a3c-aa0f-2fcca4cd4087	2c4d39e3-aeb1-45ab-b394-575e57781219	3	Adding fractions	2026-10-20 05:12:37.795217+00	2026-10-20 05:12:37.795217+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
df07c10e-fab3-4f63-896d-7ed0dae76f05	2c4d39e3-aeb1-45ab-b394-575e57781219	5	Practice worksheet	2026-10-20 05:12:37.795218+00	2026-10-20 05:12:37.795218+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
317ff518-61d8-438a-8788-882ff4d80eaa	828aacac-5437-4024-aeff-cf9a710da7fe	4	Word problems	2026-10-27 02:36:06.746044+00	2026-10-27 02:36:06.746044+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
812e7c76-658b-4054-af83-221f6ac7d46c	828aacac-5437-4024-aeff-cf9a710da7fe	1	Fractions — like and unlike	2026-10-27 02:36:06.746006+00	2026-10-27 02:36:06.746006+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
819ed8df-9842-4e27-bdf3-9bf860e80bf7	828aacac-5437-4024-aeff-cf9a710da7fe	6	Weekly recap quiz	2026-10-27 02:36:06.746046+00	2026-10-27 02:36:06.746046+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b63e3680-b52b-48e8-8a45-8950ecf30aab	828aacac-5437-4024-aeff-cf9a710da7fe	3	Adding fractions	2026-10-27 02:36:06.746044+00	2026-10-27 02:36:06.746044+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
becc879f-268b-4f2e-956a-d625b2691149	828aacac-5437-4024-aeff-cf9a710da7fe	2	Equivalent fractions	2026-10-27 02:36:06.746043+00	2026-10-27 02:36:06.746043+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
de57ce3a-6584-42d0-9112-e3eb7386580d	828aacac-5437-4024-aeff-cf9a710da7fe	5	Practice worksheet	2026-10-27 02:36:06.746045+00	2026-10-27 02:36:06.746045+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
14fdde7a-fd50-43f5-92fe-f06cfc7e4f69	b9f8fc62-0aa0-441e-b7a7-c8c953bd2550	5	Practice worksheet	2026-11-02 01:23:11.772519+00	2026-11-02 01:23:11.772519+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2606f9ce-b66c-4720-b6e0-7dc91786b8f1	b9f8fc62-0aa0-441e-b7a7-c8c953bd2550	1	Fractions — like and unlike	2026-11-02 01:23:11.772492+00	2026-11-02 01:23:11.772492+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
6ab0a344-659c-4769-a9e5-2a3cab52ae22	b9f8fc62-0aa0-441e-b7a7-c8c953bd2550	4	Word problems	2026-11-02 01:23:11.772519+00	2026-11-02 01:23:11.772519+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
94719181-5c2c-4d34-884d-ec3ca5a02538	b9f8fc62-0aa0-441e-b7a7-c8c953bd2550	6	Weekly recap quiz	2026-11-02 01:23:11.77252+00	2026-11-02 01:23:11.77252+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
aede88df-d9cf-4054-b5ec-f7fc36b36af6	b9f8fc62-0aa0-441e-b7a7-c8c953bd2550	3	Adding fractions	2026-11-02 01:23:11.772518+00	2026-11-02 01:23:11.772518+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
bbf73043-8d19-4d86-8580-2cc58830e3ec	b9f8fc62-0aa0-441e-b7a7-c8c953bd2550	2	Equivalent fractions	2026-11-02 01:23:11.772517+00	2026-11-02 01:23:11.772518+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
00de1692-0ba7-499c-91a8-01f2f5f6ea3c	4044ef14-7070-4d97-8c6d-f77fc8a263f5	3	Adding fractions	2026-11-10 00:02:04.421532+00	2026-11-10 00:02:04.421532+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
25d617b2-1507-4404-8a93-e45909021915	4044ef14-7070-4d97-8c6d-f77fc8a263f5	4	Word problems	2026-11-10 00:02:04.421533+00	2026-11-10 00:02:04.421533+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2e0b2a4f-3a22-4eb6-8ee2-165174e64f0a	4044ef14-7070-4d97-8c6d-f77fc8a263f5	6	Weekly recap quiz	2026-11-10 00:02:04.421534+00	2026-11-10 00:02:04.421534+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b4d8e693-dd19-465b-9f9c-dbfc7a035d4f	4044ef14-7070-4d97-8c6d-f77fc8a263f5	5	Practice worksheet	2026-11-10 00:02:04.421533+00	2026-11-10 00:02:04.421533+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
de9be750-a65e-4143-9934-7702b882b2cd	4044ef14-7070-4d97-8c6d-f77fc8a263f5	1	Fractions — like and unlike	2026-11-10 00:02:04.421507+00	2026-11-10 00:02:04.421508+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
f4629090-92da-42b0-b1fb-0089fc82541b	4044ef14-7070-4d97-8c6d-f77fc8a263f5	2	Equivalent fractions	2026-11-10 00:02:04.421531+00	2026-11-10 00:02:04.421531+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
458708be-4301-411f-8562-759e3206a69e	4c0ce304-163a-4444-a3c8-73c4746ed465	1	Fractions — like and unlike	2026-11-16 03:24:23.83014+00	2026-11-16 03:24:23.83014+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
710836f4-e574-49a1-9a79-b77da3247184	4c0ce304-163a-4444-a3c8-73c4746ed465	4	Word problems	2026-11-16 03:24:23.83018+00	2026-11-16 03:24:23.83018+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
79712fac-5bfb-4430-ba76-808d7adb291c	4c0ce304-163a-4444-a3c8-73c4746ed465	2	Equivalent fractions	2026-11-16 03:24:23.830178+00	2026-11-16 03:24:23.830178+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
8060d57f-623a-4e9a-9f2e-7689b422fa46	4c0ce304-163a-4444-a3c8-73c4746ed465	5	Practice worksheet	2026-11-16 03:24:23.830181+00	2026-11-16 03:24:23.830181+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
95cd7c44-5be6-4d9e-9367-0d0a53592d73	4c0ce304-163a-4444-a3c8-73c4746ed465	6	Weekly recap quiz	2026-11-16 03:24:23.830182+00	2026-11-16 03:24:23.830182+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
ea1f719b-8906-4c92-8008-addad3a86aa1	4c0ce304-163a-4444-a3c8-73c4746ed465	3	Adding fractions	2026-11-16 03:24:23.830179+00	2026-11-16 03:24:23.830179+00	\N	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: WeeklyLessonPlans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WeeklyLessonPlans" ("Id", "SchoolId", "AcademicYearId", "WeekStart", "ClassId", "SectionId", "SubjectId", "EmployeeId", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted", "TenantId") FROM stdin;
977a9897-0d71-4cb4-bdef-4e858e229e47	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	2026-10-12	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	2026-10-18 12:44:17.89775+00	2026-10-18 12:44:17.89775+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
2c4d39e3-aeb1-45ab-b394-575e57781219	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	2026-10-19	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	2026-10-20 05:12:37.794835+00	2026-10-20 05:12:37.794835+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
828aacac-5437-4024-aeff-cf9a710da7fe	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	2026-10-26	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	2026-10-27 02:36:06.745687+00	2026-10-27 02:36:06.745687+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
b9f8fc62-0aa0-441e-b7a7-c8c953bd2550	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	2026-11-02	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	2026-11-02 01:23:11.772353+00	2026-11-02 01:23:11.772353+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4044ef14-7070-4d97-8c6d-f77fc8a263f5	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	2026-11-09	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	2026-11-10 00:02:04.421339+00	2026-11-10 00:02:04.42134+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
4c0ce304-163a-4444-a3c8-73c4746ed465	87e1bf55-4b87-41d5-bf52-f3f462f88b20	f277962c-327e-47e2-b622-a49bbe4b85a9	2026-11-16	3bffe181-4bf0-499c-b271-9f3f7b128f5c	e2c738e5-7d63-4e41-ac98-2d546c0adf33	01321fba-cecf-4b52-a929-d661331a21e6	9d98a8a7-4274-4f2d-9086-7533a8326272	2026-11-16 03:24:23.829926+00	2026-11-16 03:24:23.829926+00	seed	\N	f	e6ccef8b-1d05-485d-89de-0c61792eb71c
\.


--
-- Data for Name: __EFMigrationsHistory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."__EFMigrationsHistory" ("MigrationId", "ProductVersion") FROM stdin;
20261012040539_InitialCreate	10.0.4
20261015080000_AddSchoolLocaleCurrency	10.0.4
20261016011244_AddIntegrationsAndAnnouncements	10.0.4
20261016034511_AddPayrollAndEmployeeSalary	10.0.4
20261018023133_AddEnquiryOtp	10.0.4
20261018111920_AddRegistrationsAndDocuments	10.0.4
20261018124354_AddTimetableLeaveDiary	10.0.4
20261019014530_AddAcademicOpsUniqueness	10.0.4
20261020023136_AddWeeklyPlanDeadline	10.0.4
20261030033000_AddEmployeePhotoUrl	10.0.4
\.


--
-- Name: AcademicYears PK_AcademicYears; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademicYears"
    ADD CONSTRAINT "PK_AcademicYears" PRIMARY KEY ("Id");


--
-- Name: AttendanceSessions PK_AttendanceSessions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSessions"
    ADD CONSTRAINT "PK_AttendanceSessions" PRIMARY KEY ("Id");


--
-- Name: AuditEvents PK_AuditEvents; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditEvents"
    ADD CONSTRAINT "PK_AuditEvents" PRIMARY KEY ("Id");


--
-- Name: Campuses PK_Campuses; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campuses"
    ADD CONSTRAINT "PK_Campuses" PRIMARY KEY ("Id");


--
-- Name: ClassDiaries PK_ClassDiaries; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassDiaries"
    ADD CONSTRAINT "PK_ClassDiaries" PRIMARY KEY ("Id");


--
-- Name: Classes PK_Classes; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Classes"
    ADD CONSTRAINT "PK_Classes" PRIMARY KEY ("Id");


--
-- Name: Departments PK_Departments; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Departments"
    ADD CONSTRAINT "PK_Departments" PRIMARY KEY ("Id");


--
-- Name: Designations PK_Designations; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Designations"
    ADD CONSTRAINT "PK_Designations" PRIMARY KEY ("Id");


--
-- Name: EmployeeAttendances PK_EmployeeAttendances; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeAttendances"
    ADD CONSTRAINT "PK_EmployeeAttendances" PRIMARY KEY ("Id");


--
-- Name: Employees PK_Employees; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employees"
    ADD CONSTRAINT "PK_Employees" PRIMARY KEY ("Id");


--
-- Name: Enquiries PK_Enquiries; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Enquiries"
    ADD CONSTRAINT "PK_Enquiries" PRIMARY KEY ("Id");


--
-- Name: EnquiryActivities PK_EnquiryActivities; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EnquiryActivities"
    ADD CONSTRAINT "PK_EnquiryActivities" PRIMARY KEY ("Id");


--
-- Name: EnquiryOtpChallenges PK_EnquiryOtpChallenges; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EnquiryOtpChallenges"
    ADD CONSTRAINT "PK_EnquiryOtpChallenges" PRIMARY KEY ("Id");


--
-- Name: Examinations PK_Examinations; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Examinations"
    ADD CONSTRAINT "PK_Examinations" PRIMARY KEY ("Id");


--
-- Name: FeeCategories PK_FeeCategories; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeeCategories"
    ADD CONSTRAINT "PK_FeeCategories" PRIMARY KEY ("Id");


--
-- Name: FeeStructures PK_FeeStructures; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeeStructures"
    ADD CONSTRAINT "PK_FeeStructures" PRIMARY KEY ("Id");


--
-- Name: Guardians PK_Guardians; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Guardians"
    ADD CONSTRAINT "PK_Guardians" PRIMARY KEY ("Id");


--
-- Name: HomeworkSubmissions PK_HomeworkSubmissions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HomeworkSubmissions"
    ADD CONSTRAINT "PK_HomeworkSubmissions" PRIMARY KEY ("Id");


--
-- Name: Homeworks PK_Homeworks; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Homeworks"
    ADD CONSTRAINT "PK_Homeworks" PRIMARY KEY ("Id");


--
-- Name: IntegrationSettings PK_IntegrationSettings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntegrationSettings"
    ADD CONSTRAINT "PK_IntegrationSettings" PRIMARY KEY ("Id");


--
-- Name: LeaveRequests PK_LeaveRequests; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequests"
    ADD CONSTRAINT "PK_LeaveRequests" PRIMARY KEY ("Id");


--
-- Name: LeaveTypes PK_LeaveTypes; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveTypes"
    ADD CONSTRAINT "PK_LeaveTypes" PRIMARY KEY ("Id");


--
-- Name: MarkEntries PK_MarkEntries; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MarkEntries"
    ADD CONSTRAINT "PK_MarkEntries" PRIMARY KEY ("Id");


--
-- Name: NotificationMessages PK_NotificationMessages; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NotificationMessages"
    ADD CONSTRAINT "PK_NotificationMessages" PRIMARY KEY ("Id");


--
-- Name: Payments PK_Payments; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "PK_Payments" PRIMARY KEY ("Id");


--
-- Name: PayrollRuns PK_PayrollRuns; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollRuns"
    ADD CONSTRAINT "PK_PayrollRuns" PRIMARY KEY ("Id");


--
-- Name: Payslips PK_Payslips; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payslips"
    ADD CONSTRAINT "PK_Payslips" PRIMARY KEY ("Id");


--
-- Name: Roles PK_Roles; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "PK_Roles" PRIMARY KEY ("Id");


--
-- Name: RouteStops PK_RouteStops; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RouteStops"
    ADD CONSTRAINT "PK_RouteStops" PRIMARY KEY ("Id");


--
-- Name: Routes PK_Routes; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Routes"
    ADD CONSTRAINT "PK_Routes" PRIMARY KEY ("Id");


--
-- Name: SchoolAcademicSettings PK_SchoolAcademicSettings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolAcademicSettings"
    ADD CONSTRAINT "PK_SchoolAcademicSettings" PRIMARY KEY ("Id");


--
-- Name: SchoolAnnouncements PK_SchoolAnnouncements; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolAnnouncements"
    ADD CONSTRAINT "PK_SchoolAnnouncements" PRIMARY KEY ("Id");


--
-- Name: Schools PK_Schools; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schools"
    ADD CONSTRAINT "PK_Schools" PRIMARY KEY ("Id");


--
-- Name: Sections PK_Sections; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sections"
    ADD CONSTRAINT "PK_Sections" PRIMARY KEY ("Id");


--
-- Name: StudentAttendances PK_StudentAttendances; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentAttendances"
    ADD CONSTRAINT "PK_StudentAttendances" PRIMARY KEY ("Id");


--
-- Name: StudentDocuments PK_StudentDocuments; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentDocuments"
    ADD CONSTRAINT "PK_StudentDocuments" PRIMARY KEY ("Id");


--
-- Name: StudentEnrollments PK_StudentEnrollments; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentEnrollments"
    ADD CONSTRAINT "PK_StudentEnrollments" PRIMARY KEY ("Id");


--
-- Name: StudentGuardians PK_StudentGuardians; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentGuardians"
    ADD CONSTRAINT "PK_StudentGuardians" PRIMARY KEY ("Id");


--
-- Name: StudentRegistrations PK_StudentRegistrations; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentRegistrations"
    ADD CONSTRAINT "PK_StudentRegistrations" PRIMARY KEY ("Id");


--
-- Name: Students PK_Students; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Students"
    ADD CONSTRAINT "PK_Students" PRIMARY KEY ("Id");


--
-- Name: Subjects PK_Subjects; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subjects"
    ADD CONSTRAINT "PK_Subjects" PRIMARY KEY ("Id");


--
-- Name: SubstitutionNeeds PK_SubstitutionNeeds; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubstitutionNeeds"
    ADD CONSTRAINT "PK_SubstitutionNeeds" PRIMARY KEY ("Id");


--
-- Name: TeacherAssignments PK_TeacherAssignments; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherAssignments"
    ADD CONSTRAINT "PK_TeacherAssignments" PRIMARY KEY ("Id");


--
-- Name: Tenants PK_Tenants; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tenants"
    ADD CONSTRAINT "PK_Tenants" PRIMARY KEY ("Id");


--
-- Name: TimetablePeriods PK_TimetablePeriods; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetablePeriods"
    ADD CONSTRAINT "PK_TimetablePeriods" PRIMARY KEY ("Id");


--
-- Name: TimetableSlots PK_TimetableSlots; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableSlots"
    ADD CONSTRAINT "PK_TimetableSlots" PRIMARY KEY ("Id");


--
-- Name: Trips PK_Trips; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trips"
    ADD CONSTRAINT "PK_Trips" PRIMARY KEY ("Id");


--
-- Name: UserRoles PK_UserRoles; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoles"
    ADD CONSTRAINT "PK_UserRoles" PRIMARY KEY ("Id");


--
-- Name: Users PK_Users; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "PK_Users" PRIMARY KEY ("Id");


--
-- Name: Vehicles PK_Vehicles; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vehicles"
    ADD CONSTRAINT "PK_Vehicles" PRIMARY KEY ("Id");


--
-- Name: WeeklyLessonPlanDays PK_WeeklyLessonPlanDays; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyLessonPlanDays"
    ADD CONSTRAINT "PK_WeeklyLessonPlanDays" PRIMARY KEY ("Id");


--
-- Name: WeeklyLessonPlans PK_WeeklyLessonPlans; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyLessonPlans"
    ADD CONSTRAINT "PK_WeeklyLessonPlans" PRIMARY KEY ("Id");


--
-- Name: __EFMigrationsHistory PK___EFMigrationsHistory; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."__EFMigrationsHistory"
    ADD CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId");


--
-- Name: IX_AcademicYears_SchoolId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_AcademicYears_SchoolId" ON public."AcademicYears" USING btree ("SchoolId");


--
-- Name: IX_AcademicYears_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_AcademicYears_TenantId" ON public."AcademicYears" USING btree ("TenantId");


--
-- Name: IX_AttendanceSessions_SchoolId_ClassId_SectionId_Date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_AttendanceSessions_SchoolId_ClassId_SectionId_Date" ON public."AttendanceSessions" USING btree ("SchoolId", "ClassId", "SectionId", "Date");


--
-- Name: IX_AttendanceSessions_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_AttendanceSessions_TenantId" ON public."AttendanceSessions" USING btree ("TenantId");


--
-- Name: IX_AuditEvents_EntityType_EntityId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_AuditEvents_EntityType_EntityId" ON public."AuditEvents" USING btree ("EntityType", "EntityId");


--
-- Name: IX_AuditEvents_TenantId_OccurredAt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_AuditEvents_TenantId_OccurredAt" ON public."AuditEvents" USING btree ("TenantId", "OccurredAt");


--
-- Name: IX_Campuses_SchoolId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Campuses_SchoolId" ON public."Campuses" USING btree ("SchoolId");


--
-- Name: IX_Campuses_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Campuses_TenantId" ON public."Campuses" USING btree ("TenantId");


--
-- Name: IX_ClassDiaries_ClassId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_ClassDiaries_ClassId" ON public."ClassDiaries" USING btree ("ClassId");


--
-- Name: IX_ClassDiaries_EmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_ClassDiaries_EmployeeId" ON public."ClassDiaries" USING btree ("EmployeeId");


--
-- Name: IX_ClassDiaries_SchoolId_Date_SectionId_EmployeeId_SubjectId; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_ClassDiaries_SchoolId_Date_SectionId_EmployeeId_SubjectId" ON public."ClassDiaries" USING btree ("SchoolId", "Date", "SectionId", "EmployeeId", "SubjectId");


--
-- Name: IX_ClassDiaries_SectionId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_ClassDiaries_SectionId" ON public."ClassDiaries" USING btree ("SectionId");


--
-- Name: IX_ClassDiaries_SubjectId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_ClassDiaries_SubjectId" ON public."ClassDiaries" USING btree ("SubjectId");


--
-- Name: IX_ClassDiaries_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_ClassDiaries_TenantId" ON public."ClassDiaries" USING btree ("TenantId");


--
-- Name: IX_ClassDiaries_TenantId_SchoolId_Date_SectionId_EmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_ClassDiaries_TenantId_SchoolId_Date_SectionId_EmployeeId" ON public."ClassDiaries" USING btree ("TenantId", "SchoolId", "Date", "SectionId", "EmployeeId") WHERE ("SubjectId" IS NULL);


--
-- Name: IX_Classes_SchoolId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Classes_SchoolId" ON public."Classes" USING btree ("SchoolId");


--
-- Name: IX_Classes_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Classes_TenantId" ON public."Classes" USING btree ("TenantId");


--
-- Name: IX_Departments_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Departments_TenantId" ON public."Departments" USING btree ("TenantId");


--
-- Name: IX_Designations_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Designations_TenantId" ON public."Designations" USING btree ("TenantId");


--
-- Name: IX_EmployeeAttendances_EmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_EmployeeAttendances_EmployeeId" ON public."EmployeeAttendances" USING btree ("EmployeeId");


--
-- Name: IX_EmployeeAttendances_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_EmployeeAttendances_TenantId" ON public."EmployeeAttendances" USING btree ("TenantId");


--
-- Name: IX_Employees_DepartmentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Employees_DepartmentId" ON public."Employees" USING btree ("DepartmentId");


--
-- Name: IX_Employees_DesignationId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Employees_DesignationId" ON public."Employees" USING btree ("DesignationId");


--
-- Name: IX_Employees_SchoolId_EmployeeCode; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_Employees_SchoolId_EmployeeCode" ON public."Employees" USING btree ("SchoolId", "EmployeeCode");


--
-- Name: IX_Employees_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Employees_TenantId" ON public."Employees" USING btree ("TenantId");


--
-- Name: IX_Employees_UserId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Employees_UserId" ON public."Employees" USING btree ("UserId");


--
-- Name: IX_Enquiries_AssignedToUserId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Enquiries_AssignedToUserId" ON public."Enquiries" USING btree ("AssignedToUserId");


--
-- Name: IX_Enquiries_SchoolId_Status_CreatedAt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Enquiries_SchoolId_Status_CreatedAt" ON public."Enquiries" USING btree ("SchoolId", "Status", "CreatedAt");


--
-- Name: IX_Enquiries_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Enquiries_TenantId" ON public."Enquiries" USING btree ("TenantId");


--
-- Name: IX_EnquiryActivities_EnquiryId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_EnquiryActivities_EnquiryId" ON public."EnquiryActivities" USING btree ("EnquiryId");


--
-- Name: IX_EnquiryActivities_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_EnquiryActivities_TenantId" ON public."EnquiryActivities" USING btree ("TenantId");


--
-- Name: IX_EnquiryOtpChallenges_Phone_CreatedAt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_EnquiryOtpChallenges_Phone_CreatedAt" ON public."EnquiryOtpChallenges" USING btree ("Phone", "CreatedAt");


--
-- Name: IX_EnquiryOtpChallenges_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_EnquiryOtpChallenges_TenantId" ON public."EnquiryOtpChallenges" USING btree ("TenantId");


--
-- Name: IX_Examinations_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Examinations_TenantId" ON public."Examinations" USING btree ("TenantId");


--
-- Name: IX_FeeCategories_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_FeeCategories_TenantId" ON public."FeeCategories" USING btree ("TenantId");


--
-- Name: IX_FeeStructures_FeeCategoryId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_FeeStructures_FeeCategoryId" ON public."FeeStructures" USING btree ("FeeCategoryId");


--
-- Name: IX_FeeStructures_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_FeeStructures_TenantId" ON public."FeeStructures" USING btree ("TenantId");


--
-- Name: IX_Guardians_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Guardians_TenantId" ON public."Guardians" USING btree ("TenantId");


--
-- Name: IX_Guardians_UserId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Guardians_UserId" ON public."Guardians" USING btree ("UserId");


--
-- Name: IX_HomeworkSubmissions_HomeworkId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_HomeworkSubmissions_HomeworkId" ON public."HomeworkSubmissions" USING btree ("HomeworkId");


--
-- Name: IX_HomeworkSubmissions_StudentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_HomeworkSubmissions_StudentId" ON public."HomeworkSubmissions" USING btree ("StudentId");


--
-- Name: IX_HomeworkSubmissions_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_HomeworkSubmissions_TenantId" ON public."HomeworkSubmissions" USING btree ("TenantId");


--
-- Name: IX_Homeworks_TeacherAssignmentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Homeworks_TeacherAssignmentId" ON public."Homeworks" USING btree ("TeacherAssignmentId");


--
-- Name: IX_Homeworks_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Homeworks_TenantId" ON public."Homeworks" USING btree ("TenantId");


--
-- Name: IX_IntegrationSettings_SchoolId_ProviderKey; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_IntegrationSettings_SchoolId_ProviderKey" ON public."IntegrationSettings" USING btree ("SchoolId", "ProviderKey");


--
-- Name: IX_IntegrationSettings_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_IntegrationSettings_TenantId" ON public."IntegrationSettings" USING btree ("TenantId");


--
-- Name: IX_LeaveRequests_EmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_LeaveRequests_EmployeeId" ON public."LeaveRequests" USING btree ("EmployeeId");


--
-- Name: IX_LeaveRequests_LeaveTypeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_LeaveRequests_LeaveTypeId" ON public."LeaveRequests" USING btree ("LeaveTypeId");


--
-- Name: IX_LeaveRequests_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_LeaveRequests_TenantId" ON public."LeaveRequests" USING btree ("TenantId");


--
-- Name: IX_LeaveTypes_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_LeaveTypes_TenantId" ON public."LeaveTypes" USING btree ("TenantId");


--
-- Name: IX_MarkEntries_ExaminationId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_MarkEntries_ExaminationId" ON public."MarkEntries" USING btree ("ExaminationId");


--
-- Name: IX_MarkEntries_StudentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_MarkEntries_StudentId" ON public."MarkEntries" USING btree ("StudentId");


--
-- Name: IX_MarkEntries_SubjectId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_MarkEntries_SubjectId" ON public."MarkEntries" USING btree ("SubjectId");


--
-- Name: IX_MarkEntries_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_MarkEntries_TenantId" ON public."MarkEntries" USING btree ("TenantId");


--
-- Name: IX_NotificationMessages_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_NotificationMessages_TenantId" ON public."NotificationMessages" USING btree ("TenantId");


--
-- Name: IX_Payments_GatewayOrderId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Payments_GatewayOrderId" ON public."Payments" USING btree ("GatewayOrderId");


--
-- Name: IX_Payments_StudentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Payments_StudentId" ON public."Payments" USING btree ("StudentId");


--
-- Name: IX_Payments_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Payments_TenantId" ON public."Payments" USING btree ("TenantId");


--
-- Name: IX_PayrollRuns_SchoolId_PeriodYear_PeriodMonth; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_PayrollRuns_SchoolId_PeriodYear_PeriodMonth" ON public."PayrollRuns" USING btree ("SchoolId", "PeriodYear", "PeriodMonth");


--
-- Name: IX_PayrollRuns_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_PayrollRuns_TenantId" ON public."PayrollRuns" USING btree ("TenantId");


--
-- Name: IX_Payslips_EmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Payslips_EmployeeId" ON public."Payslips" USING btree ("EmployeeId");


--
-- Name: IX_Payslips_PayrollRunId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Payslips_PayrollRunId" ON public."Payslips" USING btree ("PayrollRunId");


--
-- Name: IX_Payslips_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Payslips_TenantId" ON public."Payslips" USING btree ("TenantId");


--
-- Name: IX_RouteStops_RouteId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_RouteStops_RouteId" ON public."RouteStops" USING btree ("RouteId");


--
-- Name: IX_RouteStops_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_RouteStops_TenantId" ON public."RouteStops" USING btree ("TenantId");


--
-- Name: IX_Routes_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Routes_TenantId" ON public."Routes" USING btree ("TenantId");


--
-- Name: IX_SchoolAcademicSettings_SchoolId; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_SchoolAcademicSettings_SchoolId" ON public."SchoolAcademicSettings" USING btree ("SchoolId");


--
-- Name: IX_SchoolAcademicSettings_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_SchoolAcademicSettings_TenantId" ON public."SchoolAcademicSettings" USING btree ("TenantId");


--
-- Name: IX_SchoolAnnouncements_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_SchoolAnnouncements_TenantId" ON public."SchoolAnnouncements" USING btree ("TenantId");


--
-- Name: IX_Schools_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Schools_TenantId" ON public."Schools" USING btree ("TenantId");


--
-- Name: IX_Sections_ClassId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Sections_ClassId" ON public."Sections" USING btree ("ClassId");


--
-- Name: IX_Sections_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Sections_TenantId" ON public."Sections" USING btree ("TenantId");


--
-- Name: IX_StudentAttendances_SessionId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentAttendances_SessionId" ON public."StudentAttendances" USING btree ("SessionId");


--
-- Name: IX_StudentAttendances_StudentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentAttendances_StudentId" ON public."StudentAttendances" USING btree ("StudentId");


--
-- Name: IX_StudentAttendances_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentAttendances_TenantId" ON public."StudentAttendances" USING btree ("TenantId");


--
-- Name: IX_StudentDocuments_RegistrationId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentDocuments_RegistrationId" ON public."StudentDocuments" USING btree ("RegistrationId");


--
-- Name: IX_StudentDocuments_SchoolId_StudentId_Kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentDocuments_SchoolId_StudentId_Kind" ON public."StudentDocuments" USING btree ("SchoolId", "StudentId", "Kind");


--
-- Name: IX_StudentDocuments_StudentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentDocuments_StudentId" ON public."StudentDocuments" USING btree ("StudentId");


--
-- Name: IX_StudentDocuments_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentDocuments_TenantId" ON public."StudentDocuments" USING btree ("TenantId");


--
-- Name: IX_StudentEnrollments_AcademicYearId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentEnrollments_AcademicYearId" ON public."StudentEnrollments" USING btree ("AcademicYearId");


--
-- Name: IX_StudentEnrollments_ClassId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentEnrollments_ClassId" ON public."StudentEnrollments" USING btree ("ClassId");


--
-- Name: IX_StudentEnrollments_SectionId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentEnrollments_SectionId" ON public."StudentEnrollments" USING btree ("SectionId");


--
-- Name: IX_StudentEnrollments_StudentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentEnrollments_StudentId" ON public."StudentEnrollments" USING btree ("StudentId");


--
-- Name: IX_StudentEnrollments_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentEnrollments_TenantId" ON public."StudentEnrollments" USING btree ("TenantId");


--
-- Name: IX_StudentGuardians_GuardianId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentGuardians_GuardianId" ON public."StudentGuardians" USING btree ("GuardianId");


--
-- Name: IX_StudentGuardians_StudentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentGuardians_StudentId" ON public."StudentGuardians" USING btree ("StudentId");


--
-- Name: IX_StudentGuardians_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentGuardians_TenantId" ON public."StudentGuardians" USING btree ("TenantId");


--
-- Name: IX_StudentRegistrations_SchoolId_RegistrationNumber; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_StudentRegistrations_SchoolId_RegistrationNumber" ON public."StudentRegistrations" USING btree ("SchoolId", "RegistrationNumber");


--
-- Name: IX_StudentRegistrations_StudentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentRegistrations_StudentId" ON public."StudentRegistrations" USING btree ("StudentId");


--
-- Name: IX_StudentRegistrations_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_StudentRegistrations_TenantId" ON public."StudentRegistrations" USING btree ("TenantId");


--
-- Name: IX_Students_SchoolId_StudentCode; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_Students_SchoolId_StudentCode" ON public."Students" USING btree ("SchoolId", "StudentCode");


--
-- Name: IX_Students_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Students_TenantId" ON public."Students" USING btree ("TenantId");


--
-- Name: IX_Students_UserId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Students_UserId" ON public."Students" USING btree ("UserId");


--
-- Name: IX_Subjects_SchoolId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Subjects_SchoolId" ON public."Subjects" USING btree ("SchoolId");


--
-- Name: IX_Subjects_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Subjects_TenantId" ON public."Subjects" USING btree ("TenantId");


--
-- Name: IX_SubstitutionNeeds_LeaveRequestId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_SubstitutionNeeds_LeaveRequestId" ON public."SubstitutionNeeds" USING btree ("LeaveRequestId");


--
-- Name: IX_SubstitutionNeeds_OriginalEmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_SubstitutionNeeds_OriginalEmployeeId" ON public."SubstitutionNeeds" USING btree ("OriginalEmployeeId");


--
-- Name: IX_SubstitutionNeeds_PeriodId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_SubstitutionNeeds_PeriodId" ON public."SubstitutionNeeds" USING btree ("PeriodId");


--
-- Name: IX_SubstitutionNeeds_SchoolId_Date_Status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_SubstitutionNeeds_SchoolId_Date_Status" ON public."SubstitutionNeeds" USING btree ("SchoolId", "Date", "Status");


--
-- Name: IX_SubstitutionNeeds_SubstituteEmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_SubstitutionNeeds_SubstituteEmployeeId" ON public."SubstitutionNeeds" USING btree ("SubstituteEmployeeId");


--
-- Name: IX_SubstitutionNeeds_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_SubstitutionNeeds_TenantId" ON public."SubstitutionNeeds" USING btree ("TenantId");


--
-- Name: IX_SubstitutionNeeds_TenantId_TimetableSlotId_Date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_SubstitutionNeeds_TenantId_TimetableSlotId_Date" ON public."SubstitutionNeeds" USING btree ("TenantId", "TimetableSlotId", "Date") WHERE ("Status" <> 2);


--
-- Name: IX_SubstitutionNeeds_TimetableSlotId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_SubstitutionNeeds_TimetableSlotId" ON public."SubstitutionNeeds" USING btree ("TimetableSlotId");


--
-- Name: IX_TeacherAssignments_AcademicYearId_EmployeeId_SubjectId_Sect~; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_TeacherAssignments_AcademicYearId_EmployeeId_SubjectId_Sect~" ON public."TeacherAssignments" USING btree ("AcademicYearId", "EmployeeId", "SubjectId", "SectionId", "PeriodSlot", "ElectiveGroup");


--
-- Name: IX_TeacherAssignments_ClassId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TeacherAssignments_ClassId" ON public."TeacherAssignments" USING btree ("ClassId");


--
-- Name: IX_TeacherAssignments_EmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TeacherAssignments_EmployeeId" ON public."TeacherAssignments" USING btree ("EmployeeId");


--
-- Name: IX_TeacherAssignments_SectionId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TeacherAssignments_SectionId" ON public."TeacherAssignments" USING btree ("SectionId");


--
-- Name: IX_TeacherAssignments_SubjectId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TeacherAssignments_SubjectId" ON public."TeacherAssignments" USING btree ("SubjectId");


--
-- Name: IX_TeacherAssignments_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TeacherAssignments_TenantId" ON public."TeacherAssignments" USING btree ("TenantId");


--
-- Name: IX_Tenants_Slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_Tenants_Slug" ON public."Tenants" USING btree ("Slug");


--
-- Name: IX_TimetablePeriods_SchoolId_AcademicYearId_SortOrder; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_TimetablePeriods_SchoolId_AcademicYearId_SortOrder" ON public."TimetablePeriods" USING btree ("SchoolId", "AcademicYearId", "SortOrder");


--
-- Name: IX_TimetablePeriods_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TimetablePeriods_TenantId" ON public."TimetablePeriods" USING btree ("TenantId");


--
-- Name: IX_TimetableSlots_AcademicYearId_SectionId_DayOfWeek_PeriodId; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_TimetableSlots_AcademicYearId_SectionId_DayOfWeek_PeriodId" ON public."TimetableSlots" USING btree ("AcademicYearId", "SectionId", "DayOfWeek", "PeriodId");


--
-- Name: IX_TimetableSlots_ClassId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TimetableSlots_ClassId" ON public."TimetableSlots" USING btree ("ClassId");


--
-- Name: IX_TimetableSlots_EmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TimetableSlots_EmployeeId" ON public."TimetableSlots" USING btree ("EmployeeId");


--
-- Name: IX_TimetableSlots_PeriodId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TimetableSlots_PeriodId" ON public."TimetableSlots" USING btree ("PeriodId");


--
-- Name: IX_TimetableSlots_SectionId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TimetableSlots_SectionId" ON public."TimetableSlots" USING btree ("SectionId");


--
-- Name: IX_TimetableSlots_SubjectId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TimetableSlots_SubjectId" ON public."TimetableSlots" USING btree ("SubjectId");


--
-- Name: IX_TimetableSlots_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_TimetableSlots_TenantId" ON public."TimetableSlots" USING btree ("TenantId");


--
-- Name: IX_Trips_DriverId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Trips_DriverId" ON public."Trips" USING btree ("DriverId");


--
-- Name: IX_Trips_RouteId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Trips_RouteId" ON public."Trips" USING btree ("RouteId");


--
-- Name: IX_Trips_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Trips_TenantId" ON public."Trips" USING btree ("TenantId");


--
-- Name: IX_Trips_VehicleId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Trips_VehicleId" ON public."Trips" USING btree ("VehicleId");


--
-- Name: IX_UserRoles_RoleId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_UserRoles_RoleId" ON public."UserRoles" USING btree ("RoleId");


--
-- Name: IX_UserRoles_UserId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_UserRoles_UserId" ON public."UserRoles" USING btree ("UserId");


--
-- Name: IX_Users_TenantId_Email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_Users_TenantId_Email" ON public."Users" USING btree ("TenantId", "Email");


--
-- Name: IX_Vehicles_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_Vehicles_TenantId" ON public."Vehicles" USING btree ("TenantId");


--
-- Name: IX_WeeklyLessonPlanDays_PlanId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_WeeklyLessonPlanDays_PlanId" ON public."WeeklyLessonPlanDays" USING btree ("PlanId");


--
-- Name: IX_WeeklyLessonPlanDays_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_WeeklyLessonPlanDays_TenantId" ON public."WeeklyLessonPlanDays" USING btree ("TenantId");


--
-- Name: IX_WeeklyLessonPlanDays_TenantId_PlanId_DayOfWeek; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_WeeklyLessonPlanDays_TenantId_PlanId_DayOfWeek" ON public."WeeklyLessonPlanDays" USING btree ("TenantId", "PlanId", "DayOfWeek");


--
-- Name: IX_WeeklyLessonPlans_ClassId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_WeeklyLessonPlans_ClassId" ON public."WeeklyLessonPlans" USING btree ("ClassId");


--
-- Name: IX_WeeklyLessonPlans_EmployeeId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_WeeklyLessonPlans_EmployeeId" ON public."WeeklyLessonPlans" USING btree ("EmployeeId");


--
-- Name: IX_WeeklyLessonPlans_SchoolId_WeekStart_SectionId_SubjectId_Em~; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_WeeklyLessonPlans_SchoolId_WeekStart_SectionId_SubjectId_Em~" ON public."WeeklyLessonPlans" USING btree ("SchoolId", "WeekStart", "SectionId", "SubjectId", "EmployeeId");


--
-- Name: IX_WeeklyLessonPlans_SectionId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_WeeklyLessonPlans_SectionId" ON public."WeeklyLessonPlans" USING btree ("SectionId");


--
-- Name: IX_WeeklyLessonPlans_SubjectId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_WeeklyLessonPlans_SubjectId" ON public."WeeklyLessonPlans" USING btree ("SubjectId");


--
-- Name: IX_WeeklyLessonPlans_TenantId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_WeeklyLessonPlans_TenantId" ON public."WeeklyLessonPlans" USING btree ("TenantId");


--
-- Name: AcademicYears FK_AcademicYears_Schools_SchoolId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademicYears"
    ADD CONSTRAINT "FK_AcademicYears_Schools_SchoolId" FOREIGN KEY ("SchoolId") REFERENCES public."Schools"("Id") ON DELETE CASCADE;


--
-- Name: AcademicYears FK_AcademicYears_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademicYears"
    ADD CONSTRAINT "FK_AcademicYears_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: AttendanceSessions FK_AttendanceSessions_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSessions"
    ADD CONSTRAINT "FK_AttendanceSessions_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: AuditEvents FK_AuditEvents_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditEvents"
    ADD CONSTRAINT "FK_AuditEvents_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Campuses FK_Campuses_Schools_SchoolId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campuses"
    ADD CONSTRAINT "FK_Campuses_Schools_SchoolId" FOREIGN KEY ("SchoolId") REFERENCES public."Schools"("Id") ON DELETE CASCADE;


--
-- Name: Campuses FK_Campuses_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campuses"
    ADD CONSTRAINT "FK_Campuses_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: ClassDiaries FK_ClassDiaries_Classes_ClassId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassDiaries"
    ADD CONSTRAINT "FK_ClassDiaries_Classes_ClassId" FOREIGN KEY ("ClassId") REFERENCES public."Classes"("Id") ON DELETE CASCADE;


--
-- Name: ClassDiaries FK_ClassDiaries_Employees_EmployeeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassDiaries"
    ADD CONSTRAINT "FK_ClassDiaries_Employees_EmployeeId" FOREIGN KEY ("EmployeeId") REFERENCES public."Employees"("Id") ON DELETE CASCADE;


--
-- Name: ClassDiaries FK_ClassDiaries_Sections_SectionId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassDiaries"
    ADD CONSTRAINT "FK_ClassDiaries_Sections_SectionId" FOREIGN KEY ("SectionId") REFERENCES public."Sections"("Id") ON DELETE CASCADE;


--
-- Name: ClassDiaries FK_ClassDiaries_Subjects_SubjectId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassDiaries"
    ADD CONSTRAINT "FK_ClassDiaries_Subjects_SubjectId" FOREIGN KEY ("SubjectId") REFERENCES public."Subjects"("Id");


--
-- Name: ClassDiaries FK_ClassDiaries_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassDiaries"
    ADD CONSTRAINT "FK_ClassDiaries_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Classes FK_Classes_Schools_SchoolId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Classes"
    ADD CONSTRAINT "FK_Classes_Schools_SchoolId" FOREIGN KEY ("SchoolId") REFERENCES public."Schools"("Id") ON DELETE CASCADE;


--
-- Name: Classes FK_Classes_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Classes"
    ADD CONSTRAINT "FK_Classes_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Departments FK_Departments_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Departments"
    ADD CONSTRAINT "FK_Departments_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Designations FK_Designations_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Designations"
    ADD CONSTRAINT "FK_Designations_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: EmployeeAttendances FK_EmployeeAttendances_Employees_EmployeeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeAttendances"
    ADD CONSTRAINT "FK_EmployeeAttendances_Employees_EmployeeId" FOREIGN KEY ("EmployeeId") REFERENCES public."Employees"("Id") ON DELETE CASCADE;


--
-- Name: EmployeeAttendances FK_EmployeeAttendances_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeAttendances"
    ADD CONSTRAINT "FK_EmployeeAttendances_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Employees FK_Employees_Departments_DepartmentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employees"
    ADD CONSTRAINT "FK_Employees_Departments_DepartmentId" FOREIGN KEY ("DepartmentId") REFERENCES public."Departments"("Id");


--
-- Name: Employees FK_Employees_Designations_DesignationId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employees"
    ADD CONSTRAINT "FK_Employees_Designations_DesignationId" FOREIGN KEY ("DesignationId") REFERENCES public."Designations"("Id");


--
-- Name: Employees FK_Employees_Schools_SchoolId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employees"
    ADD CONSTRAINT "FK_Employees_Schools_SchoolId" FOREIGN KEY ("SchoolId") REFERENCES public."Schools"("Id") ON DELETE CASCADE;


--
-- Name: Employees FK_Employees_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employees"
    ADD CONSTRAINT "FK_Employees_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Employees FK_Employees_Users_UserId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employees"
    ADD CONSTRAINT "FK_Employees_Users_UserId" FOREIGN KEY ("UserId") REFERENCES public."Users"("Id");


--
-- Name: Enquiries FK_Enquiries_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Enquiries"
    ADD CONSTRAINT "FK_Enquiries_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Enquiries FK_Enquiries_Users_AssignedToUserId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Enquiries"
    ADD CONSTRAINT "FK_Enquiries_Users_AssignedToUserId" FOREIGN KEY ("AssignedToUserId") REFERENCES public."Users"("Id");


--
-- Name: EnquiryActivities FK_EnquiryActivities_Enquiries_EnquiryId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EnquiryActivities"
    ADD CONSTRAINT "FK_EnquiryActivities_Enquiries_EnquiryId" FOREIGN KEY ("EnquiryId") REFERENCES public."Enquiries"("Id") ON DELETE CASCADE;


--
-- Name: EnquiryActivities FK_EnquiryActivities_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EnquiryActivities"
    ADD CONSTRAINT "FK_EnquiryActivities_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: EnquiryOtpChallenges FK_EnquiryOtpChallenges_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EnquiryOtpChallenges"
    ADD CONSTRAINT "FK_EnquiryOtpChallenges_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Examinations FK_Examinations_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Examinations"
    ADD CONSTRAINT "FK_Examinations_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: FeeCategories FK_FeeCategories_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeeCategories"
    ADD CONSTRAINT "FK_FeeCategories_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: FeeStructures FK_FeeStructures_FeeCategories_FeeCategoryId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeeStructures"
    ADD CONSTRAINT "FK_FeeStructures_FeeCategories_FeeCategoryId" FOREIGN KEY ("FeeCategoryId") REFERENCES public."FeeCategories"("Id") ON DELETE CASCADE;


--
-- Name: FeeStructures FK_FeeStructures_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeeStructures"
    ADD CONSTRAINT "FK_FeeStructures_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Guardians FK_Guardians_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Guardians"
    ADD CONSTRAINT "FK_Guardians_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Guardians FK_Guardians_Users_UserId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Guardians"
    ADD CONSTRAINT "FK_Guardians_Users_UserId" FOREIGN KEY ("UserId") REFERENCES public."Users"("Id");


--
-- Name: HomeworkSubmissions FK_HomeworkSubmissions_Homeworks_HomeworkId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HomeworkSubmissions"
    ADD CONSTRAINT "FK_HomeworkSubmissions_Homeworks_HomeworkId" FOREIGN KEY ("HomeworkId") REFERENCES public."Homeworks"("Id") ON DELETE CASCADE;


--
-- Name: HomeworkSubmissions FK_HomeworkSubmissions_Students_StudentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HomeworkSubmissions"
    ADD CONSTRAINT "FK_HomeworkSubmissions_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES public."Students"("Id") ON DELETE CASCADE;


--
-- Name: HomeworkSubmissions FK_HomeworkSubmissions_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HomeworkSubmissions"
    ADD CONSTRAINT "FK_HomeworkSubmissions_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Homeworks FK_Homeworks_TeacherAssignments_TeacherAssignmentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Homeworks"
    ADD CONSTRAINT "FK_Homeworks_TeacherAssignments_TeacherAssignmentId" FOREIGN KEY ("TeacherAssignmentId") REFERENCES public."TeacherAssignments"("Id") ON DELETE CASCADE;


--
-- Name: Homeworks FK_Homeworks_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Homeworks"
    ADD CONSTRAINT "FK_Homeworks_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: IntegrationSettings FK_IntegrationSettings_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntegrationSettings"
    ADD CONSTRAINT "FK_IntegrationSettings_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: LeaveRequests FK_LeaveRequests_Employees_EmployeeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequests"
    ADD CONSTRAINT "FK_LeaveRequests_Employees_EmployeeId" FOREIGN KEY ("EmployeeId") REFERENCES public."Employees"("Id") ON DELETE CASCADE;


--
-- Name: LeaveRequests FK_LeaveRequests_LeaveTypes_LeaveTypeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequests"
    ADD CONSTRAINT "FK_LeaveRequests_LeaveTypes_LeaveTypeId" FOREIGN KEY ("LeaveTypeId") REFERENCES public."LeaveTypes"("Id") ON DELETE CASCADE;


--
-- Name: LeaveRequests FK_LeaveRequests_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequests"
    ADD CONSTRAINT "FK_LeaveRequests_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: LeaveTypes FK_LeaveTypes_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveTypes"
    ADD CONSTRAINT "FK_LeaveTypes_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: MarkEntries FK_MarkEntries_Examinations_ExaminationId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MarkEntries"
    ADD CONSTRAINT "FK_MarkEntries_Examinations_ExaminationId" FOREIGN KEY ("ExaminationId") REFERENCES public."Examinations"("Id") ON DELETE CASCADE;


--
-- Name: MarkEntries FK_MarkEntries_Students_StudentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MarkEntries"
    ADD CONSTRAINT "FK_MarkEntries_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES public."Students"("Id") ON DELETE CASCADE;


--
-- Name: MarkEntries FK_MarkEntries_Subjects_SubjectId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MarkEntries"
    ADD CONSTRAINT "FK_MarkEntries_Subjects_SubjectId" FOREIGN KEY ("SubjectId") REFERENCES public."Subjects"("Id") ON DELETE CASCADE;


--
-- Name: MarkEntries FK_MarkEntries_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MarkEntries"
    ADD CONSTRAINT "FK_MarkEntries_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: NotificationMessages FK_NotificationMessages_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NotificationMessages"
    ADD CONSTRAINT "FK_NotificationMessages_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Payments FK_Payments_Students_StudentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "FK_Payments_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES public."Students"("Id") ON DELETE CASCADE;


--
-- Name: Payments FK_Payments_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "FK_Payments_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: PayrollRuns FK_PayrollRuns_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollRuns"
    ADD CONSTRAINT "FK_PayrollRuns_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Payslips FK_Payslips_Employees_EmployeeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payslips"
    ADD CONSTRAINT "FK_Payslips_Employees_EmployeeId" FOREIGN KEY ("EmployeeId") REFERENCES public."Employees"("Id") ON DELETE CASCADE;


--
-- Name: Payslips FK_Payslips_PayrollRuns_PayrollRunId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payslips"
    ADD CONSTRAINT "FK_Payslips_PayrollRuns_PayrollRunId" FOREIGN KEY ("PayrollRunId") REFERENCES public."PayrollRuns"("Id") ON DELETE CASCADE;


--
-- Name: Payslips FK_Payslips_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payslips"
    ADD CONSTRAINT "FK_Payslips_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: RouteStops FK_RouteStops_Routes_RouteId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RouteStops"
    ADD CONSTRAINT "FK_RouteStops_Routes_RouteId" FOREIGN KEY ("RouteId") REFERENCES public."Routes"("Id") ON DELETE CASCADE;


--
-- Name: RouteStops FK_RouteStops_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RouteStops"
    ADD CONSTRAINT "FK_RouteStops_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Routes FK_Routes_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Routes"
    ADD CONSTRAINT "FK_Routes_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: SchoolAcademicSettings FK_SchoolAcademicSettings_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolAcademicSettings"
    ADD CONSTRAINT "FK_SchoolAcademicSettings_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: SchoolAnnouncements FK_SchoolAnnouncements_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolAnnouncements"
    ADD CONSTRAINT "FK_SchoolAnnouncements_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Schools FK_Schools_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schools"
    ADD CONSTRAINT "FK_Schools_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Sections FK_Sections_Classes_ClassId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sections"
    ADD CONSTRAINT "FK_Sections_Classes_ClassId" FOREIGN KEY ("ClassId") REFERENCES public."Classes"("Id") ON DELETE CASCADE;


--
-- Name: Sections FK_Sections_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sections"
    ADD CONSTRAINT "FK_Sections_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: StudentAttendances FK_StudentAttendances_AttendanceSessions_SessionId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentAttendances"
    ADD CONSTRAINT "FK_StudentAttendances_AttendanceSessions_SessionId" FOREIGN KEY ("SessionId") REFERENCES public."AttendanceSessions"("Id") ON DELETE CASCADE;


--
-- Name: StudentAttendances FK_StudentAttendances_Students_StudentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentAttendances"
    ADD CONSTRAINT "FK_StudentAttendances_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES public."Students"("Id") ON DELETE CASCADE;


--
-- Name: StudentAttendances FK_StudentAttendances_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentAttendances"
    ADD CONSTRAINT "FK_StudentAttendances_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: StudentDocuments FK_StudentDocuments_StudentRegistrations_RegistrationId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentDocuments"
    ADD CONSTRAINT "FK_StudentDocuments_StudentRegistrations_RegistrationId" FOREIGN KEY ("RegistrationId") REFERENCES public."StudentRegistrations"("Id");


--
-- Name: StudentDocuments FK_StudentDocuments_Students_StudentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentDocuments"
    ADD CONSTRAINT "FK_StudentDocuments_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES public."Students"("Id");


--
-- Name: StudentDocuments FK_StudentDocuments_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentDocuments"
    ADD CONSTRAINT "FK_StudentDocuments_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: StudentEnrollments FK_StudentEnrollments_AcademicYears_AcademicYearId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentEnrollments"
    ADD CONSTRAINT "FK_StudentEnrollments_AcademicYears_AcademicYearId" FOREIGN KEY ("AcademicYearId") REFERENCES public."AcademicYears"("Id") ON DELETE CASCADE;


--
-- Name: StudentEnrollments FK_StudentEnrollments_Classes_ClassId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentEnrollments"
    ADD CONSTRAINT "FK_StudentEnrollments_Classes_ClassId" FOREIGN KEY ("ClassId") REFERENCES public."Classes"("Id") ON DELETE CASCADE;


--
-- Name: StudentEnrollments FK_StudentEnrollments_Sections_SectionId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentEnrollments"
    ADD CONSTRAINT "FK_StudentEnrollments_Sections_SectionId" FOREIGN KEY ("SectionId") REFERENCES public."Sections"("Id") ON DELETE CASCADE;


--
-- Name: StudentEnrollments FK_StudentEnrollments_Students_StudentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentEnrollments"
    ADD CONSTRAINT "FK_StudentEnrollments_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES public."Students"("Id") ON DELETE CASCADE;


--
-- Name: StudentEnrollments FK_StudentEnrollments_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentEnrollments"
    ADD CONSTRAINT "FK_StudentEnrollments_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: StudentGuardians FK_StudentGuardians_Guardians_GuardianId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentGuardians"
    ADD CONSTRAINT "FK_StudentGuardians_Guardians_GuardianId" FOREIGN KEY ("GuardianId") REFERENCES public."Guardians"("Id") ON DELETE CASCADE;


--
-- Name: StudentGuardians FK_StudentGuardians_Students_StudentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentGuardians"
    ADD CONSTRAINT "FK_StudentGuardians_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES public."Students"("Id") ON DELETE CASCADE;


--
-- Name: StudentGuardians FK_StudentGuardians_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentGuardians"
    ADD CONSTRAINT "FK_StudentGuardians_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: StudentRegistrations FK_StudentRegistrations_Students_StudentId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentRegistrations"
    ADD CONSTRAINT "FK_StudentRegistrations_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES public."Students"("Id");


--
-- Name: StudentRegistrations FK_StudentRegistrations_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentRegistrations"
    ADD CONSTRAINT "FK_StudentRegistrations_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Students FK_Students_Schools_SchoolId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Students"
    ADD CONSTRAINT "FK_Students_Schools_SchoolId" FOREIGN KEY ("SchoolId") REFERENCES public."Schools"("Id") ON DELETE CASCADE;


--
-- Name: Students FK_Students_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Students"
    ADD CONSTRAINT "FK_Students_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Students FK_Students_Users_UserId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Students"
    ADD CONSTRAINT "FK_Students_Users_UserId" FOREIGN KEY ("UserId") REFERENCES public."Users"("Id");


--
-- Name: Subjects FK_Subjects_Schools_SchoolId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subjects"
    ADD CONSTRAINT "FK_Subjects_Schools_SchoolId" FOREIGN KEY ("SchoolId") REFERENCES public."Schools"("Id") ON DELETE CASCADE;


--
-- Name: Subjects FK_Subjects_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subjects"
    ADD CONSTRAINT "FK_Subjects_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: SubstitutionNeeds FK_SubstitutionNeeds_Employees_OriginalEmployeeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubstitutionNeeds"
    ADD CONSTRAINT "FK_SubstitutionNeeds_Employees_OriginalEmployeeId" FOREIGN KEY ("OriginalEmployeeId") REFERENCES public."Employees"("Id") ON DELETE CASCADE;


--
-- Name: SubstitutionNeeds FK_SubstitutionNeeds_Employees_SubstituteEmployeeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubstitutionNeeds"
    ADD CONSTRAINT "FK_SubstitutionNeeds_Employees_SubstituteEmployeeId" FOREIGN KEY ("SubstituteEmployeeId") REFERENCES public."Employees"("Id");


--
-- Name: SubstitutionNeeds FK_SubstitutionNeeds_LeaveRequests_LeaveRequestId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubstitutionNeeds"
    ADD CONSTRAINT "FK_SubstitutionNeeds_LeaveRequests_LeaveRequestId" FOREIGN KEY ("LeaveRequestId") REFERENCES public."LeaveRequests"("Id") ON DELETE CASCADE;


--
-- Name: SubstitutionNeeds FK_SubstitutionNeeds_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubstitutionNeeds"
    ADD CONSTRAINT "FK_SubstitutionNeeds_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: SubstitutionNeeds FK_SubstitutionNeeds_TimetablePeriods_PeriodId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubstitutionNeeds"
    ADD CONSTRAINT "FK_SubstitutionNeeds_TimetablePeriods_PeriodId" FOREIGN KEY ("PeriodId") REFERENCES public."TimetablePeriods"("Id") ON DELETE CASCADE;


--
-- Name: SubstitutionNeeds FK_SubstitutionNeeds_TimetableSlots_TimetableSlotId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubstitutionNeeds"
    ADD CONSTRAINT "FK_SubstitutionNeeds_TimetableSlots_TimetableSlotId" FOREIGN KEY ("TimetableSlotId") REFERENCES public."TimetableSlots"("Id") ON DELETE CASCADE;


--
-- Name: TeacherAssignments FK_TeacherAssignments_AcademicYears_AcademicYearId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherAssignments"
    ADD CONSTRAINT "FK_TeacherAssignments_AcademicYears_AcademicYearId" FOREIGN KEY ("AcademicYearId") REFERENCES public."AcademicYears"("Id") ON DELETE CASCADE;


--
-- Name: TeacherAssignments FK_TeacherAssignments_Classes_ClassId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherAssignments"
    ADD CONSTRAINT "FK_TeacherAssignments_Classes_ClassId" FOREIGN KEY ("ClassId") REFERENCES public."Classes"("Id") ON DELETE CASCADE;


--
-- Name: TeacherAssignments FK_TeacherAssignments_Employees_EmployeeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherAssignments"
    ADD CONSTRAINT "FK_TeacherAssignments_Employees_EmployeeId" FOREIGN KEY ("EmployeeId") REFERENCES public."Employees"("Id") ON DELETE CASCADE;


--
-- Name: TeacherAssignments FK_TeacherAssignments_Sections_SectionId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherAssignments"
    ADD CONSTRAINT "FK_TeacherAssignments_Sections_SectionId" FOREIGN KEY ("SectionId") REFERENCES public."Sections"("Id") ON DELETE CASCADE;


--
-- Name: TeacherAssignments FK_TeacherAssignments_Subjects_SubjectId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherAssignments"
    ADD CONSTRAINT "FK_TeacherAssignments_Subjects_SubjectId" FOREIGN KEY ("SubjectId") REFERENCES public."Subjects"("Id") ON DELETE CASCADE;


--
-- Name: TeacherAssignments FK_TeacherAssignments_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherAssignments"
    ADD CONSTRAINT "FK_TeacherAssignments_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: TimetablePeriods FK_TimetablePeriods_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetablePeriods"
    ADD CONSTRAINT "FK_TimetablePeriods_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: TimetableSlots FK_TimetableSlots_Classes_ClassId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableSlots"
    ADD CONSTRAINT "FK_TimetableSlots_Classes_ClassId" FOREIGN KEY ("ClassId") REFERENCES public."Classes"("Id") ON DELETE CASCADE;


--
-- Name: TimetableSlots FK_TimetableSlots_Employees_EmployeeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableSlots"
    ADD CONSTRAINT "FK_TimetableSlots_Employees_EmployeeId" FOREIGN KEY ("EmployeeId") REFERENCES public."Employees"("Id") ON DELETE CASCADE;


--
-- Name: TimetableSlots FK_TimetableSlots_Sections_SectionId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableSlots"
    ADD CONSTRAINT "FK_TimetableSlots_Sections_SectionId" FOREIGN KEY ("SectionId") REFERENCES public."Sections"("Id") ON DELETE CASCADE;


--
-- Name: TimetableSlots FK_TimetableSlots_Subjects_SubjectId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableSlots"
    ADD CONSTRAINT "FK_TimetableSlots_Subjects_SubjectId" FOREIGN KEY ("SubjectId") REFERENCES public."Subjects"("Id") ON DELETE CASCADE;


--
-- Name: TimetableSlots FK_TimetableSlots_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableSlots"
    ADD CONSTRAINT "FK_TimetableSlots_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: TimetableSlots FK_TimetableSlots_TimetablePeriods_PeriodId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableSlots"
    ADD CONSTRAINT "FK_TimetableSlots_TimetablePeriods_PeriodId" FOREIGN KEY ("PeriodId") REFERENCES public."TimetablePeriods"("Id") ON DELETE CASCADE;


--
-- Name: Trips FK_Trips_Employees_DriverId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trips"
    ADD CONSTRAINT "FK_Trips_Employees_DriverId" FOREIGN KEY ("DriverId") REFERENCES public."Employees"("Id") ON DELETE CASCADE;


--
-- Name: Trips FK_Trips_Routes_RouteId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trips"
    ADD CONSTRAINT "FK_Trips_Routes_RouteId" FOREIGN KEY ("RouteId") REFERENCES public."Routes"("Id") ON DELETE CASCADE;


--
-- Name: Trips FK_Trips_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trips"
    ADD CONSTRAINT "FK_Trips_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Trips FK_Trips_Vehicles_VehicleId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trips"
    ADD CONSTRAINT "FK_Trips_Vehicles_VehicleId" FOREIGN KEY ("VehicleId") REFERENCES public."Vehicles"("Id") ON DELETE CASCADE;


--
-- Name: UserRoles FK_UserRoles_Roles_RoleId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoles"
    ADD CONSTRAINT "FK_UserRoles_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES public."Roles"("Id") ON DELETE CASCADE;


--
-- Name: UserRoles FK_UserRoles_Users_UserId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoles"
    ADD CONSTRAINT "FK_UserRoles_Users_UserId" FOREIGN KEY ("UserId") REFERENCES public."Users"("Id") ON DELETE CASCADE;


--
-- Name: Users FK_Users_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "FK_Users_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: Vehicles FK_Vehicles_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vehicles"
    ADD CONSTRAINT "FK_Vehicles_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: WeeklyLessonPlanDays FK_WeeklyLessonPlanDays_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyLessonPlanDays"
    ADD CONSTRAINT "FK_WeeklyLessonPlanDays_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- Name: WeeklyLessonPlanDays FK_WeeklyLessonPlanDays_WeeklyLessonPlans_PlanId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyLessonPlanDays"
    ADD CONSTRAINT "FK_WeeklyLessonPlanDays_WeeklyLessonPlans_PlanId" FOREIGN KEY ("PlanId") REFERENCES public."WeeklyLessonPlans"("Id") ON DELETE CASCADE;


--
-- Name: WeeklyLessonPlans FK_WeeklyLessonPlans_Classes_ClassId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyLessonPlans"
    ADD CONSTRAINT "FK_WeeklyLessonPlans_Classes_ClassId" FOREIGN KEY ("ClassId") REFERENCES public."Classes"("Id") ON DELETE CASCADE;


--
-- Name: WeeklyLessonPlans FK_WeeklyLessonPlans_Employees_EmployeeId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyLessonPlans"
    ADD CONSTRAINT "FK_WeeklyLessonPlans_Employees_EmployeeId" FOREIGN KEY ("EmployeeId") REFERENCES public."Employees"("Id") ON DELETE CASCADE;


--
-- Name: WeeklyLessonPlans FK_WeeklyLessonPlans_Sections_SectionId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyLessonPlans"
    ADD CONSTRAINT "FK_WeeklyLessonPlans_Sections_SectionId" FOREIGN KEY ("SectionId") REFERENCES public."Sections"("Id") ON DELETE CASCADE;


--
-- Name: WeeklyLessonPlans FK_WeeklyLessonPlans_Subjects_SubjectId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyLessonPlans"
    ADD CONSTRAINT "FK_WeeklyLessonPlans_Subjects_SubjectId" FOREIGN KEY ("SubjectId") REFERENCES public."Subjects"("Id") ON DELETE CASCADE;


--
-- Name: WeeklyLessonPlans FK_WeeklyLessonPlans_Tenants_TenantId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyLessonPlans"
    ADD CONSTRAINT "FK_WeeklyLessonPlans_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES public."Tenants"("Id") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict g1iCjePe3rILxecVqYmmPXSIg8VcVZA7Uj3BUFCSyMvCo7z7ibwchSxtWjXgWeD

