namespace RSSBWireless.API.Models;

public class Center
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Department> Departments { get; set; } = new List<Department>();
    public ICollection<MenuPagePermission> MenuPagePermissions { get; set; } = new List<MenuPagePermission>();
}

public class Department
{
    public int Id { get; set; }
    public int CenterId { get; set; }
    public Center Center { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MenuPagePermission> MenuPagePermissions { get; set; } = new List<MenuPagePermission>();
}

public class MenuPage
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty; // stable key, e.g. "admin.dashboard"
    public string Label { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty; // lucide icon name, e.g. "LayoutDashboard"
    public string Audience { get; set; } = "Admin"; // Admin | Incharge
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MenuPagePermission> Permissions { get; set; } = new List<MenuPagePermission>();
}

public class MenuPagePermission
{
    public int Id { get; set; }

    public int CenterId { get; set; }
    public Center Center { get; set; } = null!;

    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string Role { get; set; } = string.Empty; // Admin | Incharge

    public int MenuPageId { get; set; }
    public MenuPage MenuPage { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

