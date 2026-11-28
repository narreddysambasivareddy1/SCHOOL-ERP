using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.DTOs;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.Infrastructure.Services;

public class EmployeeService(AppDbContext db) : IEmployeeService
{
    public async Task<PagedResult<EmployeeListDto>> GetEmployeesAsync(
        Guid schoolId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        var query = db.Employees
            .Where(e => e.SchoolId == schoolId)
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(e =>
                e.FirstName.ToLower().Contains(s) ||
                e.LastName.ToLower().Contains(s) ||
                e.EmployeeCode.ToLower().Contains(s));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(e => e.FirstName)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(e => new EmployeeListDto(
                e.Id, e.EmployeeCode, e.FirstName, e.LastName,
                e.Department != null ? e.Department.Name : null,
                e.Designation != null ? e.Designation.Name : null,
                e.Status.ToString(), e.Email, e.Phone, e.JoiningDate, e.PhotoUrl, e.BasicSalary, e.DepartmentId, e.DesignationId))
            .ToListAsync(ct);

        return new PagedResult<EmployeeListDto>(items, total, page, pageSize);
    }

    public async Task<EmployeeListDto?> GetEmployeeAsync(Guid id, Guid schoolId, CancellationToken ct = default)
    {
        return await db.Employees
            .Where(e => e.Id == id && e.SchoolId == schoolId)
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Select(e => new EmployeeListDto(
                e.Id, e.EmployeeCode, e.FirstName, e.LastName,
                e.Department != null ? e.Department.Name : null,
                e.Designation != null ? e.Designation.Name : null,
                e.Status.ToString(), e.Email, e.Phone, e.JoiningDate, e.PhotoUrl, e.BasicSalary, e.DepartmentId, e.DesignationId))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<EmployeeListDto> CreateEmployeeAsync(
        CreateEmployeeRequest request, Guid schoolId, Guid tenantId, string createdBy, CancellationToken ct = default)
    {
        if (request.BasicSalary <= 0)
            throw new InvalidOperationException("Basic salary must be greater than zero.");

        var count = await db.Employees.CountAsync(e => e.SchoolId == schoolId, ct);
        var code = $"EMP-{count + 1:D4}";

        var employee = new Employee
        {
            TenantId = tenantId,
            SchoolId = schoolId,
            EmployeeCode = code,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            PhotoUrl = CleanPhoto(request.PhotoUrl),
            DepartmentId = request.DepartmentId,
            DesignationId = request.DesignationId,
            JoiningDate = request.JoiningDate,
            BasicSalary = request.BasicSalary,
            CreatedBy = createdBy
        };

        db.Employees.Add(employee);
        await db.SaveChangesAsync(ct);

        return new EmployeeListDto(employee.Id, employee.EmployeeCode,
            employee.FirstName, employee.LastName, null, null, employee.Status.ToString(),
            employee.Email, employee.Phone, employee.JoiningDate, employee.PhotoUrl, employee.BasicSalary, employee.DepartmentId, employee.DesignationId);
    }

    public async Task<EmployeeListDto> UpdateEmployeeAsync(
        Guid id, Guid schoolId, Guid tenantId, UpdateEmployeeRequest request, string updatedBy, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw new InvalidOperationException("First and last name are required.");
        if (request.BasicSalary <= 0)
            throw new InvalidOperationException("Basic salary must be greater than zero.");
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == id && e.SchoolId == schoolId && e.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("Employee not found.");
        if (request.DepartmentId is Guid departmentId && !await db.Departments.AnyAsync(d => d.Id == departmentId && d.SchoolId == schoolId && d.TenantId == tenantId, ct))
            throw new InvalidOperationException("Department does not belong to this school.");
        if (request.DesignationId is Guid designationId && !await db.Designations.AnyAsync(d => d.Id == designationId && d.SchoolId == schoolId && d.TenantId == tenantId, ct))
            throw new InvalidOperationException("Designation does not belong to this school.");
        employee.FirstName = request.FirstName;
        employee.LastName = request.LastName;
        employee.Email = request.Email;
        employee.Phone = request.Phone;
        employee.DepartmentId = request.DepartmentId;
        employee.DesignationId = request.DesignationId;
        employee.JoiningDate = request.JoiningDate;
        employee.BasicSalary = request.BasicSalary;
        employee.UpdatedBy = updatedBy;
        await db.SaveChangesAsync(ct);
        return (await GetEmployeeAsync(id, schoolId, ct))!;
    }

    public async Task SetStatusAsync(Guid id, Guid schoolId, string status, CancellationToken ct = default)
    {
        if (!Enum.TryParse<EmployeeStatus>(status, true, out var next))
            throw new InvalidOperationException("Invalid employee status.");
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == id && e.SchoolId == schoolId, ct)
            ?? throw new InvalidOperationException("Employee not found.");
        employee.Status = next;
        await db.SaveChangesAsync(ct);
    }

    public async Task SetPhotoAsync(Guid id, Guid schoolId, string photoUrl, CancellationToken ct = default)
    {
        var photo = CleanPhoto(photoUrl) ?? throw new InvalidOperationException("Choose a photo.");
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == id && e.SchoolId == schoolId, ct)
            ?? throw new InvalidOperationException("Employee not found.");
        employee.PhotoUrl = photo;
        await db.SaveChangesAsync(ct);
    }

    private static string? CleanPhoto(string? photo)
    {
        if (string.IsNullOrWhiteSpace(photo)) return null;
        if (!photo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) || photo.Length > 400_000)
            throw new InvalidOperationException("Use a small photo, under about 300 KB.");
        return photo;
    }
}

public class AuditService(AppDbContext db) : IAuditService
{
    public async Task LogAsync(Guid tenantId, string actor, string action, string entityType,
        string? entityId, object? oldValues = null, object? newValues = null, string? ipAddress = null)
    {
        db.AuditEvents.Add(new AuditEvent
        {
            TenantId = tenantId,
            Actor = actor,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues is null ? null : JsonSerializer.Serialize(oldValues),
            NewValues = newValues is null ? null : JsonSerializer.Serialize(newValues),
            IpAddress = ipAddress,
            OccurredAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
