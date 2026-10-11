using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Infrastructure.Data;

namespace SchoolERP.API.Controllers;

public record CreateRouteRequest(string Name, IEnumerable<RouteStopRequest> Stops);
public record RouteStopRequest(string Name, int StopOrder, TimeOnly? PickupTime, double? Latitude, double? Longitude);

[ApiController]
[Route("api/schools/{schoolId}/transport")]
[Authorize]
public class TransportController(AppDbContext db) : ControllerBase
{
    [HttpGet("routes")]
    public async Task<IActionResult> GetRoutes(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var routes = await db.Routes
            .Where(r => r.TenantId == tenantId && r.SchoolId == schoolId && r.IsActive)
            .Include(r => r.Stops)
            .OrderBy(r => r.Name)
            .Select(r => new { r.Id, r.Name, stops = r.Stops.OrderBy(s => s.StopOrder).Select(s => new { s.Id, s.Name, s.StopOrder, s.PickupTime, s.Latitude, s.Longitude }) })
            .ToListAsync(ct);
        return Ok(routes);
    }

    [HttpPost("routes")]
    [Authorize(Roles = "SchoolAdmin,TransportManager")]
    public async Task<IActionResult> CreateRoute(Guid schoolId, [FromBody] CreateRouteRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";

        var route = new Route
        {
            TenantId = tenantId, SchoolId = schoolId, Name = req.Name, CreatedBy = actor,
            Stops = req.Stops.Select(s => new RouteStop
            {
                TenantId = tenantId, Name = s.Name, StopOrder = s.StopOrder,
                PickupTime = s.PickupTime, Latitude = s.Latitude, Longitude = s.Longitude
            }).ToList()
        };

        db.Routes.Add(route);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetRoutes), new { schoolId }, new { route.Id, route.Name });
    }

    [HttpGet("trips/active")]
    public async Task<IActionResult> GetActiveTrips(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var trips = await db.Trips
            .Where(t => t.TenantId == tenantId && t.SchoolId == schoolId && t.IsActive)
            .Include(t => t.Route)
            .Include(t => t.Vehicle)
            .Include(t => t.Driver)
            .Select(t => new
            {
                t.Id, t.TripDate, t.StartedAt,
                route = t.Route!.Name,
                vehicle = t.Vehicle!.RegistrationNumber,
                driver = $"{t.Driver!.FirstName} {t.Driver.LastName}"
            })
            .ToListAsync(ct);
        return Ok(trips);
    }
}
