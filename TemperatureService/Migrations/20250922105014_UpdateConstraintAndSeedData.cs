using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TemperatureService.Migrations
{
    /// <inheritdoc />
    public partial class UpdateConstraintAndSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Temperatures_RoomId_Hour",
                table: "Temperatures");

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 1,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 2,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 3,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 4,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 5,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 6,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Temperatures_RoomId_Hour_Date",
                table: "Temperatures",
                columns: new[] { "RoomId", "Hour", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Temperatures_RoomId_Hour_Date",
                table: "Temperatures");

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 1,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 2,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 3,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 4,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 5,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 6,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Temperatures_RoomId_Hour",
                table: "Temperatures",
                columns: new[] { "RoomId", "Hour" },
                unique: true);
        }
    }
}
