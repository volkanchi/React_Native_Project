using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServisTakipApi.Migrations
{
    /// <inheritdoc />
    public partial class UseDriverProfileIdForRoutes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Routes_Users_DriverId",
                table: "Routes");

            migrationBuilder.Sql("""
                INSERT INTO "Drivers" ("Id", "UserId", "PlateNumber", "Capacity", "IsActiveDuty")
                SELECT gen_random_uuid(), u."Id", '', 0, false
                FROM "Users" u
                WHERE u."Role" = 2
                  AND NOT EXISTS (SELECT 1 FROM "Drivers" d WHERE d."UserId" = u."Id");
                """);

            migrationBuilder.Sql("""
                UPDATE "Routes" r
                SET "DriverId" = d."Id"
                FROM "Drivers" d
                WHERE d."UserId" = r."DriverId";
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_Routes_Drivers_DriverId",
                table: "Routes",
                column: "DriverId",
                principalTable: "Drivers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Routes_Drivers_DriverId",
                table: "Routes");

            migrationBuilder.Sql("""
                UPDATE "Routes" r
                SET "DriverId" = d."UserId"
                FROM "Drivers" d
                WHERE d."Id" = r."DriverId";
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_Routes_Users_DriverId",
                table: "Routes",
                column: "DriverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
