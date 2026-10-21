import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PagedResult<T> { items: T[]; totalCount: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  resolveSchool(code: string) { return this.http.get<any>(`${this.base}/tenants/resolve/${encodeURIComponent(code)}`); }
  getParentChildren() { return this.http.get<any[]>(`${this.base}/parents/children`); }

  // School
  getSchool(schoolId: string) { return this.http.get<any>(`${this.base}/schools/${schoolId}`); }
  getAcademicYears(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/academic-years`); }
  getClasses(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/classes`); }
  getSubjects(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/subjects`); }
  getDepartments(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/departments`); }

  // Students
  getStudents(schoolId: string, academicYearId: string, page = 1, pageSize = 25, search = ''): Observable<PagedResult<any>> {
    let params = new HttpParams().set('academicYearId', academicYearId).set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<any>>(`${this.base}/schools/${schoolId}/students`, { params });
  }
  createStudent(schoolId: string, body: any) { return this.http.post<any>(`${this.base}/schools/${schoolId}/students`, body); }

  // Employees
  getEmployees(schoolId: string, page = 1, pageSize = 25, search = ''): Observable<PagedResult<any>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<any>>(`${this.base}/schools/${schoolId}/employees`, { params });
  }
  createEmployee(schoolId: string, body: any) { return this.http.post<any>(`${this.base}/schools/${schoolId}/employees`, body); }

  // Attendance
  getAttendance(schoolId: string, classId: string, sectionId: string, date: string) {
    return this.http.get<any>(`${this.base}/schools/${schoolId}/attendance`, { params: { classId, sectionId, date } });
  }
  markAttendance(schoolId: string, body: any) { return this.http.post<any>(`${this.base}/schools/${schoolId}/attendance`, body); }

  // Fees
  getStudentPayments(schoolId: string, studentId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/fees/student/${studentId}`); }
  recordPayment(schoolId: string, body: any) { return this.http.post<any>(`${this.base}/schools/${schoolId}/fees/record`, body); }

  // Transport
  getRoutes(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/transport/routes`); }
  getActiveTrips(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/transport/trips/active`); }

  // Homework
  getHomework(schoolId: string, sectionId?: string) {
    let params = new HttpParams();
    if (sectionId) params = params.set('sectionId', sectionId);
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/homework`, { params });
  }

  // Examinations
  getExaminations(schoolId: string, academicYearId: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/examinations`, { params: { academicYearId } });
  }

  // Teacher assignments
  getTeacherAssignments(schoolId: string, academicYearId: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/teacher-assignments`, { params: { academicYearId } });
  }

  // Dashboard
  getDashboardStats(schoolId: string, academicYearId: string) {
    return this.http.get<any>(`${this.base}/schools/${schoolId}/dashboard`, { params: { academicYearId } });
  }

  // Audit
  getAuditLog(page = 1, pageSize = 50, entityType?: string, actor?: string) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (entityType) params = params.set('entityType', entityType);
    if (actor) params = params.set('actor', actor);
    return this.http.get<any>(`${this.base}/audit`, { params });
  }

  // Leave
  getLeaveTypes(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/leave/types`); }
  getLeaveRequests(schoolId: string, status?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/leave/requests`, { params });
  }
  applyLeave(schoolId: string, body: any) { return this.http.post<any>(`${this.base}/schools/${schoolId}/leave/apply`, body); }
  approveLeave(schoolId: string, leaveId: string) { return this.http.post<any>(`${this.base}/schools/${schoolId}/leave/${leaveId}/approve`, {}); }
  rejectLeave(schoolId: string, leaveId: string) { return this.http.post<any>(`${this.base}/schools/${schoolId}/leave/${leaveId}/reject`, {}); }

  // Examinations
  createExamination(schoolId: string, body: any) { return this.http.post<any>(`${this.base}/schools/${schoolId}/examinations`, body); }
  enterMarks(schoolId: string, examId: string, entries: any[]) { return this.http.post<any>(`${this.base}/schools/${schoolId}/examinations/${examId}/marks`, entries); }
  publishExam(schoolId: string, examId: string) { return this.http.post<any>(`${this.base}/schools/${schoolId}/examinations/${examId}/publish`, {}); }
  getStudentResults(schoolId: string, examId: string, studentId: string) { return this.http.get<any>(`${this.base}/schools/${schoolId}/examinations/${examId}/results/${studentId}`); }

  createHomework(schoolId: string, body: any) { return this.http.post<any>(`${this.base}/schools/${schoolId}/homework`, body); }

  getStudentAttendance(schoolId: string, studentId: string, from: string, to: string) {
    return this.http.get<any>(`${this.base}/schools/${schoolId}/attendance/student/${studentId}`, { params: { from, to } });
  }

  getIntegrations(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/integrations`); }
  updateIntegration(schoolId: string, key: string, body: any) {
    return this.http.put<any>(`${this.base}/schools/${schoolId}/integrations/${key}`, body);
  }
  testIntegration(schoolId: string, key: string, body: any = {}) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/integrations/${key}/test`, body);
  }

  getAnnouncements(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/communications/announcements`); }
  sendAnnouncement(schoolId: string, body: any) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/communications/announcements`, body);
  }
  getNotificationOutbox(schoolId: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/communications/outbox`);
  }

  createOnlineFeeOrder(schoolId: string, body: { studentId: string; amount: number }) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/fees/online-order`, body);
  }
  getTransportMap(schoolId: string) {
    return this.http.get<any>(`${this.base}/schools/${schoolId}/transport/map`);
  }

  getPayrollRuns(schoolId: string) { return this.http.get<any[]>(`${this.base}/schools/${schoolId}/payroll/runs`); }
  createPayrollRun(schoolId: string, year: number, month: number) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/payroll/runs`, { year, month });
  }
  finalizePayroll(schoolId: string, runId: string) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/payroll/runs/${runId}/finalize`, {});
  }
  getPayslips(schoolId: string, runId: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/payroll/runs/${runId}/payslips`);
  }

  requestEnquiryOtp(schoolCode: string, body: any) {
    return this.http.post<any>(`${this.base}/public/${encodeURIComponent(schoolCode)}/enquiries/otp`, body);
  }
  verifyEnquiryOtp(schoolCode: string, body: { challengeId: string; otp: string }) {
    return this.http.post<any>(`${this.base}/public/${encodeURIComponent(schoolCode)}/enquiries/otp/verify`, body);
  }
  getEnquiries(schoolId: string, status?: string, kind?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (kind) params = params.set('kind', kind);
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/enquiries`, { params });
  }
  getEnquiry(schoolId: string, id: string) {
    return this.http.get<any>(`${this.base}/schools/${schoolId}/enquiries/${id}`);
  }
  getEnquiryStaff(schoolId: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/enquiries/staff`);
  }
  assignEnquiry(schoolId: string, id: string, assignedToUserId: string) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/enquiries/${id}/assign`, { assignedToUserId });
  }
  updateEnquiryStatus(schoolId: string, id: string, status: string, followUpOn?: string) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/enquiries/${id}/status`, { status, followUpOn: followUpOn || null });
  }
  addEnquiryNote(schoolId: string, id: string, note: string, action = 'Call') {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/enquiries/${id}/notes`, { note, action });
  }

  getRegistrations(schoolId: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/registrations`);
  }
  createRegistration(schoolId: string, body: any) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/registrations`, body);
  }
  payRegistrationFee(schoolId: string, id: string, amount: number) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/registrations/${id}/fee`, { amount, method: 'Cash' });
  }
  confirmRegistration(schoolId: string, id: string) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/registrations/${id}/confirm`, {});
  }
  getAdmissionForm(schoolId: string, id: string) {
    return this.http.get(`${this.base}/schools/${schoolId}/registrations/${id}/admission-form`, { responseType: 'text' });
  }
  issueBonafide(schoolId: string, id: string) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/registrations/${id}/bonafide`, {});
  }
  registrationDocuments(schoolId: string, id: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/registrations/${id}/documents`);
  }
  uploadRegistrationDocument(schoolId: string, id: string, file: File, kind: string) {
    const data = new FormData();
    data.append('file', file);
    data.append('kind', kind);
    return this.http.post<any>(`${this.base}/schools/${schoolId}/registrations/${id}/documents`, data);
  }
  verifyRegistrationDocument(schoolId: string, documentId: string) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/registrations/documents/${documentId}/verify`, {});
  }
  previewStudentImport(schoolId: string, academicYearId: string, file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<any>(`${this.base}/schools/${schoolId}/registrations/import/preview`, data, { params: { academicYearId } });
  }
  commitStudentImport(schoolId: string, academicYearId: string, file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<any>(`${this.base}/schools/${schoolId}/registrations/import/commit`, data, { params: { academicYearId } });
  }
  setStudentStatus(schoolId: string, id: string, status: string) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/students/${id}/status`, { status });
  }
  setEmployeeStatus(schoolId: string, id: string, status: string) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/employees/${id}/status`, { status });
  }
  createTeacherAssignment(schoolId: string, body: any) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/teacher-assignments`, body);
  }
  deactivateTeacherAssignment(schoolId: string, id: string) {
    return this.http.delete<void>(`${this.base}/schools/${schoolId}/teacher-assignments/${id}`);
  }

  getTimetableSettings(schoolId: string) {
    return this.http.get<any>(`${this.base}/schools/${schoolId}/timetable/settings`);
  }
  saveTimetableSettings(schoolId: string, diaryDeadline: string, weeklyPlanDeadline?: string) {
    return this.http.put<any>(`${this.base}/schools/${schoolId}/timetable/settings`, { diaryDeadline, weeklyPlanDeadline });
  }
  getPeriods(schoolId: string, academicYearId: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/timetable/periods`, { params: { academicYearId } });
  }
  savePeriod(schoolId: string, body: any) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/timetable/periods`, body);
  }
  deletePeriod(schoolId: string, academicYearId: string, id: string) {
    return this.http.delete<void>(`${this.base}/schools/${schoolId}/timetable/periods/${id}`, { params: { academicYearId } });
  }
  getTimetableGrid(schoolId: string, academicYearId: string, sectionId: string, date?: string) {
    let params = new HttpParams().set('academicYearId', academicYearId).set('sectionId', sectionId);
    if (date) params = params.set('date', date);
    return this.http.get<any>(`${this.base}/schools/${schoolId}/timetable/grid`, { params });
  }
  saveTimetableSlot(schoolId: string, body: any) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/timetable/slots`, body);
  }
  clearTimetableSlot(schoolId: string, id: string) {
    return this.http.delete<void>(`${this.base}/schools/${schoolId}/timetable/slots/${id}`);
  }
  getOpsToday(schoolId: string, academicYearId: string) {
    return this.http.get<any>(`${this.base}/schools/${schoolId}/ops-today`, { params: { academicYearId } });
  }
  getSubstitutions(schoolId: string, date: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/substitutions`, { params: { date } });
  }
  getAvailableSubstitutes(schoolId: string, academicYearId: string, date: string, periodId: string) {
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/substitutions/available`, { params: { academicYearId, date, periodId } });
  }
  assignSubstitute(schoolId: string, id: string, substituteEmployeeId: string) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/substitutions/${id}/assign`, { substituteEmployeeId });
  }
  getLessonPlans(schoolId: string, weekStart: string, sectionId?: string) {
    let params = new HttpParams().set('weekStart', weekStart);
    if (sectionId) params = params.set('sectionId', sectionId);
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/lesson-plans`, { params });
  }
  saveLessonPlan(schoolId: string, body: any) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/lesson-plans`, body);
  }
  getDiaries(schoolId: string, date: string, sectionId?: string) {
    let params = new HttpParams().set('date', date);
    if (sectionId) params = params.set('sectionId', sectionId);
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/diaries`, { params });
  }
  saveDiary(schoolId: string, body: any) {
    return this.http.post<any>(`${this.base}/schools/${schoolId}/diaries`, body);
  }
  uploadDiaryScan(
    schoolId: string, academicYearId: string, date: string, classId: string, sectionId: string,
    subjectId: string | null, file: File, employeeId?: string
  ) {
    const data = new FormData();
    data.append('academicYearId', academicYearId);
    data.append('date', date);
    data.append('classId', classId);
    data.append('sectionId', sectionId);
    if (subjectId) data.append('subjectId', subjectId);
    if (employeeId) data.append('employeeId', employeeId);
    data.append('file', file);
    return this.http.post<any>(`${this.base}/schools/${schoolId}/diaries/scan`, data);
  }
  getDiaryScan(schoolId: string, diaryId: string) {
    return this.http.get(`${this.base}/schools/${schoolId}/diaries/${diaryId}/scan`, { responseType: 'blob' });
  }
  getDiaryCompliance(schoolId: string, academicYearId: string, date?: string) {
    let params = new HttpParams().set('academicYearId', academicYearId);
    if (date) params = params.set('date', date);
    return this.http.get<any>(`${this.base}/schools/${schoolId}/diaries/compliance`, { params });
  }
  remindDiary(schoolId: string, academicYearId: string, date?: string) {
    let params = new HttpParams().set('academicYearId', academicYearId);
    if (date) params = params.set('date', date);
    return this.http.post<any>(`${this.base}/schools/${schoolId}/diaries/remind`, {}, { params });
  }
}
