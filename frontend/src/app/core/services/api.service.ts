import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PagedResult<T> { items: T[]; totalCount: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

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

  // Audit
  getAuditLog(params: any) { return this.http.get<any>(`${this.base}/audit`, { params }); }

  // Leave
  getLeaveRequests(schoolId: string, status?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${this.base}/schools/${schoolId}/leave/requests`, { params });
  }
}
