# SCHOOL ERP & DIGITAL CAMPUS PLATFORM
## Master Product Requirements, Architecture and Implementation Specification

**Document status:** Master specification — initial approved baseline  
**Version:** 1.0  
**Date:** 10 October 2026  
**Product type:** Configurable school website, School ERP, HRMS/Payroll and installable Progressive Web App (PWA)  
**Primary deployment target:** Linux containers  
**Initial market assumptions:** India, with configurable support for different school boards, languages and school policies  
**Specification purpose:** Single source of truth for product planning, implementation, testing, deployment and AI coding agents

---

## 1. Purpose and product vision

Build an international-quality, secure, accessible, mobile-friendly school digital platform. It must combine a polished public school website with role-specific operational portals and a shared backend.

This is not only a brochure website. It is a configurable School ERP covering the student lifecycle, academics, teachers, parents, transport, attendance, fees and payments, communication, health and behaviour records, office operations, HRMS, payroll, reporting and administration.

The product should be designed so it can initially serve one school and later support multiple schools through configurable branding, modules, academic settings and strict school-level data isolation.

### 1.1 Product principles

1. **Backend is authoritative:** PostgreSQL is the source of truth for business data. Browser storage is never the authoritative database.
2. **Privacy and safety by design:** student, child, health, biometric, identity and payroll information require strict access control and appropriate retention.
3. **Role-based experiences:** each user sees only the functions and records needed for their role.
4. **Configurable, not hard-coded:** school name, logo, colour palette, academic year, classes, sections, subjects, language options, fee rules, notification templates and enabled modules must be configurable.
5. **International-quality design:** coherent design system, excellent responsive layouts, clear navigation, meaningful empty/error/loading states and polished forms and tables.
6. **Auditability:** sensitive changes and approvals must be traceable.
7. **Accessibility:** target WCAG 2.2 AA.
8. **Secure by default:** deny access unless explicitly authorized; validate on the server; protect integrations and secrets.
9. **Incremental delivery:** build and test a working vertical slice for each phase rather than attempting an untested “big bang”.
10. **No fake integrations:** if credentials, hardware, vendor SDKs or external accounts are unavailable, provide a clearly labelled sandbox/mock adapter and document what is required for production.

---

## 2. Scope

### 2.1 In scope

- Public school website and content management
- Platform owner administration and school provisioning
- School administrator / principal dashboard
- Student information and lifecycle management
- Parent / guardian portal
- Student portal
- Teacher portal
- Driver portal
- Office staff portal
- HRMS and employee lifecycle
- Payroll and payslips
- Academic years, classes, sections, subjects, timetables and teacher assignments
- Language choice management, including second and third languages
- Attendance, including compatible thumb/fingerprint device integrations
- Homework, worksheets, daily diaries and activities
- Examinations, marks, report cards and marksheets
- Fee structures, dues, payments, receipts, refunds and reconciliation
- Transport routes, stops, vehicles, drivers and GPS/map experiences
- SMS, email, WhatsApp Business and in-app/push notifications
- Student health and behaviour records with restricted access
- Analytics, exports, audit records and operational reports
- Installable PWA, responsive mobile layouts and future API-based native app compatibility
- Licensing and subscription readiness for a commercial product
- Linux/Docker deployment, backup and restore, monitoring and CI/CD

### 2.2 Not assumed to be included automatically

These require a separately approved scope or a compatible third-party service:
- A native Android/iOS application published in app stores
- Actual GPS hardware or cellular data plans
- Every fingerprint device brand/model
- A payment gateway merchant account
- SMS sender registration, WhatsApp Business approval or email provider account
- Full accounting/general-ledger replacement
- Biometric template storage
- Automated legal or statutory compliance guarantees
- Board-specific integrations or government APIs not yet identified

The architecture must make these integrations possible without pretending they are active before configuration and end-to-end testing.

---

## 3. Users, roles and permissions

Use role-based access control (RBAC), with optional attribute-based checks for school, campus, academic year, class, section, subject, child relationship and data sensitivity. Apply least privilege and deny by default.

### 3.1 Platform Super Admin (software owner)

- Create, suspend and configure school tenants
- Configure platform-wide plans, licences, feature entitlements and limits
- Monitor service health, background jobs, integration status and errors
- Manage platform-level configuration and version information
- Manage platform support access using time-limited, audited, approved procedures
- View platform-level aggregate metrics only where privacy and contracts permit
- Manage upgrades, maintenance announcements and deployment status
- Never gain unrestricted access to school health, student or payroll records by default

### 3.2 School Admin / Principal

- School profile, branding, campuses, academic years and calendar
- Admissions, students, parents, staff and user access
- Classes, sections, subjects, languages, teacher assignments and timetables
- Fees, payments, concessions and financial reports according to permissions
- Attendance oversight and correction approvals
- Examinations, marks approval and report card publication
- Transport configuration and oversight
- Communications, announcements and school content
- Health/behaviour access only when specifically authorized
- Analytics, exports, audit trail and settings

Support delegated roles such as Principal, Academic Coordinator, Accountant, Admission Officer, Attendance Officer, Transport Manager, HR Manager and Payroll Approver.

### 3.3 Student

- View own timetable, assigned subjects, homework, worksheets, daily diary, activities, attendance, examination schedule and published results
- Submit permitted assignments and view teacher feedback
- View school announcements and relevant notifications
- View own permitted language/subject selections
- No access to another student's private data

### 3.4 Parent / Guardian

- Link to one or more verified children
- View each linked child's timetable, attendance, homework, worksheets, diary, activities, published marksheets, fee statement and transport details
- Pay fees and access receipts
- Submit leave requests, consent forms and permitted information updates
- Receive relevant school communications and configure available notification preferences
- Access child health information only where policy and authorization allow
- Child linking and sensitive account changes require verification

### 3.5 Teacher

- View assigned classes, sections, subjects and students only within granted permissions
- Mark attendance for assigned teaching groups
- Create homework, worksheets, daily diary entries and class activities
- Review submissions and provide feedback
- Enter marks for assigned subjects/examinations, save drafts and submit for approval
- View relevant student information, language selections and authorized learning/health alerts
- View own timetable, attendance, leave balance, leave requests and payslips
- Communicate with parents through approved school channels
- No default access to other staff salary details or unrestricted student health/behaviour records

### 3.6 Driver

- View assigned vehicle, route, stops, trip schedule and authorized student pickup list
- Start/end trips and record permitted pickup/drop-off events
- Share location only when an authorized trip is active and location permission is granted
- Report incidents, delays and vehicle issues
- View emergency instructions and relevant contact information
- No access to academic marks, fee details, payroll or unrelated student records

### 3.7 Office staff

- Perform assigned admission, records, document, certificate, front-office and communication tasks
- Access only the modules and records granted by an administrator
- Financial operations require separate permissions
- Sensitive changes must be logged

### 3.8 HR and payroll roles

- Manage employee records, recruitment, onboarding, documents, departments, designations, shifts, leave and employee lifecycle
- Payroll preparers calculate draft payroll
- Payroll approvers approve/finalize payroll
- Employees view their own payslips
- Salary and bank information are restricted to explicitly authorized HR/payroll users
- Maintain separation of duties where practical

### 3.9 Permission requirements

- Permissions must be checked by the backend API on every protected operation.
- Frontend route guards and hidden menus are usability measures, not security boundaries.
- Support view/create/update/approve/export/delete-or-archive permissions separately where relevant.
- Sensitive exports require authorization and audit logging.
- Support account deactivation, session revocation and password reset.
- Record who granted/revoked roles and when.
- Avoid shared user accounts.

---

## 4. Public school website and international design direction

### 4.1 Visual direction

Create a premium, contemporary, welcoming school website. The visual quality should feel comparable to a well-designed international school or education institution website, not a generic admin template.

Default design direction:
- Clean, generous whitespace and clear visual hierarchy
- School-specific identity: logo, name, colours, imagery and typography
- High-quality, appropriately licensed campus, classroom, activity and facilities images
- Strong accessible contrast and readable typography
- Restrained use of animation; respect reduced-motion settings
- Responsive navigation with accessible mobile menu
- Clear calls to action without excessive pop-ups
- Consistent components and spacing
- Do not invent school rankings, awards, accreditations, testimonials or statistics. Use editable placeholders until verified content is supplied.

Suggested starter palette (all values configurable):
- Deep navy: `#17365D` for trust and primary navigation
- Teal: `#0F8B8D` for primary actions and highlights
- Warm gold: `#F2B544` for limited accents
- Soft background: `#F4F7FB`
- White surfaces and neutral text colours
- Validate all text and interactive colour combinations for WCAG contrast

### 4.2 Public navigation

- Home
- About the School
- Leadership / Governance
- Academics
- Classes / Curriculum
- Admissions
- Facilities
- Student Life / Activities
- Transport
- News and Events
- Gallery
- Careers
- Contact
- Login

Navigation items must be configurable; disabled pages should not appear as dead links.

### 4.3 Homepage sections

1. Header with school identity, primary navigation, language selector and login/admission actions
2. Hero with real school-approved image, concise message and admission CTA
3. Important notices / announcements
4. School introduction and educational approach
5. Academic programmes and curriculum
6. Facilities and student support
7. Student activities, arts, sports and clubs
8. News, events and achievements using verified content
9. Admissions process and enquiry CTA
10. Transport / campus location information
11. Contact details, map and enquiry form
12. Footer with policies, accessibility, social links and contact information

### 4.4 Public pages and content management

- School profile and campus details
- Leadership profiles
- Academic programme pages
- Admissions steps, eligibility, required documents and enquiry forms
- Events, announcements, circulars and calendars
- News/articles and gallery
- Careers and job enquiry/application forms
- Contact form with spam protection and consent/notice text
- Downloadable prospectus and policy documents
- SEO title/description, canonical URL, sitemap and social sharing metadata
- Editable content via authorized CMS dashboard; no source-code edits for routine content updates
- Draft, preview, publish, schedule and archive workflows
- Media upload validation, alt text, size limits and safe file handling

### 4.5 Branding and multi-school customization

Use one reusable design system with per-school configuration:
- School name, logo, favicon and contact details
- Theme colours and permitted typography choices
- Approved photographs and homepage sections
- Navigation and public page visibility
- Local language and translated content
- Campus addresses and maps
- Admission forms and document requirements
- Enabled modules and feature entitlements

A school must not be able to change another tenant's branding or content.

---

## 5. Dashboard design system

Create separate but consistent dashboards. Public pages and authenticated ERP screens should share brand foundations, not necessarily identical layouts.

### 5.1 Desktop dashboard shell

- Left sidebar with role-specific, grouped navigation
- Top bar with page title/breadcrumbs, academic year/campus context where relevant, search where useful, notification centre and user profile
- Main content with clear page heading and primary action
- Summary cards only for meaningful operational metrics
- Searchable, filterable tables with pagination and sensible column defaults
- Forms with labels, inline validation, help text and clear save/cancel actions
- Confirmation dialogs for destructive or irreversible actions
- Loading skeletons, empty states, errors, retry actions and success feedback
- Responsive collapse to mobile navigation

### 5.2 Design rules

- Use a documented token system for colours, typography, spacing, radii, elevation and breakpoints.
- Avoid cluttered dashboards and excessive gradients, shadows, charts or decorative cards.
- Use tables for operational records; charts only when they answer a real question.
- Do not rely on colour alone to communicate status.
- Support keyboard navigation, visible focus, screen readers, zoom and reduced motion.
- Use consistent date, time, currency and number formatting.
- Include accessible charts or equivalent textual summaries.
- Build reusable components before duplicating page-specific UI.
- Provide light theme initially; dark theme may be added after core accessibility is stable.

### 5.3 Required dashboard areas

- Platform Super Admin
- School Admin / Principal
- Admissions / Office Staff
- Academic Coordinator
- Teacher
- Student
- Parent / Guardian
- Driver / Transport
- HR
- Payroll
- Accountant / Finance
- Transport Manager
- Attendance Officer

---

## 6. Student Information System (SIS)

### 6.1 Student creation

- Unique permanent student identifier and school admission number
- Legal/preferred name as policy permits, date of birth and permitted demographic fields
- Photograph where required and lawfully handled
- Admission date, admission source and status
- Academic year, class, section, roll number and campus
- Parent/guardian contacts and verified relationships
- Address and emergency contacts
- Previous school and transfer documents where applicable
- Required documents with secure storage and access control
- Medical alerts only in restricted fields
- Language and subject selections
- Transport assignment
- Fee plan, scholarship/concession and billing relationship
- Login/account provisioning and parent invitation workflow
- Duplicate detection and controlled merge procedure
- Import preview, validation, error report and safe bulk import

Collect only necessary information. Sensitive demographic or identity fields must be included only when there is a legitimate requirement and approved policy.

### 6.2 Student lifecycle: active, transferred and left school

Never hard-delete a student simply because the student transfers or leaves. Preserve the student's permanent identity and historical records.

Supported lifecycle states should include configurable states such as:
- Enquiry / applicant
- Admission pending
- Admitted / active
- On approved leave or temporarily inactive, if policy requires
- Transferred out
- Withdrawn / left school
- Graduated / completed
- Deceased only if the school has an approved, respectful workflow and genuine need
- Archived record

Lifecycle transitions must be controlled and audited.

### 6.3 Transfer / withdrawal workflow

- Record effective date, reason/category, initiating user and approval
- Record destination school where appropriate and lawfully collected
- Check configurable clearance tasks (library, transport, fees, documents, equipment); clearance must not silently erase academic rights or override applicable law/policy
- Generate Transfer Certificate (TC), leaving certificate or other school-approved documents using configurable templates and authorized signatures
- Assign a unique certificate number and preserve issued document/version
- Prevent duplicate active enrolments for the same student and school/year unless explicitly supported
- Update class lists, timetable eligibility, transport, fee billing and notifications
- Revoke or limit portal access according to approved policy and effective date
- Preserve marks, attendance, payments, receipts, report cards, discipline records and audit history under access/retention rules
- Allow readmission by linking a new enrolment to the same permanent student record
- Support correction, reversal or reactivation only through authorized audited workflows

### 6.4 Parent/guardian relationship

- One student may have multiple guardians
- One guardian may be linked to multiple students
- Store relationship, contact preferences and permitted pickup/communication rights
- Verify account linking; do not expose a child's information based only on knowing an admission number
- Handle custody/restricted-contact instructions through a carefully permissioned workflow where required
- Revoke access when authorization ends

### 6.5 Student record history

Maintain dated history for class/section changes, language selections, guardian links, transport assignments, enrolments, lifecycle status and other significant changes. Do not overwrite historical facts where an effective-dated record is needed.

---

## 7. Academic management

### 7.1 Academic structure

- Academic years and terms/semesters as configurable
- Campuses, grades/classes, sections, streams where relevant
- Subjects and subject groups
- Periods, school hours, holidays and working days
- Curriculum/board configuration without hard-coding one board
- Promotion, retention, graduation and year rollover
- Class capacity and admission eligibility settings

### 7.2 Subject and language selection

- Configure subjects offered by class, section and academic year
- Configure first/second/third language options per grade and school policy
- Store each student's selected language(s) as effective-dated enrolment/subject choices
- Support optional/elective subjects where required
- Validate that selected subjects are offered and have authorized teachers
- Language selection must feed subject allocation, timetable, attendance, homework, examinations, marksheets and reports
- Handle approved subject/language changes with effective dates and audit history
- Provide parent/student view of approved choices, where appropriate

### 7.3 Teacher–subject–class–section mapping

This is a many-to-many assignment model. It must not assume one teacher teaches every subject or one teacher is limited to one class.

Example only:
- Telugu teacher: Telugu for 6A, 6B, 6C, 7A and 7B
- Mathematics teacher: Mathematics for 6A and 7A only
- Science teacher: Science for 6B, 7B and 8A

Each assignment should identify:
- Academic year and term, if applicable
- Campus
- Teacher
- Subject
- Class and section
- Optional student group/elective group
- Effective start/end dates
- Assignment status
- Permission to take attendance, set homework, upload worksheets and enter marks
- Approval/assignment audit history

The system must validate:
- Teacher is active and eligible
- Subject is offered to that class/section
- Class/section and academic year are active
- No conflicting timetable assignment
- Access to attendance, homework, worksheets and marks is limited to the relevant assignment and authorized substitutes

### 7.4 Timetable

- Class timetable and teacher timetable
- Periods, rooms and optional campus locations
- Conflict detection for teacher, class and room
- Substitute teacher assignment with effective dates
- Timetable change notifications
- Student/parent/teacher views
- Printable and exportable timetable
- Do not silently accept conflicts; show the conflict and require authorized resolution

### 7.5 Homework, worksheets and daily diary

- Teachers create and assign homework by subject/class/section/group
- Title, instructions, issue date, due date, attachments and submission requirements
- Upload PDF, image and other approved file types with size/type validation and malware scanning where available
- Worksheet library with subject, grade, topic, language and difficulty tags
- Reuse approved worksheets while retaining assignment history
- Student submission, resubmission policy, timestamp and teacher feedback
- Completion status and overdue views
- Daily diary with lessons covered, homework, notices and activities
- Parent/student visibility follows publication settings
- Push/email/SMS notifications are configurable and rate-limited
- Keep an audit trail for edits after publication

### 7.6 Activities and school calendar

- School events, sports, clubs, trips, competitions and celebrations
- Calendar entries, dates, venue, eligibility, instructions and consent requirements
- Attendance/participation records when needed
- Media upload and parent-visible gallery with appropriate consent and access controls
- Avoid publishing identifiable images of children without school-approved authorization

### 7.7 Examinations and marksheets

- Exam types, terms, subjects, maximum marks, weightings and grading scales
- Configurable assessment components and pass criteria
- Marks entry by authorized subject teacher
- Draft, submitted, approved, published and corrected states
- Validation for maximum marks, missing marks and absent/exempt codes
- Approval workflow before publication
- Report card templates with school branding and authorized signatures
- Subject-wise marks, grades, totals, percentages where appropriate, result status and teacher remarks
- Download/print marksheets as PDF
- Historical result access according to policy
- Corrections after publication require authorization, reason, version history and audit record
- Prevent unauthorized users from viewing unpublished results

---

## 8. Attendance and biometric devices

### 8.1 Student attendance

- Manual class/period attendance by authorized teachers
- Daily or period-based attendance configurable by school
- Present, absent, late, excused, approved leave and other configurable codes
- Attendance history and class summaries
- Parent absence alerts according to notification policy
- Leave request and approval workflow
- Corrections with reason and audit trail
- Reports by student, class, section, subject, date range and academic year
- Prevent duplicate records and define how late edits are handled

### 8.2 Staff attendance

- In/out punches, shifts, holidays, grace periods and late/early departure rules
- Missing punch correction requests and approvals
- Overtime/extra hours only where policy permits
- Employee-wise and department-wise summaries
- Approved attendance results feed HRMS and payroll through controlled rules

### 8.3 Thumb/fingerprint attendance integration

Use a provider-adapter design so device brands can be added without rewriting the core attendance system.

Before production implementation, identify each device's brand/model and supported interface:
- Vendor API/SDK or supported export format
- Local network access and device authentication
- A local connector/agent where the device cannot securely call the cloud API
- Event timestamp, device ID, employee/student mapping and idempotency key
- Retry handling, duplicate detection, device health and sync logs
- Time zone and clock drift handling
- Manual exception/correction workflow
- Monitoring for delayed or failed synchronization

Do not assume all fingerprint devices expose an API. Do not store raw fingerprint images/templates unless separately justified, lawfully approved and protected to a high standard. Prefer device-managed biometric matching and receive attendance events/identifiers only. Confirm applicable legal requirements, notices, consent/alternative process where required, retention and access before activation.

### 8.4 Attendance reconciliation

Define authoritative rules for conflicting manual and device events. Device punches are evidence, not automatically a final payroll decision. Exceptions must be reviewable and changes auditable.

---

## 9. Fees, payments and finance

### 9.1 Fee configuration

- Fee categories: tuition, admission, transport, examination, activity and configurable others
- Class/grade/campus/academic-year fee structures
- Student-specific charges, concessions and scholarships
- Instalment schedules, due dates, late-fee rules and grace periods
- Sibling discounts or other approved concession policies
- Waivers and refunds with permission/approval
- Receipts with unique numbers and school details
- Outstanding balance, ageing and reminders
- Fee statements by student, class and period
- Manual payment entry with reference and audit
- Fee plan changes effective-dated and auditable
- Financial reports and authorized exports

### 9.2 Payment gateway

Use a provider abstraction so an approved Indian gateway such as Razorpay or another selected provider can be integrated.

Requirements:
- Hosted checkout/tokenized flow where appropriate; never store card security codes or raw payment credentials
- Create payment orders server-side
- Verify signed webhooks and payment signatures on the backend
- Treat browser redirect/success screens as untrusted until server verification
- Idempotency for webhook/event processing
- Payment states: initiated, pending, successful, failed, cancelled, refunded and partially refunded as supported
- Reconciliation between gateway, payment records and fee ledger
- Duplicate payment handling and support workflow
- Refund authorization, reason, status and audit
- Receipt generation only according to verified payment/ledger rules
- Test/sandbox mode clearly separated from production
- Store credentials in secret management/environment configuration, never source control
- Payment provider account and production credentials are deployment prerequisites

### 9.3 Finance controls

- Separate fee setup, collection, refund and reconciliation permissions
- Immutable or versioned financial transaction history
- Daily collection summaries and payment settlement reconciliation
- Manual adjustments require reason and approval
- Do not represent the module as a full accounting ledger unless that scope is separately designed

---

## 10. Transport, Google Maps and bus tracking

### 10.1 Transport administration

- Vehicle records, registration, capacity, insurance, permits, fitness and expiry reminders
- Driver records, licence validity, emergency contact and eligibility
- Routes, stops, planned times and route versions
- Assign vehicles and drivers to routes/trips
- Assign students to routes/stops with effective dates
- Transport fees and transport-related notices
- Trip logs, attendance/pickup status, incidents, breakdowns and maintenance
- Driver/vehicle replacement workflow
- Capacity checks and student pickup list
- Authorized emergency contact access
- Reports on route use, vehicle use and transport fees

### 10.2 Google Maps

Possible features, subject to the selected Google Maps Platform products, account, billing, terms and API key restrictions:
- Display campus, stops and route lines
- Geocode addresses where authorized
- Show directions or route estimates
- Show live vehicle markers when GPS coordinates are actually supplied
- Show route/stop details to authorized guardians
- Restrict API keys by application and API; keep server keys on the server
- Monitor quotas, costs and errors; provide graceful fallbacks if map service fails

A map does not create live tracking by itself. Live bus tracking requires a GPS tracker/device or a driver app/PWA that sends authorized location updates, with connectivity, consent/policy, battery and privacy controls.

### 10.3 Driver trip flow

- Driver signs in and sees only assigned trip
- Starts trip and location sharing only when authorized
- Sends timestamped GPS updates if configured and permission granted
- Records pickup/drop-off status only for assigned students and trip
- Reports delay/incident
- Ends trip; location sharing stops
- Parents see the most recent valid location and its timestamp, not a misleading “live” label when data is stale
- Retain location history only as long as needed under approved policy

---

## 11. HRMS and employee lifecycle

### 11.1 Employee creation

- Permanent employee ID
- Name and contact details needed for employment
- Department, designation, campus, reporting manager and employment type
- Qualification, role-related credentials and document expiry
- Joining date, probation, contract and status
- Subject/teaching eligibility where relevant
- Shift and leave policy
- Salary structure access restricted to authorized HR/payroll roles
- Login creation and role assignment
- Secure document uploads and expiry reminders

### 11.2 Employee lifecycle

Support applicant/recruitment (if enabled), offer, onboarding, probation, active employment, internal transfer, leave/suspension where approved, resignation, termination, notice period, exit clearance, final settlement, archived employment and rejoining.

Internal transfers must retain prior department, designation, campus, reporting and salary history with effective dates.

### 11.3 Teacher departure and reassignment

When a teacher leaves or transfers:
- Flag active teaching assignments and future timetable periods
- Notify authorized academic administrators
- Provide a controlled replacement/substitute workflow
- Preserve historic marksheets, attendance, homework and audit attribution
- Remove access at the correct effective time and revoke sessions/tokens
- Prevent the departing account from accessing student or school data after deactivation
- Retain employment records only for approved purposes and retention periods

### 11.4 Leave and HR workflows

- Leave types, eligibility, accrual, balance and carry-forward policies
- Leave application, manager approval, HR review where needed
- Holiday calendar and shift management
- Employee attendance corrections
- Document acknowledgement and HR notices
- Optional recruitment, onboarding checklist, performance reviews and training, phased as required

---

## 12. Payroll

Payroll must be configurable and reviewable. Statutory calculations must be validated against current applicable Indian laws and professional payroll advice before production use.

### 12.1 Payroll capabilities

- Salary structures with effective dates
- Earnings, allowances, deductions, reimbursements and employer contributions as configured
- Monthly or configured payroll periods
- Attendance/leave inputs from approved HRMS rules
- Arrears, adjustments, bonus/incentive and final settlement where applicable
- Draft calculation, validation, review, approval, finalization and locked payroll run
- Payslip PDF and secure employee access
- Bank/payment export only with authorization and validation
- Payroll register, department/cost-centre summaries and statutory reports as supported
- Payroll reversal/correction workflow with audit trail
- Role-based access to salary, bank and tax information
- Reconciliation of payroll totals and payment status

### 12.2 Payroll controls

- Preparers should not silently approve their own final payroll where separation of duties is configured.
- Finalized payroll must not be edited in place; corrections should create an auditable adjustment/reversal.
- Payslips must only be visible to the employee and authorized payroll/HR roles.
- Do not hard-code tax rates, statutory thresholds or contribution rules without versioned configuration and a maintenance process.
- Clearly flag unsupported or unverified statutory calculations instead of claiming compliance.

---

## 13. Communication and notifications

### 13.1 Channels

- In-app notification centre
- Web Push notifications for supported PWA browsers/devices
- SMS via selected provider
- Email via selected provider
- WhatsApp Business Platform/provider integration
- Optional downloadable notices and circulars

### 13.2 Events

Configurable triggers include:
- Admission enquiry/application status
- Student absence/late attendance
- Homework and worksheet assignment/due date
- Marks/results publication
- Fee due date, payment confirmation and receipt
- Bus trip start, delay, pickup/drop-off and incident
- School closure, events and announcements
- Leave request/approval
- HR document expiry and payroll/payslip availability
- Security and account events

### 13.3 Delivery architecture

- Queue outbound messages using background jobs
- Retry transient failures with bounded backoff
- Record provider, status, timestamps and safe error details
- Avoid duplicate messages using idempotency keys
- Respect parent/user preferences, consent/legal basis and quiet-hour policies
- Templates must support variables, language variants, preview and approval
- Avoid placing sensitive health, marks or payroll details in SMS or push previews
- Protect against message floods and unauthorized bulk sends
- Display “sent”, “delivered” or “read” only when the provider actually supplies that status

Production use requires provider accounts, sender configuration and required approvals. Do not claim WhatsApp delivery through a personal WhatsApp account or unofficial automation.

---

## 14. Health and behaviour information

### 14.1 Health master

- Minimum necessary health information
- Allergies and emergency alerts
- Authorized medical notes and school-approved action plans
- Emergency contacts and approved response instructions
- Date, author, review date and source of information
- Secure attachment support where justified
- Restricted access and access logging
- Clear update and correction history
- Retention and deletion/archival according to approved policy

### 14.2 Behaviour and wellbeing

- Incident date/time, context and category
- Factual description rather than unsupported labels
- People involved, witnesses and related actions where necessary
- Positive behaviour/achievement observations
- Follow-up, parent meeting, action plan and closure status
- Restricted notes and role-specific visibility
- Corrections and appeals/history where school policy requires
- Avoid exposing sensitive notes in general student lists or notifications
- No automated high-impact decisions or stigmatizing student rankings based solely on behaviour records

These records require more restrictive permissions than ordinary academic information.

---

## 15. Office operations and additional school modules

- Admissions enquiry pipeline and application processing
- Document verification and admission checklist
- Student/employee certificate generation
- Front-office visitor/enquiry logs where needed
- Circulars, notices and document repository
- School calendar and event management
- Library module as an optional future module
- Inventory/assets and issue/return as optional future modules
- Complaints/requests/helpdesk as an optional module
- Staff substitutions and operational task tracking
- Exportable operational reports
- Approval workflows and audit trail

Optional modules should be feature-flagged and must not block the core SIS/ERP.

---

## 16. Analytics and reporting

### 16.1 School dashboard metrics

- Total active students by campus/class/section
- New admissions and application pipeline
- Student attendance today and trends
- Staff attendance and missing punches
- Fee collection, outstanding balances and ageing
- Payment failures and reconciliation exceptions
- Homework/worksheet assignment and completion summaries
- Examination/academic performance summaries with appropriate access controls
- Transport utilization and active trips
- HR headcount, leave and employee turnover summaries
- Payroll totals visible only to authorized roles
- Integration health, notification failures and pending background jobs

### 16.2 Reporting requirements

- Filters by academic year, date range, campus, class, section, subject and status as relevant
- CSV/PDF exports where authorized
- Report generation must respect row-level permissions and tenant boundaries
- Large exports should run asynchronously
- Audit sensitive exports
- Clearly label data freshness and time zone
- Provide accessible table alternatives for charts
- Avoid exposing small-group sensitive statistics to unauthorized users

---

## 17. Backend architecture and technology

### 17.1 Recommended baseline

- **Frontend:** Angular + TypeScript, using a maintained compatible release selected at implementation time
- **UI:** accessible reusable design system and component library selected after a small proof of concept
- **Backend:** ASP.NET Core Web API
- **Database:** PostgreSQL
- **Background processing:** durable job processing appropriate to the chosen deployment; Redis may be used for cache/queues only with clear durability guarantees
- **File storage:** S3-compatible object storage or equivalent, with private buckets and time-limited access URLs
- **API documentation:** OpenAPI/Swagger in development and appropriately secured environments
- **Deployment:** Linux containers with Docker Compose initially; orchestration can be added if scale requires it
- **Reverse proxy/TLS:** supported reverse proxy with HTTPS and security headers
- **Monitoring:** structured logs, metrics, health checks and error alerting
- **Testing:** unit, integration, end-to-end, accessibility, security and load tests

Pin supported versions and document the exact selected versions in a separate implementation decision record. Do not assume the newest version is automatically compatible with every dependency.

### 17.2 Architectural style

Start with a **modular monolith** organized by business domain, with clear boundaries and contracts. Avoid premature microservices.

Suggested backend modules:
- Identity and Access
- Tenant/School Configuration
- CMS/Public Website
- Admissions
- Student Information
- Parent/Guardian
- Academic Structure
- Teacher Assignment and Timetable
- Attendance and Device Integration
- Homework/Worksheets/Diary
- Examination and Marksheets
- Fees and Payments
- Transport and Maps
- Notifications
- HRMS
- Payroll
- Health and Behaviour
- Reporting and Analytics
- Documents
- Audit
- Licensing and Entitlements
- Background Jobs and Integration Adapters

### 17.3 Data and API principles

- Use explicit request/response DTOs; never expose database entities directly.
- Validate input on the server and return consistent, safe error formats.
- Use pagination, filtering, sorting and maximum page sizes.
- Use optimistic concurrency/version checks for sensitive edits where appropriate.
- Use database transactions for related financial, lifecycle and approval changes.
- Use idempotency for payment callbacks, imports and device events.
- Version public APIs where necessary.
- Avoid business logic in controllers and UI components.
- Use UTC for persisted timestamps and convert to configured school/user time zones for display.
- Use `Asia/Kolkata` as a default school time zone only when appropriate and configurable.
- Keep secrets out of source code, logs, frontend bundles and repository history.
- Apply database migrations and test them on representative data.

---

## 18. Initial data model / entity catalogue

This is a logical starting point, not a final physical schema. Refine relationships and constraints during design.

### 18.1 Tenant, school and identity

- `Tenant`, `School`, `Campus`, `SchoolBranding`, `SchoolSettings`
- `AcademicYear`, `SchoolCalendar`, `Holiday`
- `User`, `Role`, `Permission`, `UserRole`, `UserSession`, `LoginAudit`
- `FeatureEntitlement`, `Subscription`, `LicenseRecord`
- `AuditEvent`

### 18.2 Student and guardian

- `Student`, `StudentEnrollment`, `StudentStatusHistory`
- `Guardian`, `StudentGuardian`, `GuardianVerification`
- `StudentAddress`, `EmergencyContact`, `StudentDocument`
- `StudentLanguageSelection`, `StudentSubjectEnrollment`
- `StudentTransfer`, `TransferCertificate`, `StudentExitClearance`
- `StudentHealthProfile`, `HealthRecord`, `HealthAccessAudit`
- `BehaviourIncident`, `BehaviourFollowUp`
- `StudentTransportAssignment`

### 18.3 Staff and HR

- `Employee`, `EmploymentRecord`, `EmployeeStatusHistory`
- `EmployeeDocument`, `Department`, `Designation`
- `EmployeeTransfer`, `EmployeeExit`, `ExitClearance`
- `Shift`, `LeaveType`, `LeaveBalance`, `LeaveRequest`, `LeaveApproval`
- `EmployeeAttendance`, `AttendanceCorrection`
- `PayrollPeriod`, `SalaryStructure`, `SalaryComponent`, `PayrollRun`
- `PayrollLine`, `Payslip`, `PayrollAdjustment`, `FinalSettlement`

### 18.4 Academic records

- `Class`, `Section`, `Subject`, `SubjectOffering`
- `TeacherAssignment`, `TeacherAssignmentHistory`
- `Timetable`, `TimetablePeriod`, `Room`, `Substitution`
- `AttendanceSession`, `StudentAttendance`, `AttendanceEvent`
- `BiometricDevice`, `DeviceSyncJob`, `DeviceSyncError`
- `Homework`, `Worksheet`, `Assignment`, `Submission`, `TeacherFeedback`
- `DailyDiaryEntry`, `SchoolActivity`, `Event`, `ConsentRecord`
- `Examination`, `AssessmentComponent`, `MarkEntry`, `GradeScale`
- `ReportCard`, `ReportCardVersion`, `ResultPublication`

### 18.5 Fees, payments and transport

- `FeeCategory`, `FeeStructure`, `StudentFeePlan`, `FeeInstallment`
- `FeeCharge`, `FeeAdjustment`, `Payment`, `PaymentAttempt`
- `PaymentWebhookEvent`, `Refund`, `Receipt`, `ReconciliationBatch`
- `Vehicle`, `DriverAssignment`, `Route`, `RouteStop`, `Trip`
- `TripLocation`, `PickupDropoffEvent`, `TransportIncident`
- `VehicleDocument`, `VehicleMaintenance`

### 18.6 Content and communication

- `Page`, `PageRevision`, `MediaAsset`, `Announcement`, `NewsArticle`
- `AdmissionEnquiry`, `AdmissionApplication`, `ApplicationDocument`
- `NotificationTemplate`, `NotificationPreference`, `NotificationMessage`
- `NotificationDeliveryAttempt`, `PushSubscription`
- `FileMetadata`, `BackgroundJob`, `IntegrationConfiguration`

Use primary keys that are not predictable sequential identifiers where public exposure could create enumeration risk. Add tenant/school scope to every relevant record and enforce it in both application logic and, where suitable, database constraints/row-level security. Do not store files as public URLs by default.

---

## 19. PWA requirements (Option B)

The initial mobile strategy is a responsive website plus installable PWA, not a separate native application.

- Valid web app manifest, name, icons, theme colours and start URL
- HTTPS in production
- Service worker with a documented cache strategy
- Installability guidance where supported
- Responsive, touch-friendly navigation and forms
- Web Push notifications where supported and explicitly permitted
- Graceful behaviour on unsupported browsers/devices
- Clear update notification and service worker refresh strategy
- Offline fallback for public/static content where practical
- Do not cache sensitive API responses, student health records, marks, fees or payroll by default
- Any offline data feature requires a separate security design, expiry, encryption and conflict resolution
- PWA must never claim an action was saved to the backend when the request failed
- Show network state and retry actions where useful
- Test on current supported Android Chrome and desktop browsers; document iOS/Safari limitations for installation and push features
- Provide app-like icons and branded launch experience without blocking accessibility

The backend remains authoritative. Native Android/iOS apps may be added later using the same API.

---

## 20. Security, privacy and compliance

This product handles information about children and employees. Security and privacy are core requirements, not a later enhancement.

### 20.1 Authentication and authorization

- Secure login, password hashing using a modern framework-supported algorithm and parameters
- Optional/required MFA for privileged accounts
- Secure session/token lifecycle, expiry, revocation and logout
- Rate limiting and brute-force protections
- Account recovery that does not disclose whether an account exists
- Backend authorization on every sensitive operation
- Least-privilege role defaults and periodic access review
- Re-authentication or approval for especially sensitive actions where appropriate
- Avoid storing access tokens in insecure browser storage; choose a documented secure session strategy

### 20.2 Data protection

- TLS for all production traffic
- Encryption at rest for database, backups and object storage where supported
- Separate secrets from configuration committed to source control
- Restrict production data access and mask sensitive fields in logs
- Private document storage and short-lived signed download links
- Validate file extension, MIME type, size and content; malware scan where available
- Avoid raw biometric template storage unless separately approved
- Access audit for health, behaviour, payroll, identity and sensitive exports
- Data minimization, purpose limitation, retention schedules and secure deletion/archival
- Data breach response process and incident logging
- Backups encrypted and access-controlled

### 20.3 Child safety and Indian requirements

- Review applicable Indian data-protection and child-data obligations, education rules, payment rules and employment/payroll requirements with qualified counsel or compliance professionals.
- Provide appropriate privacy notices, lawful basis/consent flows where required, guardian controls and correction mechanisms.
- Document the purpose and retention period for student location and health information.
- Avoid public display of children's personal information.
- Apply appropriate parental/guardian verification.
- Provide alternate attendance processes where required and approved for students/employees unable or unwilling to use biometrics.
- Do not claim legal compliance merely because a feature exists.

### 20.4 Application security

- Follow OWASP secure-development practices and assess relevant OWASP Top 10 risks.
- Validate inputs, encode outputs and protect against injection, XSS, CSRF and insecure direct object references.
- Use secure CORS, security headers, cookie flags and content security policy as appropriate.
- Protect webhooks with signature validation, replay protection and idempotency.
- Keep dependencies patched and scan dependencies/images.
- Separate development, staging and production credentials/data.
- Do not use real children's data in demos or tests.
- Conduct threat modelling for payments, child records, biometric integration and role escalation.

---

## 21. Accessibility, localization and usability

### 21.1 Accessibility target

Target **WCAG 2.2 Level AA**:
- Semantic HTML and logical heading order
- Keyboard-operable controls and visible focus
- Sufficient text/non-text contrast
- Proper labels, descriptions and accessible validation errors
- Screen-reader names and status announcements
- Accessible dialogs, menus, tables and charts
- No colour-only status cues
- Reduced motion support
- Touch target and zoom/reflow testing
- Captions/transcripts for supplied media where appropriate
- Accessibility testing with automated tools plus manual keyboard and screen-reader checks

Lighthouse scores are useful but do not prove WCAG compliance. Define performance/accessibility budgets and test representative pages.

### 21.2 Languages and regional settings

- English initially, with Telugu and Hindi translation support
- Translation files and localized CMS content rather than hard-coded text
- User-selectable interface language
- School-configured default language
- Separate language for content/subjects from interface language
- Date, time, number and currency formatting by locale
- Indian Rupee (INR) as configurable default currency
- Academic-year and grading policies configurable by school/board
- Missing translation fallback and translation QA process

---

## 22. Non-functional requirements and service quality

Set measurable targets during discovery and validate with load tests. Initial targets to refine:
- Responsive core pages with no horizontal overflow at supported viewport widths
- Core APIs use pagination and bounded query complexity
- Avoid N+1 database access patterns and unbounded exports
- Target a good Core Web Vitals experience on representative devices/networks
- Define uptime, RPO and RTO with the client before production
- Background jobs are observable, retryable and idempotent where possible
- User-facing errors are clear without exposing stack traces or secrets
- Graceful degradation when Maps, SMS, email, WhatsApp or payment providers are unavailable
- Database indexes and query plans are reviewed for high-volume tables
- Log correlation IDs across API and background jobs
- Monitor disk, database, queue, error rate, latency and backup status
- Test expected peak admissions, attendance, fee-payment and result-publication periods

Do not promise specific performance or availability until environment, hosting, traffic and service-level requirements are confirmed.

---

## 23. Deployment and operations

### 23.1 Environments

- Local development
- Automated test/CI
- Staging/UAT
- Production

Use separate databases, credentials, domains and integration keys. Production data must not be copied into development without approved masking/anonymization.

### 23.2 Linux and Docker

- Docker images built from maintained base images
- Non-root containers where practical
- Health checks and graceful shutdown
- Persistent volumes only where required
- Private PostgreSQL and Redis networking; do not expose databases publicly
- Reverse proxy and HTTPS
- Environment/secret management
- Database migration procedure with rollback/forward-fix plan
- Versioned releases and deployment notes
- Ports configurable through environment variables; avoid hard-coded conflicts
- Firewall rules and least-privilege network access

### 23.3 Backups and recovery

- Scheduled PostgreSQL backups and required object-storage backups
- Encrypted backup storage separate from the primary host
- Retention schedule and backup monitoring
- Periodic restore tests with documented results
- Define RPO/RTO with the client
- Document disaster recovery, lost credentials and compromised-account response
- A backup is not considered reliable until restoration has been tested

### 23.4 Observability and support

- Structured application logs with sensitive data redacted
- Metrics and health endpoints secured appropriately
- Error tracking and alerts
- Background-job dashboard and retry/dead-letter handling
- Integration health indicators
- Audit search for authorized administrators
- Support runbooks for payment mismatch, device sync failure, notification failure and backup recovery

---

## 24. Licensing and multi-school readiness

If sold commercially to multiple schools:
- Unique tenant/school identity and data isolation
- Configurable plans and feature entitlements
- License/subscription status and renewal workflow
- Grace period and documented handling of expired/unreachable licensing services
- Signed license artefacts or server-validated entitlements where appropriate
- License secrets must not be embedded in public frontend code
- Do not make core school data inaccessible solely because a remote licensing service is temporarily unavailable; define a safe and contractually appropriate policy
- School administrators manage their own content and users without source-code changes
- Platform owner cannot silently impersonate school users
- Tenant export/offboarding and data-retention process
- Contract terms must define ownership, permitted use, support, data processing and termination

Licensing enforcement must be implemented and tested server-side. Frontend-only checks are not sufficient.

---

## 25. Testing strategy

### 25.1 Required test layers

- Unit tests for business rules
- API integration tests with a real test database
- Database migration and constraint tests
- End-to-end browser tests for critical user journeys
- RBAC and tenant-isolation tests
- Payment webhook/signature/idempotency tests
- Attendance device import and duplicate-event tests
- PWA installation, update, cache and offline tests
- Accessibility automated and manual tests
- Performance/load tests for expected peaks
- Security scanning and dependency checks
- Backup restore and disaster recovery tests
- Regression tests before every release

### 25.2 Critical acceptance scenarios

1. School A cannot access School B's records, files, reports or APIs.
2. A teacher cannot enter marks or attendance for an unassigned class/subject without an explicitly granted permission.
3. A Telugu teacher can be assigned to several sections while a Maths teacher is assigned to only selected sections.
4. Language changes preserve history and update the appropriate subject assignments, timetable and assessment views.
5. Student transfer/withdrawal preserves all historical academic and financial records.
6. Readmission links to the correct permanent student record without creating duplicate identity.
7. Departing teacher access is revoked and active classes are flagged for reassignment.
8. Payroll is restricted, approved and versioned; finalized runs cannot be silently edited.
9. A forged payment redirect cannot mark a fee as paid.
10. Duplicate payment webhooks do not create duplicate payments or receipts.
11. Device sync retries do not duplicate attendance events.
12. Stale GPS data is clearly labelled; the system does not falsely show a bus as live.
13. Health/behaviour records are invisible to roles without explicit access.
14. Notification failures are recorded and retried without message floods.
15. PWA caching does not expose sensitive records on shared devices.
16. Keyboard-only users can complete login, forms and key workflows.
17. Public content can be updated by authorized school staff without editing source code.
18. Backups can be restored and verified in a clean environment.

---

## 26. Phased implementation roadmap

Deliver working, testable increments. Do not implement all modules in one uncontrolled code-generation step.

### Phase 0 — Discovery and technical foundation

- Confirm school board needs, user volumes, campuses, academic policies and workflows
- Confirm biometric device make/model and interface
- Select payment, Maps, SMS, email and WhatsApp providers
- Define branding/content assets and privacy/legal review requirements
- Establish repository, environments, coding standards, CI, database migrations and design tokens
- Create threat model, domain model and API conventions
- Produce architecture decision records and implementation plan

**Exit criteria:** decisions and dependencies are documented; build/test/deploy pipeline works.

### Phase 1 — Design system, identity and school configuration

- Public website shell and CMS foundation
- Branding and localization
- Login, password recovery, session handling and RBAC
- School/campus/academic year setup
- User administration, audit framework and tenant isolation
- Responsive dashboard shell and PWA foundation

**Exit criteria:** roles are enforced on backend; public content is editable; tenant isolation tests pass.

### Phase 2 — Student/staff core and lifecycle

- Student and guardian creation
- Teacher, driver and other employee creation
- Class, section, subject and language configuration
- Teacher–subject–class–section assignments
- Student transfer/withdrawal/readmission
- Employee transfer/resignation/termination/rejoining
- Document management and account provisioning

**Exit criteria:** lifecycle histories are preserved; access is revoked correctly; assignment rules are tested.

### Phase 3 — Academics and attendance

- Timetable and substitution
- Student/staff attendance
- Leave requests and approvals
- Homework, worksheets, submissions and daily diary
- Activities and calendar
- Examinations, marksheets and report cards
- Manual attendance correction and audit

**Exit criteria:** assignments and permissions drive academic workflows; published results and corrections are traceable.

### Phase 4 — Fees and payments

- Fee structures, instalments, concessions and dues
- Payment provider sandbox integration
- Verified webhooks, receipts, refunds and reconciliation
- Fee analytics and reminders

**Exit criteria:** payment idempotency, reconciliation and security tests pass before production credentials are enabled.

### Phase 5 — Transport and integrations

- Vehicles, drivers, routes, stops and student assignments
- Google Maps display
- GPS/device/driver-location integration as selected
- Thumb biometric adapter and local agent if required
- SMS/email/WhatsApp provider adapters
- Web Push notifications

**Exit criteria:** actual hardware/provider end-to-end tests pass; failures are observable and recoverable.

### Phase 6 — HRMS and payroll

- Employee lifecycle and documents
- Attendance/leave integration
- Salary structures, payroll runs, approvals and payslips
- Statutory rules validated for target jurisdiction
- Final settlement and payroll reporting

**Exit criteria:** payroll reconciles against approved inputs; access separation and audit tests pass.

### Phase 7 — Analytics, hardening and launch

- Cross-module reports and dashboards
- Performance and accessibility remediation
- Security testing and recovery drill
- Data import rehearsal and user acceptance testing
- Training, documentation, support runbooks and release checklist
- Production deployment and monitored rollout

**Exit criteria:** client acceptance sign-off, restore verification, integration readiness and operational ownership are documented.

---

## 27. AI coding-agent instructions

This file is the product source of truth. Any AI coding agent or developer must:

1. Read this entire master specification before proposing or changing architecture.
2. Inspect the existing repository and preserve working functionality; do not assume it is empty.
3. Identify conflicts between current code and this specification before making destructive changes.
4. Create/update a requirements traceability checklist linking every requirement to modules, implementation, tests and status.
5. Work in small, reviewable phases; explain the planned files and migrations before major changes.
6. Never claim a feature is complete unless code, tests and any required external integration are actually implemented and verified.
7. Never fabricate API credentials, provider responses, device capabilities or successful production integration.
8. Use sandbox/mock adapters only when clearly labelled and keep production configuration separate.
9. Enforce permissions in backend services and APIs, not just UI menus.
10. Use migrations and constraints for database changes; do not edit production data manually as a substitute for migrations.
11. Preserve student, employee, financial, academic and audit history during lifecycle changes.
12. Do not hard-delete records where archive/status/history is required.
13. Add unit/integration/end-to-end tests for every business rule and regression.
14. Do not put secrets, tokens, personal data or real student information in source code, logs, screenshots or test fixtures.
15. Use synthetic data for demos and tests.
16. Run formatting, linting, builds, tests and relevant security/accessibility checks before declaring a phase complete.
17. Update README, environment examples, setup instructions, migration notes and troubleshooting docs.
18. Report completed items, uncompleted items, test results, assumptions and external prerequisites honestly.
19. Do not silently remove a requirement to make a build pass; raise a documented decision instead.
20. Keep this master file updated when a requirement is formally changed, including a dated change note.

### Required phase completion report

For each phase, provide:
- Requirements completed
- Files/modules changed
- Database migrations
- API endpoints and permissions
- Tests added and exact results
- Manual test steps
- External accounts/hardware/credentials still required
- Known issues and risks
- Deployment and rollback instructions
- Traceability checklist status

---

## 28. Definition of done

A feature is not complete merely because a screen exists. A feature is done when:
- UI is responsive and accessible
- Backend business rules and authorization are implemented
- Database persistence and constraints are correct
- Validation, loading, empty, success and error states are handled
- Audit requirements are met
- Tests cover normal, boundary, failure and unauthorized cases
- Relevant documentation is updated
- No credentials or sensitive test data are exposed
- External integration status is accurately described
- Acceptance criteria are demonstrated in a working environment

The product is ready for production only after agreed UAT, security review, backup restoration test, provider/hardware verification, operational runbooks and client approval.

---

## 29. Open decisions to resolve during Phase 0

Do not block creation of the initial architecture on these questions; record assumptions and confirm before the affected production feature is built.

- Exact school board(s), grades, campuses and student/staff volume
- School name, brand assets, verified website content and approved photography
- Exact biometric thumb/fingerprint device make/model and whether it is for students, staff or both
- Selected payment gateway and merchant account
- GPS tracker vs driver-phone location, and approved tracking/privacy policy
- SMS, email and WhatsApp providers and account approvals
- Required salary components and applicable statutory payroll rules
- Required reports, certificates and school-specific templates
- Hosting provider, domain, backup targets, RPO/RTO and support model
- Multi-tenant SaaS vs a single-school deployment for the first release
- Data retention, consent/notices, guardian verification and access policy approved by the school

---

## 30. Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 10 October 2026 | Initial master specification covering international-quality public website, role-based School ERP, student and employee lifecycles, academics, teacher-subject mapping, PWA, integrations, HRMS/payroll, security, architecture and phased delivery. |

---

**End of master specification.**
