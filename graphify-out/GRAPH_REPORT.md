# Graph Report - .  (2026-04-29)

## Corpus Check
- Corpus is ~43,448 words - fits in a single context window. You may not need a graph.

## Summary
- 390 nodes · 559 edges · 47 communities detected
- Extraction: 67% EXTRACTED · 33% INFERRED · 0% AMBIGUOUS · INFERRED: 183 edges (avg confidence: 0.8)
- Token cost: 1,800 input · 2,200 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Access Control & Pages|Access Control & Pages]]
- [[_COMMUNITY_Admin CRUD Operations|Admin CRUD Operations]]
- [[_COMMUNITY_Asset Management API|Asset Management API]]
- [[_COMMUNITY_Infrastructure & Dependencies|Infrastructure & Dependencies]]
- [[_COMMUNITY_Issue & Media Handling|Issue & Media Handling]]
- [[_COMMUNITY_EF Core Migration Designers|EF Core Migration Designers]]
- [[_COMMUNITY_Report Generation|Report Generation]]
- [[_COMMUNITY_Database Migrations|Database Migrations]]
- [[_COMMUNITY_Authentication|Authentication]]
- [[_COMMUNITY_Core Domain Models|Core Domain Models]]
- [[_COMMUNITY_Data Transfer Objects|Data Transfer Objects]]
- [[_COMMUNITY_Asset CRUD UI|Asset CRUD UI]]
- [[_COMMUNITY_Product Configuration|Product Configuration]]
- [[_COMMUNITY_Tenant & Menu Models|Tenant & Menu Models]]
- [[_COMMUNITY_Database Context|Database Context]]
- [[_COMMUNITY_Admin Dashboard UI|Admin Dashboard UI]]
- [[_COMMUNITY_Visit Utilities|Visit Utilities]]
- [[_COMMUNITY_Asset Models|Asset Models]]
- [[_COMMUNITY_Security Models|Security Models]]
- [[_COMMUNITY_User Identity|User Identity]]
- [[_COMMUNITY_Bulk Entry UI|Bulk Entry UI]]
- [[_COMMUNITY_Search UI|Search UI]]
- [[_COMMUNITY_Admin Layout|Admin Layout]]
- [[_COMMUNITY_Auth Hook|Auth Hook]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Login Page|Login Page]]
- [[_COMMUNITY_App Entry|App Entry]]
- [[_COMMUNITY_Bulk Issue Page|Bulk Issue Page]]
- [[_COMMUNITY_Bulk Receive Page|Bulk Receive Page]]
- [[_COMMUNITY_Incharge History|Incharge History]]
- [[_COMMUNITY_Issue Redirect|Issue Redirect]]
- [[_COMMUNITY_Notifications Page|Notifications Page]]
- [[_COMMUNITY_Receive Redirect|Receive Redirect]]
- [[_COMMUNITY_QR Scanner Page|QR Scanner Page]]
- [[_COMMUNITY_Incharge Dashboard|Incharge Dashboard]]
- [[_COMMUNITY_CSS Utilities|CSS Utilities]]
- [[_COMMUNITY_App Bootstrap|App Bootstrap]]
- [[_COMMUNITY_Build Artifacts|Build Artifacts]]
- [[_COMMUNITY_Build Artifacts|Build Artifacts]]
- [[_COMMUNITY_Build Artifacts|Build Artifacts]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_API Config|API Config]]
- [[_COMMUNITY_Public Set Lookup|Public Set Lookup]]
- [[_COMMUNITY_API Service|API Service]]

## God Nodes (most connected - your core abstractions)
1. `InventoryController` - 15 edges
2. `AssetsController` - 14 edges
3. `RSSB Wireless Management System` - 13 edges
4. `Backend (ASP.NET Core 8 Web API)` - 11 edges
5. `TenantsController` - 10 edges
6. `load()` - 9 edges
7. `InchargesController` - 8 edges
8. `IssuesController` - 8 edges
9. `ReportsController` - 8 edges
10. `onDelete()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Graphify Knowledge Graph Rules` --rationale_for--> `RSSB Wireless Management System`  [EXTRACTED]
  CLAUDE.md → README.md
- `Backend (ASP.NET Core 8 Web API)` --implements--> `RSSBWireless.API Assembly`  [INFERRED]
  README.md → backend\obj\Debug\net8.0\RSSBWireless.API.csproj.FileListAbsolute.txt
- `Npgsql (PostgreSQL .NET Driver)` --conceptually_related_to--> `PostgreSQL Database`  [INFERRED]
  backend\obj\Debug\net8.0\RSSBWireless.API.csproj.FileListAbsolute.txt → README.md
- `BCrypt.Net (Password Hashing)` --conceptually_related_to--> `JWT Authentication`  [INFERRED]
  backend\obj\Debug\net8.0\RSSBWireless.API.csproj.FileListAbsolute.txt → README.md

## Hyperedges (group relationships)
- **Backend Data Layer: ASP.NET Core + EF Core + PostgreSQL + Npgsql** — readme_backend, readme_entity_framework, readme_postgresql, filelist_npgsql [INFERRED 0.90]
- **Report Generation Stack: Reports Module + EPPlus + iText7** — readme_reports_module, readme_epplus, readme_itext7 [EXTRACTED 1.00]
- **Wireless Brand Inventory: Kenwood + Vertel + Aspera in Inventory Module** — readme_inventory_module, readme_kenwood, readme_vertel, readme_aspera [EXTRACTED 1.00]

## Communities

### Community 0 - "Access Control & Pages"
Cohesion: 0.06
Nodes (11): loadPages(), AccessScope, AccessScopeService, BreakagesController, ControllerBase, InchargesController, InventoryController, MenuController (+3 more)

### Community 1 - "Admin CRUD Operations"
Cohesion: 0.07
Nodes (25): createCenter(), createDepartment(), createRole(), deleteCenter(), deleteDepartment(), deleteRole(), loadAssignment(), loadCenters() (+17 more)

### Community 2 - "Asset Management API"
Cohesion: 0.1
Nodes (5): loadAssetTypes(), AssetsController, submit(), QrCodeHelper, TenantsController

### Community 3 - "Infrastructure & Dependencies"
Cohesion: 0.09
Nodes (29): Graphify Knowledge Graph Rules, AutoMapper, BCrypt.Net (Password Hashing), Npgsql (PostgreSQL .NET Driver), RSSBWireless.API Assembly, Swashbuckle / Swagger UI, Admin Dashboard, Aspera Wireless Brand (+21 more)

### Community 4 - "Issue & Media Handling"
Cohesion: 0.09
Nodes (5): CloudinaryHelper, IssuesController, IssueService, receive(), SmsHelper

### Community 5 - "EF Core Migration Designers"
Cohesion: 0.08
Nodes (14): InitialCreate, RSSBWireless.API.Migrations, AddTenancyAndMenu, RSSBWireless.API.Migrations, AddTenantScopeToOperationalEntities, RSSBWireless.API.Migrations, FixTenantScopeColumns, RSSBWireless.API.Migrations (+6 more)

### Community 6 - "Report Generation"
Cohesion: 0.13
Nodes (6): download(), downloadBlob(), handleVisitSelect(), loadVisitDetails(), ReportsController, ReportService

### Community 7 - "Database Migrations"
Cohesion: 0.1
Nodes (9): InitialCreate, RSSBWireless.API.Migrations, AddTenancyAndMenu, RSSBWireless.API.Migrations, AddTenantScopeToOperationalEntities, RSSBWireless.API.Migrations, FixTenantScopeColumns, RSSBWireless.API.Migrations (+1 more)

### Community 8 - "Authentication"
Cohesion: 0.18
Nodes (3): AuthController, EmailHelper, JwtHelper

### Community 9 - "Core Domain Models"
Cohesion: 0.17
Nodes (11): Breakage, Charger, Collector, Incharge, Issue, IssueItem, Kit, Photo (+3 more)

### Community 10 - "Data Transfer Objects"
Cohesion: 0.18
Nodes (10): BreakageCreateDto, BreakageDto, CollectorCreateDto, DashboardStatsDto, IssueCreateDto, IssueItemDto, IssueItemResponseDto, IssueResponseDto (+2 more)

### Community 11 - "Asset CRUD UI"
Cohesion: 0.36
Nodes (8): createAsset(), createType(), deleteAsset(), deleteType(), load(), updateAssetDetails(), updateStatus(), updateType()

### Community 12 - "Product Configuration"
Cohesion: 0.25
Nodes (7): AssetVisibilityRuleConfig, BrandingConfig, DashboardWidgetConfig, FeatureFlagsConfig, ProductConfigSnapshot, RoleDefaultConfig, SmsConfig

### Community 13 - "Tenant & Menu Models"
Cohesion: 0.4
Nodes (4): Center, Department, MenuPage, MenuPagePermission

### Community 14 - "Database Context"
Cohesion: 0.5
Nodes (2): AppDbContext, IdentityDbContext

### Community 15 - "Admin Dashboard UI"
Cohesion: 0.5
Nodes (0): 

### Community 16 - "Visit Utilities"
Cohesion: 0.83
Nodes (3): getActiveVisits(), getLatestActiveVisit(), getLatestVisit()

### Community 17 - "Asset Models"
Cohesion: 0.67
Nodes (2): Asset, AssetType

### Community 18 - "Security Models"
Cohesion: 0.67
Nodes (2): AppRole, PasswordResetRequest

### Community 19 - "User Identity"
Cohesion: 0.67
Nodes (2): IdentityUser, ApplicationUser

### Community 20 - "Bulk Entry UI"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Search UI"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Admin Layout"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Auth Hook"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Home Page"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Login Page"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "App Entry"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Bulk Issue Page"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Bulk Receive Page"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Incharge History"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Issue Redirect"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Notifications Page"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Receive Redirect"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "QR Scanner Page"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Incharge Dashboard"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "CSS Utilities"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "App Bootstrap"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Build Artifacts"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Build Artifacts"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Build Artifacts"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "PostCSS Config"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "API Config"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Public Set Lookup"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "API Service"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **58 isolated node(s):** `IssueCreateDto`, `IssueItemDto`, `CollectorCreateDto`, `IssueResponseDto`, `IssueItemResponseDto` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Search UI`** (2 nodes): `SearchDropdown.tsx`, `handleClickOutside()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Layout`** (2 nodes): `logout()`, `AdminLayout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Hook`** (2 nodes): `useAuth.ts`, `useAuthState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Home Page`** (2 nodes): `index.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Login Page`** (2 nodes): `login.tsx`, `LoginPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Entry`** (2 nodes): `App()`, `_app.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bulk Issue Page`** (2 nodes): `LegacyBulkIssueRedirect()`, `bulk-issue.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bulk Receive Page`** (2 nodes): `LegacyBulkReceiveRedirect()`, `bulk-receive.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Incharge History`** (2 nodes): `incharge-history.tsx`, `getStatusColor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Issue Redirect`** (2 nodes): `issue.tsx`, `LegacyIssueRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Notifications Page`** (2 nodes): `notifications.tsx`, `getStatusBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Receive Redirect`** (2 nodes): `receive.tsx`, `LegacyReceiveRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `QR Scanner Page`** (2 nodes): `scanner.tsx`, `LegacyScannerRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Incharge Dashboard`** (2 nodes): `index.tsx`, `InchargeDashboard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CSS Utilities`** (2 nodes): `cn()`, `cn.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Bootstrap`** (1 nodes): `Program.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Artifacts`** (1 nodes): `RSSBWireless.API.AssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Artifacts`** (1 nodes): `RSSBWireless.API.GlobalUsings.g.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Artifacts`** (1 nodes): `RSSBWireless.API.MvcApplicationPartsAssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Config`** (1 nodes): `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Public Set Lookup`** (1 nodes): `[number].tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Service`** (1 nodes): `api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `onDelete()` connect `EF Core Migration Designers` to `Admin CRUD Operations`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `AuthController` connect `Authentication` to `Access Control & Pages`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `ProductConfigService` connect `Admin CRUD Operations` to `Access Control & Pages`, `Product Configuration`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `IssueCreateDto`, `IssueItemDto`, `CollectorCreateDto` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Access Control & Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Admin CRUD Operations` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Asset Management API` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._