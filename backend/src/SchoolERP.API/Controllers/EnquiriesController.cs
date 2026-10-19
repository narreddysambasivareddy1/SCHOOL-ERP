using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.Interfaces;
using SchoolERP.API.Hubs;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record AssignEnquiryRequest(Guid AssignedToUserId);
public record UpdateEnquiryStatusRequest(string Status, DateOnly? FollowUpOn);
public record EnquiryNoteRequest(string Note, string? Action);

[ApiController]
[Route("api/schools/{schoolId}/enquiries")]
[Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer,FrontOffice")]
public class EnquiriesController(IEnquiryService enquiries, AppDbContext db, IHubContext<EnquiryHub> hub) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid schoolId, [FromQuery] string? status, [FromQuery] string? kind, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        return Ok(await enquiries.ListAsync(schoolId, tenantId, status, kind, ct));
    }

    [HttpGet("{enquiryId:guid}")]
    public async Task<IActionResult> Get(Guid schoolId, Guid enquiryId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var detail = await enquiries.GetAsync(schoolId, tenantId, enquiryId, ct);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpGet("staff")]
    public async Task<IActionResult> Staff(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var allowed = new[] { "FrontOffice", "AdmissionOfficer", "SchoolAdmin" };
        var users = await db.Users
            .Where(u => u.TenantId == tenantId && u.IsActive)
            .Select(u => new
            {
                u.Id, u.Email, name = u.FirstName + " " + u.LastName,
                roles = u.UserRoles.Select(r => r.Role!.Name)
            })
            .ToListAsync(ct);
        return Ok(users.Where(u => u.roles.Any(r => allowed.Contains(r)))
            .Select(u => new { u.Id, u.Email, u.name }));
    }

    [HttpPost("{enquiryId:guid}/assign")]
    public async Task<IActionResult> Assign(Guid schoolId, Guid enquiryId, [FromBody] AssignEnquiryRequest req, CancellationToken ct)
    {
        try
        {
            var item = await enquiries.AssignAsync(schoolId, Tenant(), enquiryId, req.AssignedToUserId, ActorId(), ActorName(), ct);
            await NotifyDesk(item);
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{enquiryId:guid}/status")]
    public async Task<IActionResult> Status(Guid schoolId, Guid enquiryId, [FromBody] UpdateEnquiryStatusRequest req, CancellationToken ct)
    {
        try
        {
            var item = await enquiries.UpdateStatusAsync(schoolId, Tenant(), enquiryId, req.Status, req.FollowUpOn, ActorId(), ActorName(), ct);
            await NotifyDesk(item);
            return Ok(item);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{enquiryId:guid}/notes")]
    public async Task<IActionResult> Notes(Guid schoolId, Guid enquiryId, [FromBody] EnquiryNoteRequest req, CancellationToken ct)
    {
        try
        {
            await enquiries.AddNoteAsync(schoolId, Tenant(), enquiryId, req.Note, req.Action ?? "Call", ActorId(), ActorName(), ct);
            return Ok(new { saved = true });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    private Guid Tenant() => Guid.Parse(User.FindFirstValue("tid")!);
    private Guid ActorId() => Guid.Parse(
        User.FindFirstValue(JwtRegisteredClaimNames.Sub)
        ?? User.FindFirstValue("sub")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? Guid.Empty.ToString());
    private string ActorName() => User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "staff";

    private Task NotifyDesk(EnquiryListItem item) =>
        hub.Clients.Group($"tenant:{Tenant()}").SendAsync("enquiryUpdated", item);
}
