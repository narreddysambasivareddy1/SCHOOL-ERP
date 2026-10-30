using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolERP.Infrastructure.Data;

#nullable disable

namespace SchoolERP.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261030033000_AddEmployeePhotoUrl")]
    public class AddEmployeePhotoUrl : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Employees",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Employees");
        }
    }
}
