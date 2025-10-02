using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TemperatureService.Migrations
{
    /// <inheritdoc />
    public partial class FixTimestampIssuesAndSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Temperatures_RoomId_Hour",
                table: "Temperatures");

            migrationBuilder.AlterColumn<decimal>(
                name: "Area",
                table: "Rooms",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldPrecision: 10,
                oldScale: 2);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Rooms",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Rooms",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<decimal>(
                name: "Area",
                table: "Houses",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldPrecision: 10,
                oldScale: 2);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Houses",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Houses",
                keyColumn: "HouseId",
                keyValue: 1,
                columns: new[] { "Address", "Area" },
                values: new object[] { "123 Main Street", 150.5m });

            migrationBuilder.UpdateData(
                table: "Houses",
                keyColumn: "HouseId",
                keyValue: 2,
                columns: new[] { "Address", "Area" },
                values: new object[] { "456 Beach Avenue", 85.2m });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 1,
                columns: new[] { "Area", "Name", "Type" },
                values: new object[] { 25.0m, "Living Room", "Living" });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 2,
                columns: new[] { "Area", "Name", "Type" },
                values: new object[] { 15.5m, "Master Bedroom", "Bedroom" });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 3,
                columns: new[] { "Area", "Name", "Type" },
                values: new object[] { 12.0m, "Kitchen", "Kitchen" });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 4,
                columns: new[] { "Area", "Name", "Type" },
                values: new object[] { 20.0m, "Living Room", "Living" });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 5,
                columns: new[] { "Area", "Name", "Type" },
                values: new object[] { 18.0m, "Guest Bedroom", "Bedroom" });

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 1,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 2,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 3,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 4,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 5,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 6,
                column: "Date",
                value: new DateTime(2025, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc));

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

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Houses");

            migrationBuilder.AlterColumn<double>(
                name: "Area",
                table: "Rooms",
                type: "double precision",
                precision: 10,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,2)",
                oldPrecision: 10,
                oldScale: 2);

            migrationBuilder.AlterColumn<double>(
                name: "Area",
                table: "Houses",
                type: "double precision",
                precision: 10,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,2)",
                oldPrecision: 10,
                oldScale: 2);

            migrationBuilder.UpdateData(
                table: "Houses",
                keyColumn: "HouseId",
                keyValue: 1,
                column: "Area",
                value: 150.5);

            migrationBuilder.UpdateData(
                table: "Houses",
                keyColumn: "HouseId",
                keyValue: 2,
                column: "Area",
                value: 85.200000000000003);

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 1,
                column: "Area",
                value: 25.0);

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 2,
                column: "Area",
                value: 15.5);

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 3,
                column: "Area",
                value: 12.0);

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 4,
                column: "Area",
                value: 20.0);

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 5,
                column: "Area",
                value: 18.0);

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 1,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 2,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 3,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 4,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 5,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Temperatures",
                keyColumn: "TempId",
                keyValue: 6,
                column: "Date",
                value: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.CreateIndex(
                name: "IX_Temperatures_RoomId_Hour",
                table: "Temperatures",
                columns: new[] { "RoomId", "Hour" },
                unique: true);
        }
    }
}
