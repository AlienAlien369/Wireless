namespace RSSBWireless.API.Data;

using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RSSBWireless.API.Models;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Visit> Visits => Set<Visit>();
    public DbSet<Incharge> Incharges => Set<Incharge>();
    public DbSet<WirelessSet> WirelessSets => Set<WirelessSet>();
    public DbSet<Charger> Chargers => Set<Charger>();
    public DbSet<Kit> Kits => Set<Kit>();
    public DbSet<Issue> Issues => Set<Issue>();
    public DbSet<IssueItem> IssueItems => Set<IssueItem>();
    public DbSet<Breakage> Breakages => Set<Breakage>();
    public DbSet<Collector> Collectors => Set<Collector>();
    public DbSet<Photo> Photos => Set<Photo>();
    public DbSet<SmsLog> SmsLogs => Set<SmsLog>();

    public DbSet<Center> Centers => Set<Center>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<MenuPage> MenuPages => Set<MenuPage>();
    public DbSet<MenuPagePermission> MenuPagePermissions => Set<MenuPagePermission>();
    public DbSet<AppRole> AppRoles => Set<AppRole>();
    public DbSet<PasswordResetRequest> PasswordResetRequests => Set<PasswordResetRequest>();

    public DbSet<AssetType> AssetTypes => Set<AssetType>();
    public DbSet<Asset> Assets => Set<Asset>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(e =>
        {
            e.HasOne(x => x.Center).WithMany().HasForeignKey(x => x.CenterId).IsRequired(false);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).IsRequired(false);
            e.HasIndex(x => x.CenterId);
            e.HasIndex(x => x.DepartmentId);
        });

        builder.Entity<Center>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.Name).IsUnique();
        });

        builder.Entity<Department>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.HasOne(x => x.Center).WithMany(c => c.Departments).HasForeignKey(x => x.CenterId);
            e.HasIndex(x => new { x.CenterId, x.Name }).IsUnique();
        });

        builder.Entity<MenuPage>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).IsRequired().HasMaxLength(100);
            e.Property(x => x.Label).IsRequired().HasMaxLength(200);
            e.Property(x => x.Path).IsRequired().HasMaxLength(200);
            e.Property(x => x.Icon).IsRequired().HasMaxLength(100);
            e.Property(x => x.Audience).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Code).IsUnique();
            e.HasIndex(x => x.Path).IsUnique();
        });

        builder.Entity<MenuPagePermission>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Role).IsRequired().HasMaxLength(50);
            e.HasOne(x => x.Center).WithMany(c => c.MenuPagePermissions).HasForeignKey(x => x.CenterId);
            e.HasOne(x => x.Department).WithMany(d => d.MenuPagePermissions).HasForeignKey(x => x.DepartmentId).IsRequired(false);
            e.HasOne(x => x.MenuPage).WithMany(p => p.Permissions).HasForeignKey(x => x.MenuPageId);
            e.HasIndex(x => new { x.CenterId, x.DepartmentId, x.Role, x.MenuPageId }).IsUnique();
        });

        builder.Entity<AppRole>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.Property(x => x.Audience).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Name).IsUnique();
        });

        builder.Entity<PasswordResetRequest>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UserId).IsRequired();
            e.Property(x => x.OtpSalt).IsRequired().HasMaxLength(100);
            e.Property(x => x.OtpHash).IsRequired().HasMaxLength(200);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.CreatedAt);
        });

        builder.Entity<AssetType>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).IsRequired().HasMaxLength(60);
            e.Property(x => x.Name).IsRequired().HasMaxLength(120);
            e.Property(x => x.TrackingMode).IsRequired().HasMaxLength(20);
            e.HasOne(x => x.Center).WithMany().HasForeignKey(x => x.CenterId);
            e.HasIndex(x => new { x.CenterId, x.Code }).IsUnique();
        });

        builder.Entity<Asset>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).IsRequired().HasMaxLength(20);
            e.HasOne(x => x.Center).WithMany().HasForeignKey(x => x.CenterId);
            e.HasOne(x => x.AssetType).WithMany(t => t.Assets).HasForeignKey(x => x.AssetTypeId);
            e.HasIndex(x => new { x.CenterId, x.AssetTypeId, x.ItemNumber }).IsUnique();
            e.HasIndex(x => x.Status);
        });

        builder.Entity<Visit>(e => {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.HasOne(x => x.Center).WithMany().HasForeignKey(x => x.CenterId).IsRequired(false);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).IsRequired(false);
            e.HasIndex(x => x.CenterId);
            e.HasIndex(x => x.DepartmentId);
        });

        builder.Entity<Incharge>(e => {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.BadgeNumber).IsUnique();
            e.HasOne(x => x.Center).WithMany().HasForeignKey(x => x.CenterId).IsRequired(false);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).IsRequired(false);
            e.HasIndex(x => x.CenterId);
            e.HasIndex(x => x.DepartmentId);
        });

        builder.Entity<WirelessSet>(e => {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ItemNumber).IsUnique();
        });

        builder.Entity<Issue>(e => {
            e.HasOne(x => x.Visit).WithMany(v => v.Issues).HasForeignKey(x => x.VisitId);
            e.HasOne(x => x.Incharge).WithMany(i => i.Issues).HasForeignKey(x => x.InchargeId);
            e.HasOne(x => x.Collector).WithMany(c => c.Issues).HasForeignKey(x => x.CollectorId).IsRequired(false);
            e.HasOne(x => x.Center).WithMany().HasForeignKey(x => x.CenterId).IsRequired(false);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).IsRequired(false);
            e.HasIndex(x => x.CenterId);
            e.HasIndex(x => x.DepartmentId);
        });

        builder.Entity<IssueItem>(e => {
            e.HasOne(x => x.Issue).WithMany(i => i.Items).HasForeignKey(x => x.IssueId);
            e.HasOne(x => x.WirelessSet).WithMany(w => w.IssueItems).HasForeignKey(x => x.WirelessSetId).IsRequired(false);
            e.HasOne(x => x.Charger).WithMany(c => c.IssueItems).HasForeignKey(x => x.ChargerId).IsRequired(false);
            e.HasOne(x => x.Kit).WithMany(k => k.IssueItems).HasForeignKey(x => x.KitId).IsRequired(false);
            e.HasOne(x => x.Asset).WithMany(a => a.IssueItems).HasForeignKey(x => x.AssetId).IsRequired(false);
        });

        builder.Entity<Breakage>(e => {
            e.HasOne(x => x.Visit).WithMany(v => v.Breakages).HasForeignKey(x => x.VisitId);
            e.HasOne(x => x.WirelessSet).WithMany(w => w.Breakages).HasForeignKey(x => x.WirelessSetId).IsRequired(false);
        });

        builder.Entity<Photo>(e => {
            e.HasOne(x => x.Issue).WithMany(i => i.Photos).HasForeignKey(x => x.IssueId);
        });

        builder.Entity<SmsLog>(e => {
            e.HasOne(x => x.Issue).WithMany(i => i.SmsLogs).HasForeignKey(x => x.IssueId);
        });
    }
}
