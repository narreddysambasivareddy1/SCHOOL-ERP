using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace SchoolERP.Tests.Integration;

public class AuthApiTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Login_Returns401_WithInvalidCredentials()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login",
            new { email = "nobody@test.com", password = "wrong", schoolCode = "bright-future" });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_Returns400_WithoutSchoolCode()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login",
            new { email = "admin@test.com", password = "pass" });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Resolve_Returns404_ForUnknownSchoolCode()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/tenants/resolve/does-not-exist");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Students_Returns401_WithoutToken()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync($"/api/schools/{Guid.NewGuid()}/students?academicYearId={Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Health_Returns200()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/health");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
