using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using System.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using WebApplication1.Models;

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
    [Route("api/auth")]
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
            if (dto == null || string.IsNullOrEmpty(dto.Token))
            {
                return BadRequest(new { message = "Token field is missing or empty." });
            }
            try
            {

                var configuredClientId = _configuration["Authentication:Google:ClientId"];

                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new List<string> { configuredClientId }
                };

                // Validate Token
                GoogleJsonWebSignature.Payload payload = await GoogleJsonWebSignature.ValidateAsync(dto.Token, settings);

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
                //var internalJwtToken = "YOUR_GENERATED_APPLICATION_JWT_TOKEN";
                var internalJwtToken = GenerateApplicationJwtToken(user.Email, user.Name);

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


        

private string GenerateApplicationJwtToken(string userEmail, string userName)
    {
        // 1. Fetch the secret configuration values
        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        // 2. Define the payload claims (User information inside the token)
        var claims = new[]
        {
        new Claim(JwtRegisteredClaimNames.Sub, userEmail),
        new Claim(JwtRegisteredClaimNames.Email, userEmail),
        new Claim(ClaimTypes.Name, userName),
        new Claim(Guid.NewGuid().ToString(), Guid.NewGuid().ToString()) // Unique token ID
    };

        // 3. Construct the Token parameters
        var token = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7), // Token valid for 1 week
            Issuer = jwtIssuer,
            Audience = jwtAudience,
            SigningCredentials = credentials
        };

        // 4. Serialize the token into its final encrypted string format
        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = tokenHandler.CreateToken(token);

        return tokenHandler.WriteToken(securityToken);
    }
}

}
