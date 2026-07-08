using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using WebApplication1.Models;

var builder = Microsoft.AspNetCore.Builder.WebApplication.CreateBuilder(args);

// --- 1. REGISTER SERVICES ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("AzureDbConnection"),
        sqlServerOptionsAction: sqlOptions =>
        {
            // This enables built-in Azure transient error handling
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        }));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with explicit document settings
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Angular & .NET Core Auth API",
        Version = "v1",
        Description = "API endpoints handling Google OAuth2 authentication integrations."
    });
});

// Configure CORS to authorize your Angular frontend local development server
//var angularCorsPolicy = "_myAllowSpecificOrigins";
//builder.Services.AddCors(options =>
//{
//    options.AddPolicy(name: angularCorsPolicy,
//        policy =>
//        {
//            policy.WithOrigins("http://localhost:4200") // Matches your frontend URL
//                  .AllowAnyHeader()
//                  .AllowAnyMethod();
//        });
//});

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
              .AllowCredentials(); // Include this if you pass cookies/auth headers
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
// --- 2. CONFIGURE MIDDLEWARE PIPELINE ---

// Enable interactive documentation exclusively during local development
if (app.Environment.IsDevelopment())
{
    //app.UseSwagger();   // Serves raw OpenAPI definition JSON at /swagger/v1/swagger.json
    //app.UseSwaggerUI(options =>
    //{
    //    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth API v1");
    //    options.RoutePrefix = "swagger"; // Opens documentation directly at root-domain/swagger
    //});
}

app.UseHttpsRedirection();

// CORS must be executed BEFORE authorization and routing mapping rules
//app.UseCors(angularCorsPolicy);

app.UseCors("VercelCorsPolicy");

app.UseAuthorization();

// Automatically discovers and maps endpoints defined inside Controllers/AuthController.cs
app.MapControllers();

app.Run();