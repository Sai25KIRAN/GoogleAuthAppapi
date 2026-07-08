using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApplication1.Models;
using System.IdentityModel.Tokens;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace WebApplication.Controllers
{
    //public class AuthController : Controller
    //{
    //    public IActionResult Index()
    //    {
    //        return View();
    //    }
    //}

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AuthController(IConfiguration configuration, AppDbContext context)
        {
            _configuration = configuration;
            _context=context;
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            try
            {
                var configuredClientId = _configuration["Authentication:Google:ClientId"];

                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new List<string> { configuredClientId }
                };

                // Validate Token
                GoogleJsonWebSignature.Payload payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);

                // Find user in Azure DB using Google's unique subject identifier
                var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleUserId == payload.Subject);

                if (user == null)
                {
                    // --- SIGN UP WORKFLOW ---
                    // User does not exist yet, save them to Azure SQL Database
                    user = new User
                    {
                        GoogleUserId = payload.Subject,
                        Email = payload.Email,
                        Name = payload.Name
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }

                // --- SIGN IN WORKFLOW ---
                // TODO: Generate your internal JWT string payload here using 'user.Id' or 'user.Email'
                var internalJwtToken = "YOUR_GENERATED_APPLICATION_JWT_TOKEN";

                return Ok(new
                {
                    token = internalJwtToken,
                    email = user.Email,
                    name = user.Name
                });
            }
            catch (InvalidJwtException)
            {
                return BadRequest("Invalid Google token signature.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }
    }

}
