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
        EmployeeListDto employee;
        try
        {
            employee = await employeeService.CreateEmployeeAsync(request, schoolId, tenantId, actor, ct);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        await auditService.LogAsync(tenantId, actor, "EmployeeCreated", "Employee", employee.Id.ToString(),
            newValues: new { employee.EmployeeCode, employee.FirstName, employee.LastName });
        return CreatedAtAction(nameof(GetAll), new { schoolId }, employee);
    }

    [HttpPost("{id:guid}/status")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Status(Guid schoolId, Guid id, [FromBody] StatusToggleRequest body, CancellationToken ct)
    {
        try
        {
            await employeeService.SetStatusAsync(id, schoolId, body.Status, ct);
            return Ok(new { id, status = body.Status });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/photo")]
    [Authorize(Roles = "SchoolAdmin,HRManager")]
    public async Task<IActionResult> Photo(Guid schoolId, Guid id, [FromBody] SetPhotoRequest body, CancellationToken ct)
    {
        try
        {
            await employeeService.SetPhotoAsync(id, schoolId, body.PhotoUrl, ct);
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
