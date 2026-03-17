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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Visit>(e => {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
        });

        builder.Entity<Incharge>(e => {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.BadgeNumber).IsUnique();
        });

        builder.Entity<WirelessSet>(e => {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ItemNumber).IsUnique();
        });

        builder.Entity<Issue>(e => {
            e.HasOne(x => x.Visit).WithMany(v => v.Issues).HasForeignKey(x => x.VisitId);
            e.HasOne(x => x.Incharge).WithMany(i => i.Issues).HasForeignKey(x => x.InchargeId);
            e.HasOne(x => x.Collector).WithMany(c => c.Issues).HasForeignKey(x => x.CollectorId).IsRequired(false);
        });

        builder.Entity<IssueItem>(e => {
            e.HasOne(x => x.Issue).WithMany(i => i.Items).HasForeignKey(x => x.IssueId);
            e.HasOne(x => x.WirelessSet).WithMany(w => w.IssueItems).HasForeignKey(x => x.WirelessSetId).IsRequired(false);
            e.HasOne(x => x.Charger).WithMany(c => c.IssueItems).HasForeignKey(x => x.ChargerId).IsRequired(false);
            e.HasOne(x => x.Kit).WithMany(k => k.IssueItems).HasForeignKey(x => x.KitId).IsRequired(false);
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
