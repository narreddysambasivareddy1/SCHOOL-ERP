using SchoolERP.API.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Entities;
using SchoolERP.Infrastructure.Data;
using SchoolERP.Infrastructure.Integrations;

namespace SchoolERP.API.Controllers;

public record CreateRouteRequest(string Name, IEnumerable<RouteStopRequest> Stops);
public record SaveVehicleRequest(string RegistrationNumber, int Capacity, DateOnly? InsuranceExpiry, DateOnly? FitnessExpiry);
public record RouteStopRequest(string Name, int StopOrder, TimeOnly? PickupTime, double? Latitude, double? Longitude);

[ApiController]
[Microsoft.AspNetCore.Mvc.Route("api/schools/{schoolId}/transport")]
[Authorize]
public class TransportController(AppDbContext db) : ControllerBase
{
    [HttpGet("vehicles")]
    public async Task<IActionResult> Vehicles(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var rows = await db.Vehicles
            .Where(v => v.TenantId == tenantId && v.SchoolId == schoolId && v.IsActive)
            .OrderBy(v => v.RegistrationNumber)
            .Select(v => new { v.Id, v.RegistrationNumber, v.Capacity, v.InsuranceExpiry, v.FitnessExpiry })
            .ToListAsync(ct);
        return Ok(rows);
    }

    [HttpPost("vehicles")]
    [Authorize(Roles = RoleNames.TransportWrite)]
    public async Task<IActionResult> SaveVehicle(Guid schoolId, [FromBody] SaveVehicleRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.RegistrationNumber) || req.Capacity <= 0)
            return BadRequest(new { error = "A registration number and a capacity above zero are required." });
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var number = req.RegistrationNumber.Trim();
        var exists = await db.Vehicles.AnyAsync(v =>
            v.TenantId == tenantId && v.SchoolId == schoolId && v.RegistrationNumber == number, ct);
        if (exists) return Conflict(new { error = "That vehicle is already registered for this school." });
        var vehicle = new Vehicle
        {
            TenantId = tenantId, SchoolId = schoolId, RegistrationNumber = number,
            Capacity = req.Capacity, InsuranceExpiry = req.InsuranceExpiry, FitnessExpiry = req.FitnessExpiry, IsActive = true
        };
        db.Vehicles.Add(vehicle);
        await db.SaveChangesAsync(ct);
        return Ok(new { vehicle.Id, vehicle.RegistrationNumber, vehicle.Capacity });
    }

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
    [Authorize(Roles = RoleNames.TransportWrite)]
    public async Task<IActionResult> CreateRoute(Guid schoolId, [FromBody] CreateRouteRequest req, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";

        var route = new SchoolERP.Domain.Entities.Route
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

    [HttpGet("map")]
    public async Task<IActionResult> Map(Guid schoolId, CancellationToken ct)
    {
        var tenantId = Guid.Parse(User.FindFirstValue("tid")!);
        var maps = await db.IntegrationSettings
            .FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.TenantId == tenantId && s.ProviderKey == "google_maps", ct);
        var routes = await db.Routes
            .Where(r => r.TenantId == tenantId && r.SchoolId == schoolId && r.IsActive)
            .Include(r => r.Stops)
            .Select(r => new
            {
                r.Id, r.Name,
                stops = r.Stops.OrderBy(s => s.StopOrder).Select(s => new { s.Name, s.StopOrder, s.PickupTime, s.Latitude, s.Longitude })
            })
            .ToListAsync(ct);

        return Ok(new
        {
            sandbox = maps?.IsSandbox != false,
            provider = "google_maps",
            config = maps is null ? null : IntegrationCatalog.MaskConfig(maps.ConfigJson),
            message = "Sandbox map. Live Google tiles load after the school provides a restricted Maps API key.",
            routes
        });
    }
}
