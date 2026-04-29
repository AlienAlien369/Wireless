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
    var productConfig = scope.ServiceProvider.GetRequiredService<ProductConfigService>().GetSnapshot();
    var defaultCenterName = string.IsNullOrWhiteSpace(productConfig.Branding.DefaultCenterName) ? "Bhati Center" : productConfig.Branding.DefaultCenterName;
    var center = await db.Centers.OrderBy(x => x.Id).FirstOrDefaultAsync();
    if (center == null)
    {
        center = new Center { Name = defaultCenterName };
        db.Centers.Add(center);
        await db.SaveChangesAsync();
    }
    else if (string.Equals(center.Name, "Bhatti Center", StringComparison.OrdinalIgnoreCase))
    {
        center.Name = defaultCenterName;
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

    // Seed roles (UI-managed): SUPER_ADMIN, Center Head, Admin, Sewadaar
    // Handle legacy "Incharge" safely before inserting required roles to avoid unique-key collisions.
    var sewadaarRole = await db.AppRoles.FirstOrDefaultAsync(x => x.Name == "Sewadaar");
    var legacyRole = await db.AppRoles.FirstOrDefaultAsync(x => x.Name == "Incharge");
    if (legacyRole != null && sewadaarRole == null)
    {
        legacyRole.Name = "Sewadaar";
        legacyRole.Audience = "Sewadaar";
        legacyRole.IsActive = true;
    }
    else if (legacyRole != null && sewadaarRole != null)
    {
        // Merge by dropping the duplicate legacy role when Sewadaar already exists.
        db.AppRoles.Remove(legacyRole);
    }
    await db.SaveChangesAsync();

    var requiredRoles = new[]
    {
        new AppRole { Name = "SUPER_ADMIN", Audience = "Admin", IsActive = true },
        new AppRole { Name = "Center Head", Audience = "Admin", IsActive = true },
        new AppRole { Name = "Admin", Audience = "Admin", IsActive = true },
        new AppRole { Name = "Sewadaar", Audience = "Sewadaar", IsActive = true }
    };
    foreach (var req in requiredRoles)
    {
        var existingRole = await db.AppRoles.FirstOrDefaultAsync(x => x.Name == req.Name);
        if (existingRole == null)
        {
            db.AppRoles.Add(req);
        }
        else
        {
            existingRole.Audience = req.Audience;
            existingRole.IsActive = true;
        }
    }
    await db.SaveChangesAsync();

    var inchargeUsers = await db.Users
        .Where(x => x.Role == "Incharge" || x.Role == "incharge")
        .ToListAsync();
    foreach (var u in inchargeUsers) u.Role = "Sewadaar";
    var adminUserFix = await userMgr.FindByNameAsync("admin");
    if (adminUserFix != null) adminUserFix.Role = "SUPER_ADMIN";
    if (inchargeUsers.Count > 0 || adminUserFix != null) await db.SaveChangesAsync();

    // Seed/ensure menu pages exist (used for dynamic nav + access assignment UI).
    var requiredPages = new List<MenuPage>
    {
        new() { Code = "admin.dashboard", Label = "Dashboard", Path = "/admin", Icon = "LayoutDashboard", Audience = "Admin", SortOrder = 10 },
        new() { Code = "admin.visits", Label = "Visits", Path = "/admin/visits", Icon = "MapPin", Audience = "Admin", SortOrder = 20 },
        new() { Code = "admin.incharges", Label = "Sewadaars", Path = "/admin/incharges", Icon = "Users", Audience = "Admin", SortOrder = 40 },
        new() { Code = "admin.issueAssets", Label = "Issue Assets", Path = "/admin/issue-assets", Icon = "ArrowDownToLine", Audience = "Admin", SortOrder = 50 },
        new() { Code = "admin.receiveAssets", Label = "Receive Assets", Path = "/admin/receive-assets", Icon = "ArrowUpFromLine", Audience = "Admin", SortOrder = 70 },
        new() { Code = "admin.breakage", Label = "Breakages", Path = "/admin/breakage", Icon = "AlertTriangle", Audience = "Admin", SortOrder = 90 },
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

    var legacyCodes = new[] { "admin.issue", "admin.bulkIssue", "admin.receive", "admin.bulkReceive", "admin.inventory" };
    var legacyPages = await db.MenuPages.Where(x => legacyCodes.Contains(x.Code)).ToListAsync();
    foreach (var lp in legacyPages) lp.IsActive = false;
    await db.SaveChangesAsync();

    // Default: Admin gets all admin pages for this center (all departments).
    var adminPages = await db.MenuPages.Where(x => x.Audience == "Admin" && x.IsActive).ToListAsync();
    var seedRoles = new[] { "SUPER_ADMIN", "Center Head", "Admin" };
    foreach (var r in seedRoles)
    {
        var hasAny = await db.MenuPagePermissions.AnyAsync(x => x.CenterId == center.Id && x.DepartmentId == null && x.Role == r);
        if (hasAny) continue;
        db.MenuPagePermissions.AddRange(adminPages.Select(p => new MenuPagePermission
        {
            CenterId = center.Id,
            DepartmentId = null,
            Role = r,
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

    // Backfill legacy wireless + kits into unified assets.
    var wirelessAssetType = await db.AssetTypes.FirstOrDefaultAsync(x => x.CenterId == center.Id && x.Code == "wireless-set");
    if (wirelessAssetType == null)
    {
        wirelessAssetType = new AssetType
        {
            CenterId = center.Id,
            Code = "wireless-set",
            Name = "Wireless Set",
            TrackingMode = "Individual"
        };
        db.AssetTypes.Add(wirelessAssetType);
        await db.SaveChangesAsync();
    }

    var kitAssetType = await db.AssetTypes.FirstOrDefaultAsync(x => x.CenterId == center.Id && x.Code == "kit");
    if (kitAssetType == null)
    {
        kitAssetType = new AssetType
        {
            CenterId = center.Id,
            Code = "kit",
            Name = "Kit",
            TrackingMode = "Individual"
        };
        db.AssetTypes.Add(kitAssetType);
        await db.SaveChangesAsync();
    }

    var existingWirelessNumbers = await db.Assets
        .Where(x => x.CenterId == center.Id && x.AssetTypeId == wirelessAssetType.Id && x.ItemNumber != null)
        .Select(x => x.ItemNumber!)
        .ToListAsync();
    var existingWirelessSet = new HashSet<string>(existingWirelessNumbers, StringComparer.OrdinalIgnoreCase);
    var legacyWirelessSets = await db.WirelessSets.ToListAsync();
    var migratedWireless = 0;
    foreach (var ws in legacyWirelessSets)
    {
        if (string.IsNullOrWhiteSpace(ws.ItemNumber) || existingWirelessSet.Contains(ws.ItemNumber)) continue;
        db.Assets.Add(new Asset
        {
            CenterId = center.Id,
            AssetTypeId = wirelessAssetType.Id,
            ItemNumber = ws.ItemNumber,
            Brand = ws.Brand,
            Status = ws.Status,
            Remarks = ws.Remarks,
            CreatedAt = ws.CreatedAt
        });
        existingWirelessSet.Add(ws.ItemNumber);
        migratedWireless++;
    }

    var existingKitNumbers = await db.Assets
        .Where(x => x.CenterId == center.Id && x.AssetTypeId == kitAssetType.Id && x.ItemNumber != null)
        .Select(x => x.ItemNumber!)
        .ToListAsync();
    var existingKitSet = new HashSet<string>(existingKitNumbers, StringComparer.OrdinalIgnoreCase);
    var legacyKits = await db.Kits.ToListAsync();
    var migratedKits = 0;
    foreach (var k in legacyKits)
    {
        if (string.IsNullOrWhiteSpace(k.ItemNumber) || existingKitSet.Contains(k.ItemNumber)) continue;
        db.Assets.Add(new Asset
        {
            CenterId = center.Id,
            AssetTypeId = kitAssetType.Id,
            ItemNumber = k.ItemNumber,
            Brand = "Kenwood",
            Status = k.Status,
            Remarks = k.Remarks,
            CreatedAt = k.CreatedAt
        });
        existingKitSet.Add(k.ItemNumber);
        migratedKits++;
    }
    if (migratedWireless > 0 || migratedKits > 0)
    {
        await db.SaveChangesAsync();
    }

    // Backfill legacy chargers into unified assets.
    var chargerAssetType = await db.AssetTypes.FirstOrDefaultAsync(x => x.CenterId == center.Id && x.Code == "charger");
    if (chargerAssetType == null)
    {
        chargerAssetType = new AssetType { CenterId = center.Id, Code = "charger", Name = "Charger", TrackingMode = "Individual" };
        db.AssetTypes.Add(chargerAssetType);
        await db.SaveChangesAsync();
    }

    var existingChargerNumbers = await db.Assets
        .Where(x => x.CenterId == center.Id && x.AssetTypeId == chargerAssetType.Id && x.ItemNumber != null)
        .Select(x => x.ItemNumber!)
        .ToListAsync();
    var existingChargerSet = new HashSet<string>(existingChargerNumbers, StringComparer.OrdinalIgnoreCase);
    var legacyChargers = await db.Chargers.ToListAsync();
    var migratedChargers = 0;
    foreach (var c in legacyChargers)
    {
        if (string.IsNullOrWhiteSpace(c.ItemNumber) || existingChargerSet.Contains(c.ItemNumber)) continue;
        db.Assets.Add(new Asset
        {
            CenterId = center.Id,
            AssetTypeId = chargerAssetType.Id,
            ItemNumber = c.ItemNumber,
            Brand = c.Brand,
            Status = c.Status,
            Remarks = c.Remarks,
            CreatedAt = c.CreatedAt
        });
        existingChargerSet.Add(c.ItemNumber);
        migratedChargers++;
    }
    if (migratedChargers > 0) await db.SaveChangesAsync();

    // Backfill IssueItems.AssetId from legacy WirelessSet/Charger/Kit references.
    // Build asset lookup maps (O(1) per item) to avoid N+1 queries.
    var wirelessAssetMap = await db.Assets
        .Where(a => a.CenterId == center.Id && a.AssetTypeId == wirelessAssetType.Id && a.ItemNumber != null)
        .Select(a => new { a.Id, Number = a.ItemNumber! })
        .ToDictionaryAsync(a => a.Number.ToLowerInvariant(), a => a.Id);
    var kitAssetMap = await db.Assets
        .Where(a => a.CenterId == center.Id && a.AssetTypeId == kitAssetType.Id && a.ItemNumber != null)
        .Select(a => new { a.Id, Number = a.ItemNumber! })
        .ToDictionaryAsync(a => a.Number.ToLowerInvariant(), a => a.Id);
    var chargerAssetMap = await db.Assets
        .Where(a => a.CenterId == center.Id && a.AssetTypeId == chargerAssetType.Id && a.ItemNumber != null)
        .Select(a => new { a.Id, Number = a.ItemNumber! })
        .ToDictionaryAsync(a => a.Number.ToLowerInvariant(), a => a.Id);

    var itemsToLink = await db.IssueItems
        .Where(ii => ii.AssetId == null && (ii.WirelessSetId != null || ii.KitId != null || ii.ChargerId != null))
        .Include(ii => ii.WirelessSet)
        .Include(ii => ii.Kit)
        .Include(ii => ii.Charger)
        .ToListAsync();

    var linkedCount = 0;
    foreach (var ii in itemsToLink)
    {
        if (ii.WirelessSetId != null && ii.WirelessSet?.ItemNumber != null &&
            wirelessAssetMap.TryGetValue(ii.WirelessSet.ItemNumber.ToLowerInvariant(), out var wid))
        {
            ii.AssetId = wid;
            ii.ItemType = "Asset";
            linkedCount++;
        }
        else if (ii.KitId != null && ii.Kit?.ItemNumber != null &&
                 kitAssetMap.TryGetValue(ii.Kit.ItemNumber.ToLowerInvariant(), out var kid))
        {
            ii.AssetId = kid;
            ii.ItemType = "Asset";
            linkedCount++;
        }
        else if (ii.ChargerId != null && ii.Charger?.ItemNumber != null &&
                 chargerAssetMap.TryGetValue(ii.Charger.ItemNumber.ToLowerInvariant(), out var cid))
        {
            ii.AssetId = cid;
            ii.ItemType = "Asset";
            linkedCount++;
        }
    }
    if (linkedCount > 0) await db.SaveChangesAsync();

    // Sync Asset.Status to match active IssueItems (fixes status drift from legacy issues).
    var activeAssetIds = await db.IssueItems
        .Where(ii => ii.AssetId != null && !ii.IsReturned)
        .Select(ii => ii.AssetId!.Value)
        .Distinct()
        .ToListAsync();
    var assetsToMarkIssued = await db.Assets
        .Where(a => a.CenterId == center.Id && a.Status == "Available" && activeAssetIds.Contains(a.Id))
        .ToListAsync();
    foreach (var a in assetsToMarkIssued) a.Status = "Issued";
    var assetsToMarkAvailable = await db.Assets
        .Where(a => a.CenterId == center.Id && a.Status == "Issued" && !activeAssetIds.Contains(a.Id))
        .ToListAsync();
    foreach (var a in assetsToMarkAvailable) a.Status = "Available";
    if (assetsToMarkIssued.Count > 0 || assetsToMarkAvailable.Count > 0) await db.SaveChangesAsync();

    // Seed default admin user.
    var adminUser = await userMgr.FindByNameAsync("admin");
    if (adminUser == null)
    {
        adminUser = new ApplicationUser
        {
            UserName = "admin",
            Email = "admin@rssb.local",
            FullName = "System Admin",
            Role = "SUPER_ADMIN",
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
