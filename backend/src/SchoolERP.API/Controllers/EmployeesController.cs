using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolERP.Application.DTOs;
using SchoolERP.Application.Interfaces;

namespace SchoolERP.API.Controllers;

[ApiController]
[Route("api/schools/{schoolId}/employees")]
[Authorize]
public class EmployeesController(IEmployeeService employeeService, IAuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid schoolId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] string? search = null, CancellationToken ct = default)
    {
        if (pageSize > 100) pageSize = 100;
        var result = await employeeService.GetEmployeesAsync(schoolId, page, pageSize, search, ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Create(Guid schoolId, [FromBody] CreateEmployeeRequest request, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
        var employee = await employeeService.CreateEmployeeAsync(request, schoolId, tenantId, actor, ct);
        await auditService.LogAsync(tenantId, actor, "EmployeeCreated", "Employee", employee.Id.ToString(),
            newValues: new { employee.EmployeeCode, employee.FirstName, employee.LastName });
        return CreatedAtAction(nameof(GetAll), new { schoolId }, employee);
    }
}
