using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HouseService.Migrations
{
    /// <inheritdoc />
    public partial class AddAddressAndUpdatePropertyTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                values: new object[] { "123 Elm Street", 250.5m });

            migrationBuilder.UpdateData(
                table: "Houses",
                keyColumn: "HouseId",
                keyValue: 2,
                columns: new[] { "Address", "Area" },
                values: new object[] { "456 Oak Avenue", 85.0m });

            migrationBuilder.UpdateData(
                table: "Houses",
                keyColumn: "HouseId",
                keyValue: 3,
                columns: new[] { "Address", "Area" },
                values: new object[] { "789 Pine Road", 180.7m });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 1,
                columns: new[] { "Area", "Name", "Type" },
                values: new object[] { 25.5m, "Living Room", "Living" });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 2,
                columns: new[] { "Area", "Name", "Type" },
                values: new object[] { 30.0m, "Master Bedroom", "Bedroom" });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 3,
                columns: new[] { "Area", "Name", "Type" },
                values: new object[] { 15.5m, "Kitchen", "Kitchen" });

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 4,
                columns: new[] { "Area", "Name", "Type" },
                values: new object[] { 20.7m, "Office", "Office" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                value: 250.5);

            migrationBuilder.UpdateData(
                table: "Houses",
                keyColumn: "HouseId",
                keyValue: 2,
                column: "Area",
                value: 85.0);

            migrationBuilder.UpdateData(
                table: "Houses",
                keyColumn: "HouseId",
                keyValue: 3,
                column: "Area",
                value: 180.69999999999999);

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 1,
                column: "Area",
                value: 25.5);

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 2,
                column: "Area",
                value: 30.0);

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 3,
                column: "Area",
                value: 15.5);

            migrationBuilder.UpdateData(
                table: "Rooms",
                keyColumn: "RoomId",
                keyValue: 4,
                column: "Area",
                value: 20.699999999999999);
        }
    }
}
