using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SchoolERP.API.Hubs;

[Authorize(Roles = "SchoolAdmin,PlatformSuperAdmin,AdmissionOfficer,FrontOffice")]
public class EnquiryHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var tid = Context.User?.FindFirst("tid")?.Value;
        if (!string.IsNullOrEmpty(tid))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant:{tid}");
        await base.OnConnectedAsync();
    }
}
