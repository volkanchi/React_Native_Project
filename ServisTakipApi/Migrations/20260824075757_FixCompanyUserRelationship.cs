using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServisTakipApi.Migrations
{
    /// <inheritdoc />
    public partial class FixCompanyUserRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Companies_CompanyId1",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_CompanyId1",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CompanyId1",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_CompanyId1",
                table: "Users",
                column: "CompanyId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Companies_CompanyId1",
                table: "Users",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");
        }
    }
}
