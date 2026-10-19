using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SchoolERP.API.Hubs;
using SchoolERP.Application.Interfaces;

namespace SchoolERP.API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/public/{schoolCode}/enquiries")]
public class PublicEnquiriesController(IEnquiryService enquiries, IHubContext<EnquiryHub> hub) : ControllerBase
{
    [HttpPost("otp")]
    public async Task<IActionResult> RequestOtp(string schoolCode, [FromBody] EnquiryOtpRequest body, CancellationToken ct)
    {
        try
        {
            var result = await enquiries.RequestOtpAsync(schoolCode, body, ClientIp(), ct);
            return Ok(new
            {
                result.ChallengeId,
                result.ExpiresAt,
                sandboxOtp = result.SandboxOtp,
                message = result.SandboxOtp is null
                    ? "OTP sent to the mobile number."
                    : "Sandbox OTP issued (SMS/WhatsApp adapters are in sandbox)."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("otp/verify")]
    public async Task<IActionResult> Verify(string schoolCode, [FromBody] EnquiryVerifyRequest body, CancellationToken ct)
    {
        try
        {
            var item = await enquiries.VerifyOtpAsync(body, ClientIp(), ct);
            await hub.Clients.Group($"tenant:{item.TenantId}").SendAsync("enquiryReceived", item, ct);
            return Ok(new { item.Id, item.Status, item.Kind, message = "Enquiry verified. Front office has been notified." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private string ClientIp()
    {
        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded)) return forwarded.Split(',')[0].Trim();
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
