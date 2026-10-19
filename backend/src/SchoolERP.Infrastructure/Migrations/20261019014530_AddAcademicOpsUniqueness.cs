using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAcademicOpsUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SubstitutionNeeds_TenantId_TimetableSlotId_Date",
                table: "SubstitutionNeeds",
                columns: new[] { "TenantId", "TimetableSlotId", "Date" },
                unique: true,
                filter: "\"Status\" <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ClassDiaries_TenantId_SchoolId_Date_SectionId_EmployeeId",
                table: "ClassDiaries",
                columns: new[] { "TenantId", "SchoolId", "Date", "SectionId", "EmployeeId" },
                unique: true,
                filter: "\"SubjectId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyLessonPlanDays_TenantId_PlanId_DayOfWeek",
                table: "WeeklyLessonPlanDays",
                columns: new[] { "TenantId", "PlanId", "DayOfWeek" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SubstitutionNeeds_TenantId_TimetableSlotId_Date",
                table: "SubstitutionNeeds");

            migrationBuilder.DropIndex(
                name: "IX_ClassDiaries_TenantId_SchoolId_Date_SectionId_EmployeeId",
                table: "ClassDiaries");

            migrationBuilder.DropIndex(
                name: "IX_WeeklyLessonPlanDays_TenantId_PlanId_DayOfWeek",
                table: "WeeklyLessonPlanDays");
        }
    }
}
