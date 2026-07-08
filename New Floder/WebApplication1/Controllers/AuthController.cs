using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using WebApplication1.Models;

namespace WebApplication.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AuthController(IConfiguration configuration, AppDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            // Validates that data structural binding succeeded
            if (dto == null || string.IsNullOrEmpty(dto.Token))
            {
                return BadRequest(new { message = "The target data property 'token' is missing or empty." });
            }

            try
            {
                var configuredClientId = _configuration["Authentication:Google:ClientId"];

                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new List<string> { configuredClientId }
                };

                // Validate the raw token against Google OAuth servers
                GoogleJsonWebSignature.Payload payload = await GoogleJsonWebSignature.ValidateAsync(dto.Token, settings);

                // Find user in DB using Google's unique subject identifier
                var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleUserId == payload.Subject);

                if (user == null)
                {
                    // --- SIGN UP WORKFLOW ---
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
                return BadRequest(new { message = "Invalid Google token signature." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error", details = ex.Message });
            }
        }

        private string GenerateApplicationJwtToken(string userEmail, string userName)
        {
            // Null coalescing (??) guarantees a valid fallback key to prevent a configuration crash
            var jwtKey = _configuration["Jwt:Key"] ?? "TEMPORARY_FALLBACK_SECRET_KEY_32_CHARS_LONG";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "https://webapplication1-production-7945.up.railway.app";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "https://google-auth-app-lyart.vercel.app";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userEmail),
                new Claim(JwtRegisteredClaimNames.Email, userEmail),
                new Claim(ClaimTypes.Name, userName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = jwtIssuer,
                Audience = jwtAudience,
                SigningCredentials = credentials
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var securityToken = tokenHandler.CreateToken(token);

            return tokenHandler.WriteToken(securityToken);
        }
    }

    // Explicitly declaring the exact data class structure expected by the model binder
    public class GoogleLoginDto
    {
        public string Token { get; set; }
    }
}