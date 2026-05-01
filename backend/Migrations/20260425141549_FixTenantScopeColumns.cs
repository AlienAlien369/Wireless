using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RSSBWireless.API.Migrations
{
    /// <inheritdoc />
    public partial class FixTenantScopeColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CenterId",
                table: "Visits",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DepartmentId",
                table: "Visits",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CenterId",
                table: "Issues",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DepartmentId",
                table: "Issues",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CenterId",
                table: "Incharges",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DepartmentId",
                table: "Incharges",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Visits_CenterId",
                table: "Visits",
                column: "CenterId");

            migrationBuilder.CreateIndex(
                name: "IX_Visits_DepartmentId",
                table: "Visits",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Issues_CenterId",
                table: "Issues",
                column: "CenterId");

            migrationBuilder.CreateIndex(
                name: "IX_Issues_DepartmentId",
                table: "Issues",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Incharges_CenterId",
                table: "Incharges",
                column: "CenterId");

            migrationBuilder.CreateIndex(
                name: "IX_Incharges_DepartmentId",
                table: "Incharges",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Incharges_Centers_CenterId",
                table: "Incharges",
                column: "CenterId",
                principalTable: "Centers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Incharges_Departments_DepartmentId",
                table: "Incharges",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Issues_Centers_CenterId",
                table: "Issues",
                column: "CenterId",
                principalTable: "Centers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Issues_Departments_DepartmentId",
                table: "Issues",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Visits_Centers_CenterId",
                table: "Visits",
                column: "CenterId",
                principalTable: "Centers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Visits_Departments_DepartmentId",
                table: "Visits",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incharges_Centers_CenterId",
                table: "Incharges");

            migrationBuilder.DropForeignKey(
                name: "FK_Incharges_Departments_DepartmentId",
                table: "Incharges");

            migrationBuilder.DropForeignKey(
                name: "FK_Issues_Centers_CenterId",
                table: "Issues");

            migrationBuilder.DropForeignKey(
                name: "FK_Issues_Departments_DepartmentId",
                table: "Issues");

            migrationBuilder.DropForeignKey(
                name: "FK_Visits_Centers_CenterId",
                table: "Visits");

            migrationBuilder.DropForeignKey(
                name: "FK_Visits_Departments_DepartmentId",
                table: "Visits");

            migrationBuilder.DropIndex(
                name: "IX_Visits_CenterId",
                table: "Visits");

            migrationBuilder.DropIndex(
                name: "IX_Visits_DepartmentId",
                table: "Visits");

            migrationBuilder.DropIndex(
                name: "IX_Issues_CenterId",
                table: "Issues");

            migrationBuilder.DropIndex(
                name: "IX_Issues_DepartmentId",
                table: "Issues");

            migrationBuilder.DropIndex(
                name: "IX_Incharges_CenterId",
                table: "Incharges");

            migrationBuilder.DropIndex(
                name: "IX_Incharges_DepartmentId",
                table: "Incharges");

            migrationBuilder.DropColumn(
                name: "CenterId",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "CenterId",
                table: "Issues");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "Issues");

            migrationBuilder.DropColumn(
                name: "CenterId",
                table: "Incharges");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "Incharges");
        }
    }
}
