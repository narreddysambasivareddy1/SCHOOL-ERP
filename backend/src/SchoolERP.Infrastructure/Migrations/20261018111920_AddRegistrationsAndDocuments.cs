using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRegistrationsAndDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TeacherAssignments_AcademicYearId_EmployeeId_SubjectId_Sect~",
                table: "TeacherAssignments");

            migrationBuilder.AddColumn<string>(
                name: "ElectiveGroup",
                table: "TeacherAssignments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PeriodSlot",
                table: "TeacherAssignments",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StudentRegistrations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegistrationNumber = table.Column<string>(type: "text", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: false),
                    Gender = table.Column<string>(type: "text", nullable: true),
                    PreferredClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreferredSectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    GuardianName = table.Column<string>(type: "text", nullable: false),
                    GuardianPhone = table.Column<string>(type: "text", nullable: false),
                    GuardianEmail = table.Column<string>(type: "text", nullable: true),
                    Relationship = table.Column<string>(type: "text", nullable: false),
                    RegistrationFeeAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    FeePaid = table.Column<bool>(type: "boolean", nullable: false),
                    FeeReceiptNumber = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: true),
                    AdmissionNumber = table.Column<string>(type: "text", nullable: true),
                    BonafideNumber = table.Column<string>(type: "text", nullable: true),
                    PhotoUrl = table.Column<string>(type: "text", nullable: true),
                    ConfirmedBy = table.Column<string>(type: "text", nullable: true),
                    ConfirmedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentRegistrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentRegistrations_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StudentRegistrations_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegistrationId = table.Column<Guid>(type: "uuid", nullable: true),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    RelativePath = table.Column<string>(type: "text", nullable: false),
                    Verified = table.Column<bool>(type: "boolean", nullable: false),
                    VerifiedBy = table.Column<string>(type: "text", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentDocuments_StudentRegistrations_RegistrationId",
                        column: x => x.RegistrationId,
                        principalTable: "StudentRegistrations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StudentDocuments_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StudentDocuments_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAssignments_AcademicYearId_EmployeeId_SubjectId_Sect~",
                table: "TeacherAssignments",
                columns: new[] { "AcademicYearId", "EmployeeId", "SubjectId", "SectionId", "PeriodSlot", "ElectiveGroup" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentDocuments_RegistrationId",
                table: "StudentDocuments",
                column: "RegistrationId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentDocuments_SchoolId_StudentId_Kind",
                table: "StudentDocuments",
                columns: new[] { "SchoolId", "StudentId", "Kind" });

            migrationBuilder.CreateIndex(
                name: "IX_StudentDocuments_StudentId",
                table: "StudentDocuments",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentDocuments_TenantId",
                table: "StudentDocuments",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentRegistrations_SchoolId_RegistrationNumber",
                table: "StudentRegistrations",
                columns: new[] { "SchoolId", "RegistrationNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentRegistrations_StudentId",
                table: "StudentRegistrations",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentRegistrations_TenantId",
                table: "StudentRegistrations",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentDocuments");

            migrationBuilder.DropTable(
                name: "StudentRegistrations");

            migrationBuilder.DropIndex(
                name: "IX_TeacherAssignments_AcademicYearId_EmployeeId_SubjectId_Sect~",
                table: "TeacherAssignments");

            migrationBuilder.DropColumn(
                name: "ElectiveGroup",
                table: "TeacherAssignments");

            migrationBuilder.DropColumn(
                name: "PeriodSlot",
                table: "TeacherAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAssignments_AcademicYearId_EmployeeId_SubjectId_Sect~",
                table: "TeacherAssignments",
                columns: new[] { "AcademicYearId", "EmployeeId", "SubjectId", "SectionId" },
                unique: true);
        }
    }
}
