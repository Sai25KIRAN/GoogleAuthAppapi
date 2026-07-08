using Microsoft.EntityFrameworkCore;
namespace WebApplication1.Models
{

   
        public class User
        {
            public int Id { get; set; }
            public string GoogleUserId { get; set; } = string.Empty; // payload.Subject
            public string Email { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        }

        public class AppDbContext : DbContext
        {
            public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

            public DbSet<User> Users { get; set; }
        }
    
}
