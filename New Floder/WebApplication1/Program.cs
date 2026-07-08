using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using WebApplication1.Models;

var builder = Microsoft.AspNetCore.Builder.WebApplication.CreateBuilder(args);

// --- 1. REGISTER SERVICES ---

// Database Connection with automated fallback if Azure connection isn't present
var connectionString = builder.Configuration.GetConnectionString("AzureDbConnection");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(connectionString, sqlServerOptionsAction: sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        }));
}
else
{
    // Fallback to avoid complete deployment crash if running on empty environment variables
    builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("FallbackDb"));
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// CRITICAL FIX: Register Authentication and JWT Bearer Services
var jwtKey = builder.Configuration["Jwt:Key"] ?? "TEMPORARY_FALLBACK_SECRET_KEY_32_CHARS_LONG";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "https://webapplication1-production-7945.up.railway.app",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "https://google-auth-app-lyart.vercel.app",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Configure Swagger Docs
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Angular & .NET Core Auth API",
        Version = "v1",
        Description = "API endpoints handling Google OAuth2 authentication integrations."
    });
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("VercelCorsPolicy", policy =>
    {
        policy.WithOrigins(
                "https://google-auth-app-lyart.vercel.app",
                "https://google-auth-app-git-main-sai25kirans-projects.vercel.app"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// --- 2. CONFIGURE MIDDLEWARE PIPELINE ---

// Swagger UI visible in both Local and Production (Railway)
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth API v1");
    options.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();

// CRITICAL EXECUTION ORDER: CORS -> Auth -> Controllers
app.UseCors("VercelCorsPolicy");

app.UseAuthentication(); // MUST be explicitly called before Authorization
app.UseAuthorization();

app.MapControllers();
app.Run();