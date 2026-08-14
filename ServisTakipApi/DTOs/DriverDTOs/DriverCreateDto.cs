namespace ServisTakipApi.DTOs.DriverDTOs
{
    public class DriverCreateDto
    {
        public required string Name { get; set; }
        public required string Surname { get; set; }
        public required string Email { get; set; }
        public required string PhoneNumber { get; set; }
        public required string Username { get; set; }
        public required string Password { get; set; }
    }
}