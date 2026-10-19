import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicEnquiryComponent } from '../enquiries/public-enquiry.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, PublicEnquiryComponent],
  template: `
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <div class="nav-logo">✦</div>
          <span>EduCampus</span>
        </div>
        <div class="nav-links">
          <a href="#features">Features</a>
          <a href="#portals">Portals</a>
          <a href="#contact">Contact</a>
        </div>
        <a routerLink="/login" class="nav-cta">Sign in</a>
      </div>
    </nav>

    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content">
          <div class="hero-badge">Multi-tenant school operations platform</div>
          <h1>The quieter way to<br><span class="hero-accent">run a campus</span></h1>
          <p class="hero-sub">One workspace for admissions, attendance, fees, parents and analytics — with school-code login, locale-aware money and role-specific portals.</p>
          <div class="hero-actions">
            <a routerLink="/login" class="btn-primary-lg">Sign in with school code</a>
            <a routerLink="/parent/login" class="btn-ghost-lg">Parent portal</a>
          </div>
          <div class="hero-stats">
            <div class="hstat"><strong>4</strong><span>Role workspaces</span></div>
            <div class="hstat-div"></div>
            <div class="hstat"><strong>School code</strong><span>No tenant IDs</span></div>
            <div class="hstat-div"></div>
            <div class="hstat"><strong>Locale</strong><span>Currency &amp; dates</span></div>
            <div class="hstat-div"></div>
            <div class="hstat"><strong>RBAC</strong><span>Least privilege</span></div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="dashboard-preview">
            <div class="preview-topbar">
              <div class="preview-dot red"></div>
              <div class="preview-dot yellow"></div>
              <div class="preview-dot green"></div>
              <span class="preview-url">app.educampus.com</span>
            </div>
            <div class="preview-body">
              <div class="preview-sidebar">
                <div class="preview-nav active">Dashboard</div>
                <div class="preview-nav">Students</div>
                <div class="preview-nav">Attendance</div>
                <div class="preview-nav">Fees</div>
                <div class="preview-nav">Transport</div>
                <div class="preview-nav">Analytics</div>
              </div>
              <div class="preview-main">
                <div class="preview-stats">
                  <div class="ps blue"><div class="ps-val">1,248</div><div class="ps-lbl">Students</div></div>
                  <div class="ps green"><div class="ps-val">86</div><div class="ps-lbl">Staff</div></div>
                  <div class="ps amber"><div class="ps-val">94.2%</div><div class="ps-lbl">Attendance</div></div>
                  <div class="ps purple"><div class="ps-val">84k</div><div class="ps-lbl">Fees</div></div>
                </div>
                <div class="preview-th"><span>Student</span><span>Class</span><span>Status</span></div>
                <div class="preview-row"><span class="av">AK</span><span>Arjun Kumar</span><span>Grade 9A</span><span class="tg">Active</span></div>
                <div class="preview-row"><span class="av teal">PS</span><span>Priya Sharma</span><span>Grade 8B</span><span class="tg">Active</span></div>
                <div class="preview-row"><span class="av purple">RV</span><span>Rahul Verma</span><span>Grade 10A</span><span class="tg amber">On Leave</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features" id="features">
      <div class="section-inner">
        <div class="eyebrow-tag">PLATFORM CAPABILITIES</div>
        <h2>Everything your school needs,<br>in one platform</h2>
        <div class="features-grid">
          @for (f of features; track f.title) {
            <div class="feature-card">
              <div class="feature-icon" [style.background]="f.bg">{{ f.icon }}</div>
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="portals" id="portals">
      <div class="section-inner">
        <div class="eyebrow-tag">ACCESS PORTALS</div>
        <h2>One platform, four workspaces</h2>
        <p class="section-sub">Sign in with your school code. Each role sees only what they need.</p>
        <div class="portals-grid">
          <div class="portal-card admin-card">
            <div class="portal-icon">🏛</div>
            <h3>Admin Portal</h3>
            <p>Full school management — students, staff, fees, payroll, analytics and audit logs.</p>
            <ul>
              <li>✓ Student &amp; staff management</li>
              <li>✓ Fee collection &amp; reports</li>
              <li>✓ Payroll &amp; HRMS</li>
              <li>✓ Analytics &amp; audit trail</li>
            </ul>
            <a routerLink="/admin/login" class="portal-btn admin-btn">Sign in as Admin →</a>
          </div>
          <div class="portal-card teacher-card">
            <div class="portal-icon">👩🏫</div>
            <h3>Teacher Portal</h3>
            <p>Class-level tools — mark attendance, assign homework and enter marks for your sections.</p>
            <ul>
              <li>✓ Mark &amp; view attendance</li>
              <li>✓ Assign homework</li>
              <li>✓ Enter examination marks</li>
              <li>✓ View class timetable</li>
            </ul>
            <a routerLink="/teacher/login" class="portal-btn teacher-btn">Sign in as Teacher →</a>
          </div>
          <div class="portal-card student-card">
            <div class="portal-icon">🎓</div>
            <h3>Student Portal</h3>
            <p>Personal dashboard — attendance record, homework, fee status and exam results.</p>
            <ul>
              <li>✓ Attendance history</li>
              <li>✓ Homework &amp; submissions</li>
              <li>✓ Fee payment status</li>
              <li>✓ Exam results</li>
            </ul>
            <a routerLink="/student/login" class="portal-btn student-btn">Sign in as Student →</a>
          </div>
          <div class="portal-card parent-card">
            <div class="portal-icon">⌂</div>
            <h3>Parent Portal</h3>
            <p>Family workspace — switch children, follow attendance, homework and fee status.</p>
            <ul>
              <li>✓ Child switcher</li>
              <li>✓ Attendance summary</li>
              <li>✓ Fee history</li>
              <li>✓ Homework overview</li>
            </ul>
            <a routerLink="/parent/login" class="portal-btn parent-btn">Sign in as Parent →</a>
          </div>
          <div class="portal-card teacher-card">
            <div class="portal-icon">☎</div>
            <h3>Front Office</h3>
            <p>OTP-verified website enquiries, call notes and conversion pipeline.</p>
            <ul>
              <li>✓ Lead desk</li>
              <li>✓ Follow-up dates</li>
              <li>✓ Assignment</li>
              <li>✓ Live alerts</li>
            </ul>
            <a routerLink="/front-office/login" class="portal-btn teacher-btn">Sign in as Front Office →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="contact" id="contact">
      <div class="section-inner contact-grid">
        <div>
          <div class="eyebrow-tag light">GET IN TOUCH</div>
          <h2 class="light">Ready to transform your school?</h2>
          <p class="section-sub light">Contact our team to schedule a live demo and discuss your school's requirements.</p>
          <div class="contact-list">
            <div>✉ &nbsp;info&#64;educampus.school</div>
            <div>📞 &nbsp;+91 98765 43210</div>
            <div>📍 &nbsp;Available worldwide · Cloud hosted</div>
          </div>
        </div>
        <div class="cta-box">
          <app-public-enquiry schoolCode="bright-future" title="Admission, fees or general enquiry" />
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="nav-logo small">✦</div>
          <span>EduCampus · International School ERP</span>
        </div>
        <div class="footer-links">
          <a routerLink="/admin/login">Admin</a>
          <a routerLink="/teacher/login">Teacher</a>
          <a routerLink="/student/login">Student</a>
          <a routerLink="/parent/login">Parent</a>
        </div>
        <div class="footer-copy">© {{ year }} EduCampus. All rights reserved.</div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #18283e; }
    .nav { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.96); backdrop-filter: blur(12px); border-bottom: 1px solid #e4eaf2; }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; gap: 32px; }
    .nav-brand { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 800; color: #17365D; text-decoration: none; }
    .nav-logo { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(145deg,#1c5cb7,#0b9c9a); display: grid; place-items: center; color: white; font-size: 16px; flex-shrink: 0; }
    .nav-logo.small { width: 26px; height: 26px; font-size: 12px; border-radius: 7px; }
    .nav-links { display: flex; gap: 28px; margin-left: auto; }
    .nav-links a { text-decoration: none; color: #506078; font-size: 13px; font-weight: 500; transition: color 0.15s; }
    .nav-links a:hover { color: #17365D; }
    .nav-cta { background: #17365D; color: white; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; }
    .nav-cta:hover { background: #1c5cb7; }

    .hero { background: linear-gradient(135deg, #0b2442 0%, #17365D 55%, #0e4a6e 100%); padding: 80px 24px; min-height: 88vh; display: flex; align-items: center; }
    .hero-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; width: 100%; }
    .hero-badge { display: inline-block; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #93c5fd; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
    .hero h1 { font-size: 50px; font-weight: 900; color: white; line-height: 1.1; margin: 0 0 20px; letter-spacing: -1px; }
    .hero-accent { background: linear-gradient(90deg,#38bdf8,#0b9c9a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-sub { color: #93b4d4; font-size: 16px; line-height: 1.7; margin: 0 0 32px; }
    .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }
    .btn-primary-lg { background: #2463eb; color: white; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; display: inline-block; transition: background 0.15s; }
    .btn-primary-lg:hover { background: #1d4ed8; }
    .btn-primary-lg.dark { background: #17365D; }
    .btn-primary-lg.dark:hover { background: #1c5cb7; }
    .btn-ghost-lg { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-block; transition: background 0.15s; }
    .btn-ghost-lg:hover { background: rgba(255,255,255,0.14); }
    .hero-stats { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .hstat { display: flex; flex-direction: column; }
    .hstat strong { color: white; font-size: 18px; font-weight: 800; }
    .hstat span { color: #93b4d4; font-size: 11px; }
    .hstat-div { width: 1px; height: 32px; background: rgba(255,255,255,0.15); }

    .dashboard-preview { background: white; border-radius: 16px; box-shadow: 0 40px 80px rgba(0,0,0,0.4); overflow: hidden; width: 100%; }
    .preview-topbar { background: #f4f7fb; padding: 10px 14px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #e4eaf2; }
    .preview-dot { width: 10px; height: 10px; border-radius: 50%; }
    .preview-dot.red { background: #ff5f57; } .preview-dot.yellow { background: #febc2e; } .preview-dot.green { background: #28c840; }
    .preview-url { margin-left: 8px; font-size: 10px; color: #8290a4; background: white; border: 1px solid #e4eaf2; border-radius: 5px; padding: 2px 8px; }
    .preview-body { display: flex; }
    .preview-sidebar { width: 120px; background: #17365D; padding: 10px 8px; flex-shrink: 0; }
    .preview-nav { color: #93b4d4; font-size: 9px; padding: 6px 8px; border-radius: 5px; margin-bottom: 2px; }
    .preview-nav.active { background: #2463eb; color: white; }
    .preview-main { flex: 1; padding: 10px; min-width: 0; }
    .preview-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; margin-bottom: 10px; }
    .ps { border-radius: 7px; padding: 7px 5px; text-align: center; }
    .ps.blue { background: #eaf3ff; } .ps.green { background: #e3f8f3; } .ps.amber { background: #fff4db; } .ps.purple { background: #f0ebff; }
    .ps-val { font-size: 11px; font-weight: 800; color: #17365D; }
    .ps-lbl { font-size: 8px; color: #8290a4; }
    .preview-th { display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 8px; color: #8290a4; text-transform: uppercase; padding: 3px 4px; border-bottom: 1px solid #e4eaf2; margin-bottom: 3px; }
    .preview-row { display: grid; grid-template-columns: 20px 1fr 1fr 1fr; align-items: center; gap: 5px; padding: 4px; font-size: 9px; border-bottom: 1px solid #f4f7fb; }
    .av { width: 20px; height: 20px; border-radius: 5px; background: #eaf3ff; color: #1c5cb7; display: grid; place-items: center; font-size: 7px; font-weight: 800; }
    .av.teal { background: #e3f8f3; color: #087d68; } .av.purple { background: #f0ebff; color: #6b3fa0; }
    .tg { background: #e5f8f1; color: #087d68; font-size: 8px; font-weight: 700; padding: 2px 5px; border-radius: 8px; }
    .tg.amber { background: #fff4db; color: #9a6900; }

    .features { background: #f4f7fb; padding: 96px 24px; }
    .section-inner { max-width: 1200px; margin: 0 auto; }
    .eyebrow-tag { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0F8B8D; margin-bottom: 12px; }
    .eyebrow-tag.light { color: #93c5fd; }
    .features h2, .portals h2 { font-size: 36px; font-weight: 900; color: #17365D; margin: 0 0 48px; line-height: 1.2; letter-spacing: -0.5px; }
    .section-sub { color: #718096; font-size: 15px; margin: -32px 0 48px; line-height: 1.6; }
    .section-sub.light { color: #93b4d4; }
    .features-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; }
    .feature-card { background: white; border: 1px solid #e4eaf2; border-radius: 14px; padding: 24px; box-shadow: 0 4px 16px rgba(21,56,92,0.05); }
    .feature-icon { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; font-size: 22px; margin-bottom: 14px; }
    .feature-card h3 { font-size: 14px; font-weight: 700; color: #17365D; margin: 0 0 8px; }
    .feature-card p { font-size: 12px; color: #718096; margin: 0; line-height: 1.6; }

    .portals { background: white; padding: 96px 24px; }
    .portals-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 18px; }
    .portal-card { border: 1px solid #e4eaf2; border-radius: 16px; padding: 32px; display: flex; flex-direction: column; gap: 14px; }
    .admin-card { border-top: 4px solid #2463eb; }
    .teacher-card { border-top: 4px solid #0F8B8D; }
    .student-card { border-top: 4px solid #4338ca; }
    .parent-card { border-top: 4px solid #F2B544; }
    .portal-icon { font-size: 36px; }
    .portal-card h3 { font-size: 18px; font-weight: 800; color: #17365D; margin: 0; }
    .portal-card p { font-size: 13px; color: #718096; margin: 0; line-height: 1.6; }
    .portal-card ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 7px; }
    .portal-card li { font-size: 12px; color: #506078; }
    .portal-btn { display: block; text-align: center; padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none; margin-top: auto; transition: opacity 0.15s; }
    .portal-btn:hover { opacity: 0.88; }
    .admin-btn { background: #2463eb; color: white; }
    .teacher-btn { background: #0F8B8D; color: white; }
    .student-btn { background: #4338ca; color: white; }
    .parent-btn { background: #F2B544; color: #17365D; }

    .contact { background: linear-gradient(135deg,#0b2442,#17365D); padding: 96px 24px; }
    .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
    .contact h2 { font-size: 36px; font-weight: 900; color: white; margin: 0 0 16px; letter-spacing: -0.5px; }
    .contact-list { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; color: #93b4d4; font-size: 14px; }
    .cta-box { background: white; border-radius: 16px; padding: 36px; }
    .cta-box h3 { font-size: 20px; font-weight: 800; color: #17365D; margin: 0 0 10px; }
    .cta-box p { font-size: 13px; color: #718096; margin: 0 0 24px; line-height: 1.6; }

    .footer { background: #0b2442; padding: 24px; }
    .footer-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .footer-brand { display: flex; align-items: center; gap: 8px; color: #93b4d4; font-size: 12px; }
    .footer-links { display: flex; gap: 20px; margin-left: auto; }
    .footer-links a { color: #93b4d4; font-size: 12px; text-decoration: none; }
    .footer-links a:hover { color: white; }
    .footer-copy { color: #506078; font-size: 11px; }

    @media (max-width: 1024px) { .features-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 900px) {
      .hero-inner { grid-template-columns: 1fr; }
      .hero-visual { display: none; }
      .hero h1 { font-size: 34px; }
      .portals-grid { grid-template-columns: 1fr 1fr; }
      .contact-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .features-grid { grid-template-columns: 1fr; }
      .nav-links { display: none; }
      .portals-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent {
  year = new Date().getFullYear();
  features = [
    { icon: '🎓', title: 'Student Management', desc: 'Admissions, enrolments, guardian records and complete student lifecycle management.', bg: '#eaf3ff' },
    { icon: '◷', title: 'Attendance', desc: 'Class-level attendance with Present, Absent, Late and Excused codes. Biometric-ready.', bg: '#fff4db' },
    { icon: '◎', title: 'Fees & Payments', desc: 'Fee structures, instalment plans, online payments, receipts and reconciliation in the school currency.', bg: '#f0ebff' },
    { icon: '🚌', title: 'Transport & GPS', desc: 'Route management, vehicle tracking, trip logs and student transport assignments.', bg: '#e3f8f3' },
    { icon: '👩🏫', title: 'Staff & HRMS', desc: 'Employee records, departments, designations, leave management and payroll runs.', bg: '#fff0f0' },
    { icon: '📚', title: 'Academics', desc: 'Teacher-subject-section assignments, homework, examinations and mark entry.', bg: '#f0fff4' },
    { icon: '📊', title: 'Analytics', desc: 'Live dashboards for student strength, attendance trends, fee collection and staff reports.', bg: '#fffbeb' },
    { icon: '🔒', title: 'Security & Audit', desc: 'JWT auth, role-based access control, full audit trail and multi-tenant isolation.', bg: '#f8f4ff' },
  ];
}
