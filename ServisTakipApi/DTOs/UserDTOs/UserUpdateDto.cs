namespace ServisTakipApi.DTOs.UserDTOs
{
    public class UserUpdateDto
    {
        public required string Name { get; set; }
        public required string Surname { get; set; }
        public required string PhoneNumber { get; set; }
    }
}