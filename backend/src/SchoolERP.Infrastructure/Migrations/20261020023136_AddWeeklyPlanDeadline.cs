using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWeeklyPlanDeadline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeOnly>(
                name: "WeeklyPlanDeadline",
                table: "SchoolAcademicSettings",
                type: "time without time zone",
                nullable: false,
                defaultValue: new TimeOnly(18, 0));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WeeklyPlanDeadline",
                table: "SchoolAcademicSettings");

        }
    }
}
