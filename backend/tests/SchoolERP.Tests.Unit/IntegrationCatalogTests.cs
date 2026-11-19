using FluentAssertions;
using SchoolERP.Infrastructure.Integrations;
using Xunit;

namespace SchoolERP.Tests.Unit;

public class IntegrationCatalogTests
{
    [Fact]
    public void MergeConfig_KeepsStoredSecret_WhenIncomingValueIsMasked()
    {
        const string existing = """{"host":"smtp.school.test","password":"real-secret-value"}""";
        const string incoming = """{"host":"smtp.school.test","password":"rea••••alue"}""";

        var merged = IntegrationCatalog.MergeConfig(existing, incoming);

        merged.Should().Contain("real-secret-value");
        merged.Should().NotContain("rea••••alue");
    }

    [Fact]
    public void MergeConfig_ReplacesSecret_WhenIncomingValueIsNew()
    {
        const string existing = """{"password":"real-secret-value"}""";
        const string incoming = """{"password":"new-school-password"}""";

        var merged = IntegrationCatalog.MergeConfig(existing, incoming);

        merged.Should().Contain("new-school-password");
        merged.Should().NotContain("real-secret-value");
    }
}
