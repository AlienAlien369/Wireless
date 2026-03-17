using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RSSBWireless.API.Data;
using RSSBWireless.API.Helpers;
using RSSBWireless.API.Models;
using RSSBWireless.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── Database ─────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── Identity ─────────────────────────────────────────────────────────────────
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(opt =>
{
    opt.Password.RequireDigit = false;
    opt.Password.RequiredLength = 6;
    opt.Password.RequireNonAlphanumeric = false;
    opt.Password.RequireUppercase = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ─── JWT Auth ─────────────────────────────────────────────────────────────────
builder.Services.AddAuthentication(opt =>
{
    opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(opt =>
{
    opt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(builder.Configuration["AppSettings:FrontendUrl"] ?? "http://localhost:3000")
              .AllowAnyHeader().AllowAnyMethod().AllowCredentials());
});

// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IssueService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddSingleton<JwtHelper>();
builder.Services.AddSingleton<CloudinaryHelper>();
builder.Services.AddSingleton<SmsHelper>();
builder.Services.AddSingleton<QrCodeHelper>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ─── Swagger with JWT ─────────────────────────────────────────────────────────
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "RSSB Wireless API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header, Description = "Enter: Bearer {token}",
        Name = "Authorization", Type = SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, new string[] {} }
    });
});

var app = builder.Build();

// ─── Migrate and seed ─────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var userMgr = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    if (!userMgr.Users.Any())
    {
        var admin = new ApplicationUser
        {
            UserName = "admin",
            Email = "admin@rssb.local",
            FullName = "System Admin",
            Role = "Admin"
        };
        await userMgr.CreateAsync(admin, "Admin@123");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
