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
var frontendUrl = builder.Configuration["AppSettings:FrontendUrl"]?.Trim() ?? "http://localhost:3000";
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddHttpClient<SmsHelper>();
builder.Services.AddScoped<SmsHelper>();
builder.Services.AddScoped<EmailHelper>();
builder.Services.AddScoped<IssueService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<AccessScopeService>();
builder.Services.AddSingleton<ProductConfigService>();
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

    // Seed default center/department for multi-tenancy.
    var center = await db.Centers.OrderBy(x => x.Id).FirstOrDefaultAsync();
    if (center == null)
    {
        center = new Center { Name = "Bhatti Center" };
        db.Centers.Add(center);
        await db.SaveChangesAsync();
    }

    var dept = await db.Departments.OrderBy(x => x.Id).FirstOrDefaultAsync(x => x.CenterId == center.Id);
    if (dept == null)
    {
        dept = new Department { CenterId = center.Id, Name = "General" };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
    }

    // Backfill tenant scope for legacy operational rows created before scope columns existed.
    var legacyVisits = await db.Visits.Where(x => x.CenterId == null).ToListAsync();
    foreach (var v in legacyVisits)
    {
        v.CenterId = center.Id;
        v.DepartmentId ??= dept.Id;
    }
    var legacyIncharges = await db.Incharges.Where(x => x.CenterId == null).ToListAsync();
    foreach (var i in legacyIncharges)
    {
        i.CenterId = center.Id;
        i.DepartmentId ??= dept.Id;
    }
    var legacyIssues = await db.Issues.Where(x => x.CenterId == null).ToListAsync();
    foreach (var i in legacyIssues)
    {
        i.CenterId = center.Id;
        i.DepartmentId ??= dept.Id;
    }
    if (legacyVisits.Count > 0 || legacyIncharges.Count > 0 || legacyIssues.Count > 0)
        await db.SaveChangesAsync();

    // Seed roles (UI-managed).
    if (!await db.AppRoles.AnyAsync())
    {
        db.AppRoles.AddRange(
            new AppRole { Name = "Admin", Audience = "Admin" },
            new AppRole { Name = "Incharge", Audience = "Incharge" }
        );
        await db.SaveChangesAsync();
    }

    // Seed/ensure menu pages exist (used for dynamic nav + access assignment UI).
    var requiredPages = new List<MenuPage>
    {
        new() { Code = "admin.dashboard", Label = "Dashboard", Path = "/admin", Icon = "LayoutDashboard", Audience = "Admin", SortOrder = 10 },
        new() { Code = "admin.visits", Label = "Visits", Path = "/admin/visits", Icon = "MapPin", Audience = "Admin", SortOrder = 20 },
        new() { Code = "admin.inventory", Label = "Inventory", Path = "/admin/inventory", Icon = "Package", Audience = "Admin", SortOrder = 30 },
        new() { Code = "admin.incharges", Label = "Incharges", Path = "/admin/incharges", Icon = "Users", Audience = "Admin", SortOrder = 40 },
        new() { Code = "admin.issueAssets", Label = "Issue Assets", Path = "/admin/issue-assets", Icon = "ArrowDownToLine", Audience = "Admin", SortOrder = 50 },
        new() { Code = "admin.receiveAssets", Label = "Receive Assets", Path = "/admin/receive-assets", Icon = "ArrowUpFromLine", Audience = "Admin", SortOrder = 70 },
        new() { Code = "admin.reports", Label = "Reports", Path = "/admin/reports", Icon = "FileBarChart", Audience = "Admin", SortOrder = 100 },
        new() { Code = "admin.assets", Label = "Assets", Path = "/admin/assets", Icon = "Boxes", Audience = "Admin", SortOrder = 105 },
        new() { Code = "admin.users", Label = "Users", Path = "/admin/users", Icon = "UserCog", Audience = "Admin", SortOrder = 106 },
        new() { Code = "admin.access", Label = "Access Control", Path = "/admin/access", Icon = "Shield", Audience = "Admin", SortOrder = 110 },
    };

    foreach (var p in requiredPages)
    {
        var existing = await db.MenuPages.FirstOrDefaultAsync(x => x.Code == p.Code);
        if (existing == null)
        {
            db.MenuPages.Add(p);
            continue;
        }
        existing.Label = p.Label;
        existing.Path = p.Path;
        existing.Icon = p.Icon;
        existing.Audience = p.Audience;
        existing.SortOrder = p.SortOrder;
        existing.IsActive = true;
    }
    await db.SaveChangesAsync();

    var legacyCodes = new[] { "admin.issue", "admin.bulkIssue", "admin.receive", "admin.bulkReceive", "admin.breakage" };
    var legacyPages = await db.MenuPages.Where(x => legacyCodes.Contains(x.Code)).ToListAsync();
    foreach (var lp in legacyPages) lp.IsActive = false;
    await db.SaveChangesAsync();

    // Default: Admin gets all admin pages for this center (all departments).
    if (!await db.MenuPagePermissions.AnyAsync())
    {
        var pages = await db.MenuPages.Where(x => x.Audience == "Admin" && x.IsActive).ToListAsync();
        db.MenuPagePermissions.AddRange(pages.Select(p => new MenuPagePermission
        {
            CenterId = center.Id,
            DepartmentId = null,
            Role = "Admin",
            MenuPageId = p.Id
        }));
        await db.SaveChangesAsync();
    }

    // Seed a default asset type for non-wireless materials.
    if (!await db.AssetTypes.AnyAsync(x => x.CenterId == center.Id))
    {
        db.AssetTypes.Add(new AssetType { CenterId = center.Id, Code = "wheelchair", Name = "Wheelchair", TrackingMode = "Individual" });
        await db.SaveChangesAsync();
    }

    // Seed default admin user.
    var adminUser = await userMgr.FindByNameAsync("admin");
    if (adminUser == null)
    {
        adminUser = new ApplicationUser
        {
            UserName = "admin",
            Email = "admin@rssb.local",
            FullName = "System Admin",
            Role = "Admin",
            CenterId = center.Id,
            DepartmentId = dept.Id
        };
        await userMgr.CreateAsync(adminUser, "Admin@123");
    }
    else if (adminUser.CenterId == null || adminUser.DepartmentId == null)
    {
        adminUser.CenterId ??= center.Id;
        adminUser.DepartmentId ??= dept.Id;
        await userMgr.UpdateAsync(adminUser);
    }
}

if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
