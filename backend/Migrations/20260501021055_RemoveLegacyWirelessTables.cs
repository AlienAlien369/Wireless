using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RSSBWireless.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyWirelessTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Breakages_WirelessSets_WirelessSetId",
                table: "Breakages");

            migrationBuilder.DropForeignKey(
                name: "FK_IssueItems_Chargers_ChargerId",
                table: "IssueItems");

            migrationBuilder.DropForeignKey(
                name: "FK_IssueItems_Kits_KitId",
                table: "IssueItems");

            migrationBuilder.DropForeignKey(
                name: "FK_IssueItems_WirelessSets_WirelessSetId",
                table: "IssueItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Issues_Collectors_CollectorId",
                table: "Issues");

            migrationBuilder.DropTable(
                name: "Chargers");

            migrationBuilder.DropTable(
                name: "Collectors");

            migrationBuilder.DropTable(
                name: "Kits");

            migrationBuilder.DropTable(
                name: "Photos");

            migrationBuilder.DropTable(
                name: "WirelessSets");

            migrationBuilder.DropIndex(
                name: "IX_Issues_CollectorId",
                table: "Issues");

            migrationBuilder.DropIndex(
                name: "IX_IssueItems_ChargerId",
                table: "IssueItems");

            migrationBuilder.DropIndex(
                name: "IX_IssueItems_KitId",
                table: "IssueItems");

            migrationBuilder.DropIndex(
                name: "IX_IssueItems_WirelessSetId",
                table: "IssueItems");

            migrationBuilder.DropIndex(
                name: "IX_Breakages_WirelessSetId",
                table: "Breakages");

            migrationBuilder.DropColumn(
                name: "CollectorId",
                table: "Issues");

            migrationBuilder.DropColumn(
                name: "ChargerId",
                table: "IssueItems");

            migrationBuilder.DropColumn(
                name: "KitId",
                table: "IssueItems");

            migrationBuilder.DropColumn(
                name: "WirelessSetId",
                table: "IssueItems");

            migrationBuilder.DropColumn(
                name: "WirelessSetId",
                table: "Breakages");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CollectorId",
                table: "Issues",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ChargerId",
                table: "IssueItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KitId",
                table: "IssueItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WirelessSetId",
                table: "IssueItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WirelessSetId",
                table: "Breakages",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Chargers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Brand = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ItemNumber = table.Column<string>(type: "text", nullable: true),
                    Remarks = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chargers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Collectors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BadgeNumber = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Collectors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Kits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ItemNumber = table.Column<string>(type: "text", nullable: false),
                    Remarks = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Photos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IssueId = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    PublicId = table.Column<string>(type: "text", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Photos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Photos_Issues_IssueId",
                        column: x => x.IssueId,
                        principalTable: "Issues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WirelessSets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Brand = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ItemNumber = table.Column<string>(type: "text", nullable: false),
                    QrCodeUrl = table.Column<string>(type: "text", nullable: true),
                    Remarks = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WirelessSets", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Issues_CollectorId",
                table: "Issues",
                column: "CollectorId");

            migrationBuilder.CreateIndex(
                name: "IX_IssueItems_ChargerId",
                table: "IssueItems",
                column: "ChargerId");

            migrationBuilder.CreateIndex(
                name: "IX_IssueItems_KitId",
                table: "IssueItems",
                column: "KitId");

            migrationBuilder.CreateIndex(
                name: "IX_IssueItems_WirelessSetId",
                table: "IssueItems",
                column: "WirelessSetId");

            migrationBuilder.CreateIndex(
                name: "IX_Breakages_WirelessSetId",
                table: "Breakages",
                column: "WirelessSetId");

            migrationBuilder.CreateIndex(
                name: "IX_Photos_IssueId",
                table: "Photos",
                column: "IssueId");

            migrationBuilder.CreateIndex(
                name: "IX_WirelessSets_ItemNumber",
                table: "WirelessSets",
                column: "ItemNumber",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Breakages_WirelessSets_WirelessSetId",
                table: "Breakages",
                column: "WirelessSetId",
                principalTable: "WirelessSets",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_IssueItems_Chargers_ChargerId",
                table: "IssueItems",
                column: "ChargerId",
                principalTable: "Chargers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_IssueItems_Kits_KitId",
                table: "IssueItems",
                column: "KitId",
                principalTable: "Kits",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_IssueItems_WirelessSets_WirelessSetId",
                table: "IssueItems",
                column: "WirelessSetId",
                principalTable: "WirelessSets",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Issues_Collectors_CollectorId",
                table: "Issues",
                column: "CollectorId",
                principalTable: "Collectors",
                principalColumn: "Id");
        }
    }
}
