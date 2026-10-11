import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => http.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('isLoggedIn returns false when no token', () => {
    expect(service.isLoggedIn).toBeFalse();
  });

  it('login stores token and sets user', () => {
    const mockResponse = {
      accessToken: 'test-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', roles: ['SchoolAdmin'] }
    };

    service.login('a@b.com', 'pass', 'tenant-id').subscribe(res => {
      expect(res.accessToken).toBe('test-token');
      expect(service.isLoggedIn).toBeTrue();
      expect(service.user()?.email).toBe('a@b.com');
    });

    const req = http.expectOne('/api/auth/login');
    expect(req.request.headers.get('X-Tenant-Id')).toBe('tenant-id');
    req.flush(mockResponse);
  });
});
