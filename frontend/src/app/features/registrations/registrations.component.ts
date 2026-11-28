import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { AuthService } from '../../core/auth/auth.service';

type Section = 'dashboard' | 'register' | 'list' | 'documents' | 'fees' | 'confirm' | 'reports';

@Component({
  selector: 'app-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="desk">
      <header class="hero">
        <div>
          <div class="crumbs">Admissions <span>/</span> Walk-in registration</div>
          <div class="eyebrow">ADMISSIONS WORKSPACE</div>
          <h1>Walk-in registration</h1>
          <p>Register a student, verify documents, collect the saved fee, and confirm the seat. Every count is read from this school's records.</p>
        </div>
        <button type="button" class="primary" (click)="openNew()"><i class="pi pi-plus"></i> New walk-in registration</button>
      </header>

      @if (toast()) { <div class="toast" [class.bad]="toastKind()==='bad'">{{ toast() }}</div> }

      <nav class="tabs" aria-label="Admissions sections">
        @for (item of menu; track item.id) {
          <button type="button" [class.on]="section()===item.id" (click)="go(item.id)">
            <i [class]="item.icon"></i> {{ item.label }}
          </button>
        }
      </nav>

      @if (booting()) {
        <div class="metrics">
          @for (n of cards; track n) { <div class="skeleton"></div> }
        </div>
      } @else {
        <div class="metrics">
          <button type="button" class="metric" (click)="go('list')"><i class="pi pi-users"></i><span>Total registrations</span><strong>{{ summary().total }}</strong></button>
          <button type="button" class="metric" (click)="go('list')"><i class="pi pi-calendar"></i><span>New today</span><strong>{{ summary().newToday }}</strong></button>
          <button type="button" class="metric" (click)="go('documents')"><i class="pi pi-file"></i><span>Pending documents</span><strong>{{ summary().pendingDocuments }}</strong></button>
          <button type="button" class="metric" (click)="go('fees')"><i class="pi pi-wallet"></i><span>Fee pending</span><strong>{{ summary().feePending }}</strong></button>
          <button type="button" class="metric" (click)="go('confirm')"><i class="pi pi-check-circle"></i><span>Confirmed admissions</span><strong>{{ summary().confirmed }}</strong></button>
          <button type="button" class="metric" (click)="showCancelled()"><i class="pi pi-times-circle"></i><span>Cancelled registrations</span><strong>{{ summary().rejected }}</strong></button>
        </div>
      }

      <ol class="track">
        @for (step of steps; track step; let i = $index) {
          <li [class.done]="stepDone(step)" [class.now]="detail()?.stage===step"><em>{{ i + 1 }}</em>{{ step }}</li>
        }
      </ol>

      @if (section()==='dashboard') {
        <div class="panel split">
          <div>
            <h2>Today's desk</h2>
            <p class="hint">{{ summary().conversionPercent }}% of registrations are confirmed admissions.</p>
            @if (!rows().length) { <div class="empty">No registrations are stored for this school yet. Start with a walk-in.</div> }
            @else {
              @for (row of rows().slice(0, 6); track row.id) {
                <button type="button" class="lead" (click)="openProfile(row)">
                  <strong>{{ row.registrationNumber }}</strong>
                  <span>{{ row.firstName }} {{ row.lastName }} · {{ row.className || 'Class pending' }} · {{ row.feePaid ? 'Fee paid' : 'Fee pending' }}</span>
                  <em class="badge">{{ row.status }}</em>
                </button>
              }
            }
          </div>
          <div>
            <h2>Class conversion</h2>
            @if (!(summary().byClass || []).length) { <div class="empty">Conversion appears after the first registration.</div> }
            @else {
              @for (row of summary().byClass; track row.classId) {
                <div class="lead static">
                  <strong>{{ row.className }}</strong>
                  <span>{{ row.confirmed }} confirmed of {{ row.total }} · {{ row.conversionPercent }}%</span>
                </div>
              }
            }
          </div>
        </div>
      }

      @if (section()==='register') {
        <form class="panel wizard" (ngSubmit)="formStep < 5 ? nextStep() : finish()">
          <div class="stepper">
            @for (label of formSteps; track label; let i = $index) {
              <button type="button" [class.on]="formStep===i" [class.done]="formStep>i" (click)="jump(i)">{{ i + 1 }}. {{ label }}</button>
            }
          </div>
          @if (formError()) { <div class="alert">{{ formError() }}</div> }

          @if (formStep===0) {
            <div class="fields">
              <label>First name <b>*</b><input [(ngModel)]="form.firstName" name="firstName" required /></label>
              <label>Last name <b>*</b><input [(ngModel)]="form.lastName" name="lastName" required /></label>
              <label>Date of birth <b>*</b><input type="date" [(ngModel)]="form.dateOfBirth" name="dob" required /></label>
              <label>Gender
                <select [(ngModel)]="form.gender" name="gender"><option>Female</option><option>Male</option><option>Other</option></select>
              </label>
            </div>
          }
          @if (formStep===1) {
            <div class="fields">
              <label>Guardian name <b>*</b><input [(ngModel)]="form.guardianName" name="gname" required /></label>
              <label>Phone <b>*</b><input [(ngModel)]="form.guardianPhone" name="gphone" required /></label>
              <label>Email<input type="email" [(ngModel)]="form.guardianEmail" name="gemail" /></label>
              <label>Relationship
                <select [(ngModel)]="form.relationship" name="rel"><option>Parent</option><option>Mother</option><option>Father</option><option>Guardian</option></select>
              </label>
            </div>
          }
          @if (formStep===2) {
            <div class="fields">
              <label>Academic year <b>*</b>
                <select [(ngModel)]="form.academicYearId" name="year">
                  <option value="">Select</option>
                  @for (y of years(); track y.id) { <option [value]="y.id">{{ y.name }}</option> }
                </select>
              </label>
              <label>Class <b>*</b>
                <select [(ngModel)]="form.preferredClassId" name="classId" (ngModelChange)="onClass()">
                  <option value="">Select</option>
                  @for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
                </select>
              </label>
              <label>Section <b>*</b>
                <select [(ngModel)]="form.preferredSectionId" name="sectionId">
                  <option value="">Select</option>
                  @for (s of sectionChoices(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
                </select>
              </label>
            </div>
          }
          @if (formStep===3) {
            <div class="fields">
              <label>Registration fee <b>*</b><input type="number" min="1" step="0.01" [(ngModel)]="form.registrationFeeAmount" name="fee" /></label>
            </div>
            <p class="hint">This amount is saved with the registration. Collection later uses the saved fee, not a draft typed on the counter.</p>
          }
          @if (formStep===4) {
            @if (!registrationId()) {
              <div class="empty">Issue the registration number on the fee step before attaching a photograph or documents.</div>
            } @else {
              <div class="ok">{{ issued()?.registrationNumber || packet()?.registrationNumber }} is saved. Attach the photograph and documents.</div>
              <div class="fields">
                <label>Document
                  <select [(ngModel)]="docKind" name="kind"><option>Photo</option><option>Identity</option><option>TransferCertificate</option></select>
                </label>
                <label>Upload<input type="file" accept="image/png,image/jpeg,image/webp,.pdf" (change)="upload($event, registrationId())" /></label>
              </div>
              <div class="cam">
                <video #video autoplay playsinline muted></video>
                <canvas #canvas hidden></canvas>
                <div class="actions">
                  <button type="button" class="ghost" (click)="startCam()">Open camera</button>
                  <button type="button" class="ghost" (click)="snap()">Capture photograph</button>
                  <button type="button" class="ghost" (click)="stopCam()">Close camera</button>
                </div>
              </div>
              @if (uploading()) { <p class="hint">Uploading…</p> }
              <div class="checks">
                @for (item of packet()?.checklist || missingChecklist; track item.kind) {
                  <span class="badge" [class.good]="item.status==='Verified'" [class.warn]="item.status==='Pending'" [class.bad]="item.status==='Rejected'" [class.miss]="item.status==='Missing'">{{ item.kind }} · {{ item.status }}</span>
                }
              </div>
            }
          }
          @if (formStep===5) {
            <div class="grid">
              <div><span>Student</span><strong>{{ form.firstName }} {{ form.lastName }}</strong></div>
              <div><span>Date of birth</span><strong>{{ form.dateOfBirth || '—' }}</strong></div>
              <div><span>Guardian</span><strong>{{ form.guardianName }} · {{ form.guardianPhone }}</strong></div>
              <div><span>Placement</span><strong>{{ yearName(form.academicYearId) }} · {{ className(form.preferredClassId) }} · {{ sectionName(form.preferredSectionId) }}</strong></div>
              <div><span>Saved fee</span><strong>{{ form.registrationFeeAmount }}</strong></div>
              <div><span>Registration</span><strong>{{ issued()?.registrationNumber || 'Issued on save' }}</strong></div>
            </div>
            <p class="hint">A matching student, date of birth, and guardian phone in the same year is rejected as a duplicate.</p>
          }
          <div class="actions">
            @if (formStep>0) { <button type="button" class="ghost" (click)="formStep=formStep-1">Back</button> }
            @if (formStep<5) { <button type="submit" [disabled]="busy()">{{ formStep===3 ? (busy() ? 'Saving…' : 'Save and continue') : 'Continue' }}</button> }
            @else {
              <button type="submit" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save and finish' }}</button>
              @if (registrationId()) { <button type="button" class="ghost" (click)="printAck(registrationId())">Print acknowledgement</button> }
            }
          </div>
        </form>
      }

      @if (isQueue()) {
        <div class="panel">
          <div class="panel-head">
            <div>
              <h2>{{ queueTitle() }}</h2>
              <p class="hint">{{ queueHint() }}</p>
            </div>
            @if (!canDecide && (section()==='documents' || section()==='confirm')) {
              <span class="badge warn">View only. Verification and confirmation are limited to the admission officer and school admin.</span>
            }
          </div>
          <div class="filters">
            <input [(ngModel)]="filters.search" name="search" placeholder="Registration no., student name, or phone" (keyup.enter)="reload()" />
            <select [(ngModel)]="filters.academicYearId" name="fyear"><option value="">All years</option>@for (y of years(); track y.id) { <option [value]="y.id">{{ y.name }}</option> }</select>
            <select [(ngModel)]="filters.classId" name="fclass"><option value="">All classes</option>@for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }</select>
            <input type="date" [(ngModel)]="filters.from" name="from" aria-label="From date" />
            <input type="date" [(ngModel)]="filters.to" name="to" aria-label="To date" />
            <select [(ngModel)]="filters.feeStatus" name="fee"><option value="">Any fee</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select>
            <select [(ngModel)]="filters.documentStatus" name="docs"><option value="">Any documents</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select>
            <select [(ngModel)]="filters.status" name="status"><option value="">Any status</option><option>Registered</option><option>FeePaid</option><option>Confirmed</option><option>Rejected</option></select>
            <button type="button" (click)="page=1; reload()">Apply filters</button>
          </div>
          @if (!rows().length) {
            <div class="empty">No registrations match these filters.</div>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th><button type="button" class="sort" (click)="toggleSort('number')">Number {{ mark('number') }}</button></th>
                    <th><button type="button" class="sort" (click)="toggleSort('name')">Student {{ mark('name') }}</button></th>
                    <th>Guardian phone</th>
                    <th>Class</th>
                    <th><button type="button" class="sort" (click)="toggleSort('fee')">Fee {{ mark('fee') }}</button></th>
                    <th>Documents</th>
                    <th><button type="button" class="sort" (click)="toggleSort('status')">Status {{ mark('status') }}</button></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of rows(); track row.id) {
                    <tr>
                      <td>{{ row.registrationNumber }}</td>
                      <td>{{ row.firstName }} {{ row.lastName }}</td>
                      <td>{{ row.guardianPhone }}</td>
                      <td>{{ row.className }} · {{ row.sectionName }}</td>
                      <td><span class="badge" [class.good]="row.feePaid" [class.warn]="!row.feePaid">{{ row.feePaid ? 'Paid' : 'Pending' }} · {{ row.registrationFeeAmount }}</span></td>
                      <td>
                        @for (item of row.checklist || []; track item.kind) {
                          <span class="badge mini" [class.good]="item.status==='Verified'" [class.warn]="item.status==='Pending'" [class.bad]="item.status==='Rejected'" [class.miss]="item.status==='Missing'">{{ shortKind(item.kind) }} {{ item.status }}</span>
                        }
                      </td>
                      <td><span class="badge">{{ row.status }}</span></td>
                      <td class="row-actions">
                        <button type="button" class="ghost" (click)="openProfile(row)">Profile</button>
                        @if (section()==='fees' && !row.feePaid && row.status!=='Rejected') {
                          <button type="button" (click)="openProfile(row); ask('pay')">Collect {{ row.registrationFeeAmount }}</button>
                        }
                        @if (section()==='confirm' && canDecide && row.feePaid && row.status!=='Confirmed' && row.status!=='Rejected') {
                          <button type="button" (click)="openProfile(row); ask('confirm')">Confirm seat</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="pager">
              <button type="button" class="ghost" (click)="page=page-1; reload()" [disabled]="page<=1">Previous</button>
              <span>Page {{ page }} of {{ pageCount() }} · {{ total() }} records</span>
              <button type="button" class="ghost" (click)="page=page+1; reload()" [disabled]="page*20>=total()">Next</button>
            </div>
          }
        </div>
      }

      @if (section()==='reports') {
        <div class="panel">
          <div class="panel-head">
            <div>
              <h2>Admission summary</h2>
              <p class="hint">{{ summary().confirmed }} confirmed of {{ summary().total }} registrations ({{ summary().conversionPercent }}%). {{ summary().feePending }} still owe the fee. {{ summary().pendingDocuments }} need document review. {{ summary().rejected }} were cancelled.</p>
            </div>
            <button type="button" (click)="printSummary()">Print summary</button>
          </div>
          @if (!(summary().byClass || []).length) { <div class="empty">No class conversion is stored yet.</div> }
          @else {
            <table>
              <thead><tr><th>Class</th><th>Registrations</th><th>Confirmed</th><th>Fee pending</th><th>Conversion</th></tr></thead>
              <tbody>
                @for (row of summary().byClass; track row.classId) {
                  <tr>
                    <td>{{ row.className }}</td><td>{{ row.total }}</td><td>{{ row.confirmed }}</td><td>{{ row.feePending }}</td><td>{{ row.conversionPercent }}%</td>
                  </tr>
                }
              </tbody>
            </table>
          }
          <h3>Bulk student import</h3>
          <p class="hint">This import creates student records directly. It does not create walk-in registrations. Columns: firstName, lastName, dateOfBirth, className, sectionName, rollNumber, guardianName, guardianPhone.</p>
          <a [href]="templateUrl" download>Download sample template</a>
          <input type="file" accept=".csv,text/csv" (change)="onFile($event)" />
          @if (preview()) {
            <p>{{ preview().total }} rows · {{ preview().errors }} errors</p>
            <button type="button" [disabled]="preview().errors || !canDecide" (click)="commit()">Commit valid import</button>
            @if (!canDecide) { <p class="hint">Only an admission officer or school admin can commit an import.</p> }
          }
        </div>
      }

      @if (detail()) {
        <div class="drawer">
          <div class="panel profile">
            <div class="profile-head">
              <div>
                <h2>{{ detail().firstName }} {{ detail().lastName }}</h2>
                <p>{{ detail().registrationNumber }} · {{ detail().stage }}</p>
              </div>
              <button type="button" class="ghost" (click)="detail.set(null)">Close</button>
            </div>
            <div class="grid">
              <div><span>Date of birth</span><strong>{{ detail().dateOfBirth }}</strong></div>
              <div><span>Guardian</span><strong>{{ detail().guardianName }} · {{ detail().guardianPhone }}</strong></div>
              <div><span>Email</span><strong>{{ detail().guardianEmail || '—' }}</strong></div>
              <div><span>Class</span><strong>{{ detail().className }} · {{ detail().sectionName }}</strong></div>
              <div><span>Saved fee</span><strong>{{ detail().registrationFeeAmount }}</strong></div>
              <div><span>Receipt</span><strong>{{ detail().feeReceiptNumber || 'Not collected' }} {{ detail().feeMethod ? '· ' + detail().feeMethod : '' }}</strong></div>
              <div><span>Admission</span><strong>{{ detail().admissionNumber || 'Not confirmed' }}</strong></div>
              <div><span>Bonafide</span><strong>{{ detail().bonafideNumber || 'Not issued' }}</strong></div>
            </div>
            <div class="actions">
              <button type="button" class="ghost" (click)="edit(detail())" [disabled]="detail().status==='Confirmed' || detail().status==='Rejected'">Edit</button>
              <button type="button" (click)="ask('pay')" [disabled]="detail().feePaid || detail().status==='Rejected'">Collect saved fee</button>
              @if (canDecide) {
                <button type="button" (click)="ask('confirm')" [disabled]="detail().status==='Confirmed' || !detail().feePaid">Confirm admission</button>
                <button type="button" class="ghost" (click)="ask('cancel')" [disabled]="detail().status==='Confirmed' || detail().status==='Rejected'">Cancel registration</button>
                <button type="button" class="ghost" (click)="bonafide()">Issue bonafide</button>
              }
              <button type="button" class="ghost" (click)="printAck(detail().id)">Print acknowledgement</button>
              @if (detail().admissionNumber) { <button type="button" class="ghost" (click)="printForm(detail().id)">Print admission form</button> }
            </div>
            <h3>Documents</h3>
            <div class="checks">
              @for (item of detail().checklist || []; track item.kind) {
                <span class="badge" [class.good]="item.status==='Verified'" [class.warn]="item.status==='Pending'" [class.bad]="item.status==='Rejected'" [class.miss]="item.status==='Missing'">{{ item.kind }} · {{ item.status }}</span>
              }
            </div>
            <div class="cam">
              <video #profileVideo autoplay playsinline muted></video>
              <canvas #profileCanvas hidden></canvas>
              <div class="actions">
                <button type="button" class="ghost" (click)="startCam(true)">Open camera</button>
                <button type="button" class="ghost" (click)="snap(true)">Capture photograph</button>
                <button type="button" class="ghost" (click)="stopCam()">Close camera</button>
              </div>
            </div>
            <div class="fields">
              <label>Kind
                <select [(ngModel)]="docKind" name="profileKind"><option>Photo</option><option>Identity</option><option>TransferCertificate</option></select>
              </label>
              <label>Upload<input type="file" accept="image/png,image/jpeg,image/webp,.pdf" (change)="upload($event, detail().id)" /></label>
            </div>
            @for (doc of detail().documents || []; track doc.id) {
              <div class="doc">
                <button type="button" class="ghost" (click)="openDocument(doc)">{{ doc.kind }} · {{ doc.fileName }}</button>
                <span class="badge" [class.good]="doc.reviewStatus==='Verified'" [class.bad]="doc.reviewStatus==='Rejected'" [class.warn]="doc.reviewStatus==='Pending'">{{ doc.reviewStatus }}</span>
                <small>{{ doc.verifiedBy || 'Awaiting reviewer' }}{{ doc.verifiedAt ? ' · ' + doc.verifiedAt : '' }}</small>
                @if (doc.reviewNote) { <small>{{ doc.reviewNote }}</small> }
                @if (canDecide && doc.reviewStatus!=='Verified') {
                  <button type="button" (click)="verify(doc.id)">Verify</button>
                  <button type="button" class="ghost" (click)="rejectDoc(doc.id)">Reject</button>
                }
              </div>
            } @empty { <div class="empty">No documents uploaded yet.</div> }
            <h3>Fee history</h3>
            @for (pay of detail().payments || []; track pay.id) {
              <p>{{ pay.receiptNumber }} · {{ pay.amount }} · {{ pay.status }} · {{ pay.method }} · {{ pay.paidAt }}</p>
            } @empty { <p class="hint">No ledger receipt is stored yet. Collecting the fee writes the receipt. Confirming the seat posts that receipt to the student payment ledger.</p> }
            <h3>Status timeline</h3>
            <p>Created {{ detail().createdAt }} by {{ detail().createdBy || 'staff' }}</p>
            @if (detail().feeReceiptNumber) { <p>Fee collected · {{ detail().feeReceiptNumber }}</p> }
            @if (detail().confirmedAt) { <p>Confirmed {{ detail().confirmedAt }} by {{ detail().confirmedBy }}</p> }
            <h3>Audit history</h3>
            @for (event of detail().audits || []; track event.occurredAt + event.action) {
              <p>{{ event.action }} · {{ event.actor }} · {{ event.occurredAt }}</p>
            } @empty { <p class="hint">No audit events are stored for this registration yet.</p> }
          </div>
        </div>
      }

      @if (pendingAction()) {
        <div class="modal">
          <div class="panel">
            <h2>{{ pendingAction()==='pay' ? 'Collect the saved fee' : pendingAction()==='confirm' ? 'Confirm this admission' : 'Cancel this registration' }}</h2>
            <p>{{ pendingAction()==='pay' ? 'The receipt uses ' + (detail()?.registrationFeeAmount ?? '') + ', the fee stored on the registration.' : 'This action is written to the audit log.' }}</p>
            @if (pendingAction()==='pay') {
              <label class="stack">Method
                <select [(ngModel)]="payMethod" name="payMethod"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank transfer</option></select>
              </label>
            }
            <div class="actions">
              <button type="button" class="ghost" (click)="pendingAction.set(null)">Back</button>
              <button type="button" (click)="runPending()">Continue</button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .desk { display: flex; flex-direction: column; gap: 14px; }
    .hero { display: flex; justify-content: space-between; gap: 18px; align-items: flex-end; padding: 22px 24px; border-radius: 20px; border: 1px solid var(--glass-line, var(--line)); background: linear-gradient(135deg, rgba(255,255,255,.9), rgba(237,240,255,.78)); box-shadow: var(--glass-shadow, var(--shadow)); }
    h1 { margin: 4px 0; font-size: 30px; letter-spacing: -.04em; color: var(--navy); }
    h2, h3 { margin: 0 0 8px; color: var(--navy); }
    .crumbs, .hint, .empty { color: var(--muted); }
    .crumbs span { margin: 0 6px; }
    .hero p { max-width: 640px; margin: 0; }
    .primary, button { font: inherit; cursor: pointer; }
    .primary, .actions button, .panel-head > button, .filters > button, .row-actions button { background: var(--primary); color: white; border: 0; border-radius: 12px; padding: 10px 14px; font-weight: 700; }
    .primary { display: inline-flex; gap: 8px; align-items: center; }
    .ghost, .sort { background: transparent; color: var(--navy); border: 0; }
    .row-actions .ghost, .actions .ghost, .doc .ghost { background: white; border: 1px solid var(--line); }
    .tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .tabs button { display: inline-flex; gap: 8px; align-items: center; border: 1px solid var(--glass-line, var(--line)); background: rgba(255,255,255,.7); border-radius: 999px; padding: 8px 12px; color: var(--navy); }
    .tabs button.on { background: var(--navy); color: white; }
    .metrics { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; }
    .metric, .skeleton { text-align: left; border: 1px solid var(--glass-line, var(--line)); border-radius: 18px; padding: 14px; background: rgba(255,255,255,.78); box-shadow: var(--shadow-sm); }
    .metric { color: inherit; }
    .metric:hover { transform: translateY(-1px); border-color: #c9d2f5; }
    .metric i { color: var(--primary); }
    .metric span, .grid span { display: block; color: var(--muted); font-size: 12px; }
    .metric strong { display: block; font-size: 24px; color: var(--navy); }
    .skeleton { min-height: 86px; background: linear-gradient(90deg, #eef2f8, #f8fafc, #eef2f8); background-size: 200% 100%; animation: shine 1.2s infinite; }
    @keyframes shine { to { background-position: -100% 0; } }
    .track { display: flex; gap: 8px; list-style: none; padding: 0; margin: 0; flex-wrap: wrap; }
    .track li { display: flex; gap: 8px; align-items: center; padding: 7px 10px; border-radius: 999px; background: rgba(255,255,255,.72); color: var(--muted); font-size: 12px; font-weight: 700; }
    .track em { font-style: normal; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; background: #e7edf6; }
    .track li.done { background: var(--success-soft); color: var(--success); }
    .track li.now { outline: 2px solid var(--primary); color: var(--navy); }
    .panel { background: rgba(255,255,255,.86); border: 1px solid var(--glass-line, var(--line)); border-radius: 20px; padding: 16px; box-shadow: var(--shadow); }
    .split { display: grid; grid-template-columns: 1.4fr .8fr; gap: 18px; }
    .lead { display: flex; gap: 10px; align-items: center; width: 100%; text-align: left; border: 0; border-bottom: 1px solid var(--line); background: transparent; padding: 10px 0; }
    .lead strong { min-width: 120px; }
    .lead span { flex: 1; color: var(--muted); }
    .static { cursor: default; }
    .filters, .fields, .actions, .grid, .checks, .doc, .pager, .profile-head, .panel-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .panel-head, .profile-head { justify-content: space-between; margin-bottom: 10px; }
    .filters > * { min-width: 150px; }
    input, select { min-height: 38px; border: 1px solid var(--line); border-radius: 10px; padding: 0 10px; background: white; }
    .fields label, .stack { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 700; color: var(--muted); flex: 1; min-width: 180px; }
    .fields b { color: var(--danger); }
    .stepper { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .stepper button { border-radius: 999px; padding: 6px 10px; background: #f4f7fb; color: var(--muted); }
    .stepper button.on, .stepper button.done { color: var(--primary); background: var(--primary-soft); }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
    .sort { padding: 0; font-size: 11px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
    .badge { border-radius: 999px; padding: 3px 8px; background: #eef3f8; font-size: 11px; font-weight: 700; }
    .badge.mini { margin: 0 4px 4px 0; display: inline-block; }
    .badge.good { background: var(--success-soft); color: var(--success); }
    .badge.warn { background: var(--warn-soft); color: var(--warn); }
    .badge.bad { background: var(--danger-soft); color: var(--danger); }
    .badge.miss { background: #f4f6fa; color: var(--muted); }
    .grid div { flex: 1; min-width: 180px; background: #f8fafc; border-radius: 12px; padding: 10px; }
    .drawer, .modal { position: fixed; inset: 0; background: rgba(15, 35, 64, .38); display: grid; z-index: 30; overflow: auto; }
    .drawer { justify-content: end; padding: 16px; }
    .modal { place-items: center; padding: 16px; }
    .profile { width: min(760px, 100%); }
    video { width: min(100%, 420px); max-height: 180px; background: #111827; border-radius: 12px; }
    .cam { display: flex; flex-direction: column; gap: 8px; margin: 8px 0; }
    .toast { position: fixed; right: 16px; bottom: 16px; background: var(--success-soft); color: var(--success); padding: 12px 14px; border-radius: 12px; z-index: 40; }
    .toast.bad, .alert { background: var(--danger-soft); color: var(--danger); }
    .alert, .ok { padding: 8px 10px; border-radius: 10px; }
    .ok { background: var(--success-soft); color: var(--success); }
    .empty { padding: 22px; text-align: center; }
    .row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    @media (max-width: 1100px) { .metrics, .split { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 720px) { .hero, .metrics, .split { display: flex; flex-direction: column; } .drawer { justify-content: stretch; } }
  `]
})
export class RegistrationsComponent implements OnInit, OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('profileVideo') profileVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('profileCanvas') profileCanvas?: ElementRef<HTMLCanvasElement>;
  readonly menu: { id: Section; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Admissions dashboard', icon: 'pi pi-chart-bar' },
    { id: 'register', label: 'Walk-in registration', icon: 'pi pi-user-plus' },
    { id: 'list', label: 'Registration management', icon: 'pi pi-list' },
    { id: 'documents', label: 'Document verification', icon: 'pi pi-file' },
    { id: 'fees', label: 'Fee collection', icon: 'pi pi-wallet' },
    { id: 'confirm', label: 'Admission confirmation', icon: 'pi pi-check-circle' },
    { id: 'reports', label: 'Reports', icon: 'pi pi-print' }
  ];
  readonly steps = ['Registration', 'Documents', 'Fee Payment', 'Verification', 'Seat Confirmation', 'Admission'];
  readonly formSteps = ['Student details', 'Parent / guardian', 'Academic details', 'Registration fee', 'Documents and photograph', 'Review and submit'];
  readonly cards = [1, 2, 3, 4, 5, 6];
  readonly missingChecklist = [
    { kind: 'Photo', status: 'Missing' },
    { kind: 'Identity', status: 'Missing' },
    { kind: 'TransferCertificate', status: 'Missing' }
  ];
  section = signal<Section>('dashboard');
  summary = signal<any>({ total: 0, newToday: 0, pendingDocuments: 0, feePending: 0, confirmed: 0, rejected: 0, conversionPercent: 0, byClass: [] });
  rows = signal<any[]>([]);
  total = signal(0);
  detail = signal<any>(null);
  packet = signal<any>(null);
  years = signal<any[]>([]);
  classes = signal<any[]>([]);
  sectionChoices = signal<any[]>([]);
  preview = signal<any>(null);
  toast = signal<string | null>(null);
  toastKind = signal<'ok' | 'bad'>('ok');
  booting = signal(true);
  busy = signal(false);
  uploading = signal(false);
  pendingAction = signal<'pay' | 'confirm' | 'cancel' | null>(null);
  issued = signal<any>(null);
  formError = signal<string | null>(null);
  canDecide = false;
  page = 1;
  formStep = 0;
  editingId = '';
  docKind = 'Photo';
  payMethod = 'Cash';
  sortKey = 'created';
  sortDesc = true;
  private summaryLoaded = false;
  importFile: File | null = null;
  stream: MediaStream | null = null;
  filters = { search: '', academicYearId: '', classId: '', from: '', to: '', feeStatus: '', documentStatus: '', status: '' };
  form: any = this.blank();

  constructor(private api: ApiService, public ctx: SchoolContextService, auth: AuthService, private route: ActivatedRoute) {
    this.canDecide = auth.hasRole('SchoolAdmin') || auth.hasRole('PlatformSuperAdmin') || auth.hasRole('AdmissionOfficer');
  }

  get templateUrl() { return `/api/schools/${this.ctx.schoolId}/registrations/import/template`; }

  ngOnInit() {
    const requested = this.route.snapshot.queryParamMap.get('section') as Section | null;
    if (requested && this.menu.some(item => item.id === requested)) {
      this.section.set(requested);
      this.applyPreset(requested);
    }
    if (!this.ctx.schoolId) { this.booting.set(false); return; }
    this.form.academicYearId = this.ctx.academicYearId;
    this.api.getAcademicYears(this.ctx.schoolId).subscribe({ next: rows => this.years.set(rows ?? []) });
    this.api.getClasses(this.ctx.schoolId).subscribe({ next: rows => this.classes.set(rows ?? []) });
    this.reload();
  }

  ngOnDestroy() { this.stopCam(); }

  blank() {
    return { firstName: '', lastName: '', dateOfBirth: '', gender: 'Female', preferredClassId: '', preferredSectionId: '', guardianName: '', guardianPhone: '', guardianEmail: '', relationship: 'Parent', registrationFeeAmount: null, academicYearId: this.ctx?.academicYearId || '' };
  }

  registrationId() { return this.editingId || this.issued()?.id || ''; }
  isQueue() { return ['list', 'documents', 'fees', 'confirm'].includes(this.section()); }
  pageCount() { return Math.max(1, Math.ceil(this.total() / 20)); }
  queueTitle() {
    return { list: 'Registration management', documents: 'Document verification', fees: 'Fee collection', confirm: 'Admission confirmation' }[this.section() as 'list'] || 'Registrations';
  }
  queueHint() {
    if (this.section() === 'documents') return 'Missing, pending, verified, and rejected documents are shown for each registration.';
    if (this.section() === 'fees') return 'Collection uses the fee saved on the registration. A second payment is rejected.';
    if (this.section() === 'confirm') return 'A seat can be confirmed after the saved fee is collected.';
    return 'Search by registration number, student name, or guardian phone.';
  }
  mark(key: string) { return this.sortKey === key ? (this.sortDesc ? '↓' : '↑') : ''; }
  shortKind(kind: string) { return kind === 'TransferCertificate' ? 'TC' : kind; }

  go(id: Section) {
    this.section.set(id);
    this.applyPreset(id);
    this.page = 1;
    this.reload();
  }

  showCancelled() {
    this.section.set('list');
    this.filters = { ...this.filters, status: 'Rejected', feeStatus: '', documentStatus: '' };
    this.page = 1;
    this.reload();
  }

  private applyPreset(id: Section) {
    if (id === 'fees') this.filters = { ...this.filters, feeStatus: 'unpaid', documentStatus: '', status: '' };
    else if (id === 'confirm') this.filters = { ...this.filters, status: 'FeePaid', feeStatus: '', documentStatus: '' };
    else if (id === 'documents') this.filters = { ...this.filters, documentStatus: 'pending', feeStatus: '', status: '' };
    else if (id === 'dashboard') this.filters = { ...this.filters, feeStatus: '', documentStatus: '', status: '' };
  }

  openNew() {
    this.editingId = '';
    this.formStep = 0;
    this.issued.set(null);
    this.packet.set(null);
    this.formError.set(null);
    this.form = this.blank();
    this.section.set('register');
  }

  jump(step: number) {
    if (step > 3 && !this.registrationId()) return this.show('Save the registration before documents and review.', 'bad');
    this.formStep = step;
  }

  stepDone(step: string) {
    const current = this.steps.indexOf(this.detail()?.stage || '');
    return current > this.steps.indexOf(step);
  }

  reload() {
    if (!this.ctx.schoolId) return;
    this.api.getRegistrationSummary(this.ctx.schoolId).subscribe({
      next: data => { this.summaryLoaded = true; this.summary.set(data); },
      error: () => this.summarize(this.rows())
    });
    this.api.getRegistrations(this.ctx.schoolId, {
      ...this.filters, page: this.page, pageSize: 20, sort: this.sortKey, desc: this.sortDesc ? 'true' : 'false'
    }).subscribe({
      next: page => {
        const parsed = this.pageOf(page);
        this.rows.set(parsed.items);
        this.total.set(parsed.total);
        this.booting.set(false);
        if (!this.summaryLoaded && parsed.items.length) this.summarize(parsed.items);
      },
      error: () => { this.booting.set(false); this.show('Could not load registrations.', 'bad'); }
    });
  }

  private pageOf(page: any) {
    if (Array.isArray(page)) return { items: page, total: page.length };
    return { items: page?.items ?? [], total: page?.total ?? (page?.items?.length ?? 0) };
  }

  private summarize(items: any[]) {
    if (this.summaryLoaded) return;
    const today = new Date().toISOString().slice(0, 10);
    const active = items.filter(row => row.status !== 'Rejected' && row.status !== 'Confirmed');
    const confirmed = items.filter(row => row.status === 'Confirmed').length;
    this.summary.set({
      total: items.length,
      newToday: items.filter(row => String(row.createdAt || '').startsWith(today)).length,
      pendingDocuments: items.filter(row => (row.checklist || []).some((item: any) => item.status === 'Missing' || item.status === 'Pending' || item.status === 'Rejected')).length,
      feePending: active.filter(row => !row.feePaid).length,
      confirmed,
      rejected: items.filter(row => row.status === 'Rejected').length,
      conversionPercent: items.length ? Math.round(confirmed * 1000 / items.length) / 10 : 0,
      byClass: []
    });
  }

  toggleSort(key: string) {
    if (this.sortKey === key) this.sortDesc = !this.sortDesc;
    else { this.sortKey = key; this.sortDesc = false; }
    this.page = 1;
    this.reload();
  }

  onClass() {
    const cls = this.classes().find(c => c.id === this.form.preferredClassId);
    this.sectionChoices.set(cls?.sections || []);
    this.form.preferredSectionId = '';
  }

  yearName(id: string) { return this.years().find(y => y.id === id)?.name || '—'; }
  className(id: string) { return this.classes().find(c => c.id === id)?.name || '—'; }
  sectionName(id: string) { return this.sectionChoices().find(s => s.id === id)?.name || '—'; }

  nextStep() {
    this.formError.set(null);
    if (this.formStep === 0 && (!this.form.firstName?.trim() || !this.form.lastName?.trim() || !this.form.dateOfBirth)) return this.fail('Student name and date of birth are required.');
    if (this.formStep === 1 && (!this.form.guardianName?.trim() || (this.form.guardianPhone || '').replace(/\D/g, '').length < 8)) return this.fail('Guardian name and a phone of at least 8 digits are required.');
    if (this.formStep === 2 && (!this.form.preferredClassId || !this.form.preferredSectionId || !this.form.academicYearId)) return this.fail('Choose the academic year, class, and section.');
    if (this.formStep === 3) return this.persist(() => this.formStep = 4);
    this.formStep += 1;
  }

  finish() {
    this.persist(() => {
      if (this.registrationId()) this.printAck(this.registrationId());
      this.show('Registration saved. The acknowledgement is ready to print.');
    });
  }

  private persist(done: () => void) {
    if (Number(this.form.registrationFeeAmount) <= 0) return this.fail('Registration fee must be greater than zero.');
    this.busy.set(true);
    const body = { ...this.form, registrationFeeAmount: Number(this.form.registrationFeeAmount) };
    const id = this.registrationId();
    const call = id ? this.api.updateRegistration(this.ctx.schoolId, id, body) : this.api.createRegistration(this.ctx.schoolId, body);
    call.subscribe({
      next: saved => {
        this.busy.set(false);
        this.editingId = saved.id;
        this.issued.set({ ...(this.issued() || {}), ...saved });
        this.api.getRegistration(this.ctx.schoolId, saved.id).subscribe({ next: data => this.packet.set(data) });
        this.reload();
        done();
      },
      error: (e) => { this.busy.set(false); this.fail(e?.error?.error || 'Could not save the registration.'); }
    });
  }

  openProfile(row: any) {
    this.detail.set(row);
    this.api.getRegistration(this.ctx.schoolId, row.id).subscribe({
      next: data => this.detail.set(data),
      error: () => this.show('Could not open this registration.', 'bad')
    });
  }

  edit(row: any) {
    this.editingId = row.id;
    this.formStep = 0;
    this.issued.set(row);
    this.packet.set(row);
    this.form = { ...row, dateOfBirth: String(row.dateOfBirth).slice(0, 10), academicYearId: row.academicYearId, registrationFeeAmount: row.registrationFeeAmount };
    this.onClass();
    this.form.preferredSectionId = row.preferredSectionId;
    this.detail.set(null);
    this.section.set('register');
  }

  ask(action: 'pay' | 'confirm' | 'cancel') { this.pendingAction.set(action); }

  runPending() {
    const row = this.detail();
    const action = this.pendingAction();
    this.pendingAction.set(null);
    if (!row || !action) return;
    if (action === 'pay') {
      const amount = Number(row.registrationFeeAmount);
      if (amount <= 0) return this.show('The saved fee must be greater than zero.', 'bad');
      this.api.payRegistrationFee(this.ctx.schoolId, row.id, amount, this.payMethod).subscribe({
        next: saved => { this.show(`Receipt ${saved.feeReceiptNumber} collected for the saved fee.`); this.openProfile(row); this.reload(); },
        error: (e) => this.show(e?.error?.error || 'Could not collect the fee.', 'bad')
      });
    }
    if (action === 'confirm') {
      this.api.confirmRegistration(this.ctx.schoolId, row.id).subscribe({
        next: saved => { this.show(`Admission ${saved.admissionNumber} confirmed.`); this.openProfile(row); this.reload(); },
        error: (e) => this.show(e?.error?.error || 'Confirmation failed.', 'bad')
      });
    }
    if (action === 'cancel') {
      this.api.cancelRegistration(this.ctx.schoolId, row.id).subscribe({
        next: () => { this.show('Registration cancelled.'); this.detail.set(null); this.reload(); },
        error: (e) => this.show(e?.error?.error || 'Could not cancel.', 'bad')
      });
    }
  }

  bonafide() {
    const row = this.detail();
    if (!row) return;
    this.api.issueBonafide(this.ctx.schoolId, row.id).subscribe({
      next: saved => { this.show(`Bonafide ${saved.bonafideNumber}`); this.openProfile(row); },
      error: (e) => this.show(e?.error?.error || 'Verify an identity or transfer certificate first.', 'bad')
    });
  }

  printAck(id: string) { this.printHtml(this.api.registrationAcknowledgement(this.ctx.schoolId, id)); }
  printForm(id: string) { this.printHtml(this.api.getAdmissionForm(this.ctx.schoolId, id)); }
  private printHtml(call: any) {
    call.subscribe({
      next: (html: string) => { const w = window.open('', '_blank', 'noopener'); if (!w) return this.show('Allow pop-ups to print.', 'bad'); w.document.write(html); w.document.close(); },
      error: () => this.show('Could not open the printable document.', 'bad')
    });
  }

  printSummary() {
    const s = this.summary();
    const classes = (s.byClass || []).map((row: any) => `<tr><td>${row.className}</td><td>${row.total}</td><td>${row.confirmed}</td><td>${row.conversionPercent}%</td></tr>`).join('');
    const w = window.open('', '_blank', 'noopener');
    if (!w) return this.show('Allow pop-ups to print.', 'bad');
    w.document.write(`<h1>Admission summary</h1><p>Total ${s.total}. New today ${s.newToday}. Pending documents ${s.pendingDocuments}. Fee pending ${s.feePending}. Confirmed ${s.confirmed}. Cancelled ${s.rejected}. Conversion ${s.conversionPercent}%.</p><table border="1" cellpadding="6"><tr><th>Class</th><th>Registrations</th><th>Confirmed</th><th>Conversion</th></tr>${classes}</table>`);
    w.document.close();
  }

  upload(ev: Event, id: string) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (file) this.sendFile(file, this.docKind, id);
  }

  sendFile(file: File, kind: string, id: string) {
    this.uploading.set(true);
    this.api.uploadRegistrationDocument(this.ctx.schoolId, id, file, kind).subscribe({
      next: () => {
        this.uploading.set(false);
        this.show('Document uploaded.');
        this.api.getRegistration(this.ctx.schoolId, id).subscribe({ next: data => { this.packet.set(data); if (this.detail()?.id === id) this.detail.set(data); } });
        this.reload();
      },
      error: (e) => { this.uploading.set(false); this.show(e?.error?.error || 'Upload failed.', 'bad'); }
    });
  }

  verify(id: string) {
    this.api.verifyRegistrationDocument(this.ctx.schoolId, id).subscribe({
      next: () => { this.show('Document verified.'); if (this.detail()) this.openProfile(this.detail()); this.reload(); },
      error: (e) => this.show(e?.error?.error || 'Could not verify the document.', 'bad')
    });
  }

  rejectDoc(id: string) {
    const reason = window.prompt('Why is this document rejected?');
    if (!reason || reason.trim().length < 5) return this.show('Enter a rejection reason of at least 5 characters.', 'bad');
    this.api.rejectRegistrationDocument(this.ctx.schoolId, id, reason.trim()).subscribe({
      next: () => { this.show('Document rejected.'); if (this.detail()) this.openProfile(this.detail()); this.reload(); },
      error: (e) => this.show(e?.error?.error || 'Could not reject the document.', 'bad')
    });
  }

  openDocument(doc: { id: string }) {
    this.api.registrationDocumentFile(this.ctx.schoolId, doc.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => this.show('Could not open the document.', 'bad')
    });
  }

  async startCam(profile = false) {
    this.stopCam();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const video = profile ? this.profileVideo : this.video;
      if (video) video.nativeElement.srcObject = this.stream;
    } catch { this.show('Camera is not available. Upload a photograph instead.', 'bad'); }
  }
  stopCam() { this.stream?.getTracks().forEach(track => track.stop()); this.stream = null; }
  snap(profile = false) {
    const video = (profile ? this.profileVideo : this.video)?.nativeElement;
    const canvas = (profile ? this.profileCanvas : this.canvas)?.nativeElement;
    const id = profile ? this.detail()?.id : this.registrationId();
    if (!video || !canvas || !id) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      this.sendFile(new File([blob], 'live-photo.jpg', { type: 'image/jpeg' }), 'Photo', id);
      this.stopCam();
    }, 'image/jpeg', 0.9);
  }

  onFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file || !this.ctx.academicYearId) return;
    this.importFile = file;
    this.api.previewStudentImport(this.ctx.schoolId, this.ctx.academicYearId, file).subscribe({
      next: data => this.preview.set(data),
      error: () => this.show('Could not preview the import.', 'bad')
    });
  }

  commit() {
    if (!this.importFile || !this.canDecide) return;
    this.api.commitStudentImport(this.ctx.schoolId, this.ctx.academicYearId, this.importFile).subscribe({
      next: saved => { this.show(`Imported ${saved.imported} students.`); this.preview.set(null); },
      error: (e) => this.show(e?.error?.error || 'Import failed.', 'bad')
    });
  }

  private fail(message: string) { this.formError.set(message); this.show(message, 'bad'); }
  private show(message: string, kind: 'ok' | 'bad' = 'ok') {
    this.toastKind.set(kind);
    this.toast.set(message);
    setTimeout(() => { if (this.toast() === message) this.toast.set(null); }, 4000);
  }
}
