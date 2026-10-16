using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolERP.Infrastructure.Data;

#nullable disable

namespace SchoolERP.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261015080000_AddSchoolLocaleCurrency")]
public partial class AddSchoolLocaleCurrency : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Currency",
            table: "Schools",
            type: "text",
            nullable: false,
            defaultValue: "INR");

        migrationBuilder.AddColumn<string>(
            name: "Locale",
            table: "Schools",
            type: "text",
            nullable: false,
            defaultValue: "en-IN");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "Currency", table: "Schools");
        migrationBuilder.DropColumn(name: "Locale", table: "Schools");
    }
}
