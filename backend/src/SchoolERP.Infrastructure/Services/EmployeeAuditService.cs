using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.DTOs;
using SchoolERP.Application.Interfaces;
using SchoolERP.Domain.Entities;
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
                e.Department!.Name, e.Designation!.Name, e.Status.ToString()))
            .ToListAsync(ct);

        return new PagedResult<EmployeeListDto>(items, total, page, pageSize);
    }

    public async Task<EmployeeListDto> CreateEmployeeAsync(
        CreateEmployeeRequest request, Guid schoolId, Guid tenantId, string createdBy, CancellationToken ct = default)
    {
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
            DepartmentId = request.DepartmentId,
            DesignationId = request.DesignationId,
            JoiningDate = request.JoiningDate,
            CreatedBy = createdBy
        };

        db.Employees.Add(employee);
        await db.SaveChangesAsync(ct);

        return new EmployeeListDto(employee.Id, employee.EmployeeCode,
            employee.FirstName, employee.LastName, null, null, employee.Status.ToString());
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
