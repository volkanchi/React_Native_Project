using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServisTakipApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueActiveVehiclePlate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vehicles_CompanyId",
                table: "Vehicles");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_CompanyId_PlateNumber",
                table: "Vehicles",
                columns: new[] { "CompanyId", "PlateNumber" },
                unique: true,
                filter: "\"Deleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vehicles_CompanyId_PlateNumber",
                table: "Vehicles");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_CompanyId",
                table: "Vehicles",
                column: "CompanyId");
        }
    }
}
