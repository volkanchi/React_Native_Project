using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServisTakipApi.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "VehicleId",
                table: "Drivers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_VehicleId",
                table: "Drivers",
                column: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Drivers_Vehicles_VehicleId",
                table: "Drivers",
                column: "VehicleId",
                principalTable: "Vehicles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Drivers_Vehicles_VehicleId",
                table: "Drivers");

            migrationBuilder.DropIndex(
                name: "IX_Drivers_VehicleId",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "VehicleId",
                table: "Drivers");
        }
    }
}
