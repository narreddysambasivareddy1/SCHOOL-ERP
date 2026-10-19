using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTimetableLeaveDiary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClassDiaries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: true),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Homework = table.Column<string>(type: "text", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: true),
                    RelativePath = table.Column<string>(type: "text", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsLate = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassDiaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassDiaries_Classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "Classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassDiaries_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassDiaries_Sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "Sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassDiaries_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ClassDiaries_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SchoolAcademicSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    DiaryDeadline = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SchoolAcademicSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SchoolAcademicSettings_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TimetablePeriods",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    Band = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimetablePeriods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TimetablePeriods_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WeeklyLessonPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uuid", nullable: false),
                    WeekStart = table.Column<DateOnly>(type: "date", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyLessonPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WeeklyLessonPlans_Classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "Classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklyLessonPlans_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklyLessonPlans_Sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "Sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklyLessonPlans_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklyLessonPlans_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TimetableSlots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    PeriodId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ElectiveGroup = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimetableSlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TimetableSlots_Classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "Classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TimetableSlots_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TimetableSlots_Sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "Sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TimetableSlots_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TimetableSlots_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TimetableSlots_TimetablePeriods_PeriodId",
                        column: x => x.PeriodId,
                        principalTable: "TimetablePeriods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WeeklyLessonPlanDays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    Topic = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyLessonPlanDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WeeklyLessonPlanDays_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklyLessonPlanDays_WeeklyLessonPlans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "WeeklyLessonPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubstitutionNeeds",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    LeaveRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    TimetableSlotId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    PeriodId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalEmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubstituteEmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubstitutionNeeds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubstitutionNeeds_Employees_OriginalEmployeeId",
                        column: x => x.OriginalEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubstitutionNeeds_Employees_SubstituteEmployeeId",
                        column: x => x.SubstituteEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SubstitutionNeeds_LeaveRequests_LeaveRequestId",
                        column: x => x.LeaveRequestId,
                        principalTable: "LeaveRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubstitutionNeeds_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubstitutionNeeds_TimetablePeriods_PeriodId",
                        column: x => x.PeriodId,
                        principalTable: "TimetablePeriods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubstitutionNeeds_TimetableSlots_TimetableSlotId",
                        column: x => x.TimetableSlotId,
                        principalTable: "TimetableSlots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClassDiaries_ClassId",
                table: "ClassDiaries",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassDiaries_EmployeeId",
                table: "ClassDiaries",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassDiaries_SchoolId_Date_SectionId_EmployeeId_SubjectId",
                table: "ClassDiaries",
                columns: new[] { "SchoolId", "Date", "SectionId", "EmployeeId", "SubjectId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassDiaries_SectionId",
                table: "ClassDiaries",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassDiaries_SubjectId",
                table: "ClassDiaries",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassDiaries_TenantId",
                table: "ClassDiaries",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_SchoolAcademicSettings_SchoolId",
                table: "SchoolAcademicSettings",
                column: "SchoolId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SchoolAcademicSettings_TenantId",
                table: "SchoolAcademicSettings",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_SubstitutionNeeds_LeaveRequestId",
                table: "SubstitutionNeeds",
                column: "LeaveRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_SubstitutionNeeds_OriginalEmployeeId",
                table: "SubstitutionNeeds",
                column: "OriginalEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_SubstitutionNeeds_PeriodId",
                table: "SubstitutionNeeds",
                column: "PeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_SubstitutionNeeds_SchoolId_Date_Status",
                table: "SubstitutionNeeds",
                columns: new[] { "SchoolId", "Date", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SubstitutionNeeds_SubstituteEmployeeId",
                table: "SubstitutionNeeds",
                column: "SubstituteEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_SubstitutionNeeds_TenantId",
                table: "SubstitutionNeeds",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_SubstitutionNeeds_TimetableSlotId",
                table: "SubstitutionNeeds",
                column: "TimetableSlotId");

            migrationBuilder.CreateIndex(
                name: "IX_TimetablePeriods_SchoolId_AcademicYearId_SortOrder",
                table: "TimetablePeriods",
                columns: new[] { "SchoolId", "AcademicYearId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TimetablePeriods_TenantId",
                table: "TimetablePeriods",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TimetableSlots_AcademicYearId_SectionId_DayOfWeek_PeriodId",
                table: "TimetableSlots",
                columns: new[] { "AcademicYearId", "SectionId", "DayOfWeek", "PeriodId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TimetableSlots_ClassId",
                table: "TimetableSlots",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_TimetableSlots_EmployeeId",
                table: "TimetableSlots",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_TimetableSlots_PeriodId",
                table: "TimetableSlots",
                column: "PeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_TimetableSlots_SectionId",
                table: "TimetableSlots",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_TimetableSlots_SubjectId",
                table: "TimetableSlots",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_TimetableSlots_TenantId",
                table: "TimetableSlots",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyLessonPlanDays_PlanId",
                table: "WeeklyLessonPlanDays",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyLessonPlanDays_TenantId",
                table: "WeeklyLessonPlanDays",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyLessonPlans_ClassId",
                table: "WeeklyLessonPlans",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyLessonPlans_EmployeeId",
                table: "WeeklyLessonPlans",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyLessonPlans_SchoolId_WeekStart_SectionId_SubjectId_Em~",
                table: "WeeklyLessonPlans",
                columns: new[] { "SchoolId", "WeekStart", "SectionId", "SubjectId", "EmployeeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyLessonPlans_SectionId",
                table: "WeeklyLessonPlans",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyLessonPlans_SubjectId",
                table: "WeeklyLessonPlans",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyLessonPlans_TenantId",
                table: "WeeklyLessonPlans",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClassDiaries");

            migrationBuilder.DropTable(
                name: "SchoolAcademicSettings");

            migrationBuilder.DropTable(
                name: "SubstitutionNeeds");

            migrationBuilder.DropTable(
                name: "WeeklyLessonPlanDays");

            migrationBuilder.DropTable(
                name: "TimetableSlots");

            migrationBuilder.DropTable(
                name: "WeeklyLessonPlans");

            migrationBuilder.DropTable(
                name: "TimetablePeriods");
        }
    }
}
