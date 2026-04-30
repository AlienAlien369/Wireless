# Graph Report - D:\Lakshya grover\TRY NEW THINGS\LG  Git projects\Wireless  (2026-04-30)

## Corpus Check
- 88 files · ~77,524 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 426 nodes · 585 edges · 58 communities detected
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 184 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]

## God Nodes (most connected - your core abstractions)
1. `InventoryController` - 15 edges
2. `AssetsController` - 14 edges
3. `TenantsController` - 10 edges
4. `load()` - 9 edges
5. `InchargesController` - 8 edges
6. `IssuesController` - 8 edges
7. `ReportsController` - 8 edges
8. `IssueService` - 8 edges
9. `onDelete()` - 8 edges
10. `toastError()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `createType()` --calls--> `toastError()`  [INFERRED]
  D:\Lakshya grover\TRY NEW THINGS\LG  Git projects\Wireless\frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts
- `createAsset()` --calls--> `toastError()`  [INFERRED]
  D:\Lakshya grover\TRY NEW THINGS\LG  Git projects\Wireless\frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts
- `updateType()` --calls--> `toastError()`  [INFERRED]
  D:\Lakshya grover\TRY NEW THINGS\LG  Git projects\Wireless\frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts
- `deleteType()` --calls--> `toastError()`  [INFERRED]
  D:\Lakshya grover\TRY NEW THINGS\LG  Git projects\Wireless\frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts
- `updateAssetDetails()` --calls--> `toastError()`  [INFERRED]
  D:\Lakshya grover\TRY NEW THINGS\LG  Git projects\Wireless\frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (10): BreakagesController, ControllerBase, IIssueService, InchargesController, InventoryController, IssuesController, ProductConfigController, QrCodeHelper (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (20): InitialCreate, RSSBWireless.API.Migrations, AddTenancyAndMenu, RSSBWireless.API.Migrations, AddTenantScopeToOperationalEntities, RSSBWireless.API.Migrations, FixTenantScopeColumns, RSSBWireless.API.Migrations (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (8): loadAssetTypes(), loadAssignment(), save(), AssetsController, IAccessScopeService, submit(), TenantsController, UsersController

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (16): createCenter(), createDepartment(), createRole(), deleteCenter(), deleteDepartment(), deleteRole(), loadCenters(), loadDepartments() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (6): IReportService, download(), downloadBlob(), handleVisitSelect(), loadVisitDetails(), ReportsController

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (9): InitialCreate, RSSBWireless.API.Migrations, AddTenancyAndMenu, RSSBWireless.API.Migrations, AddTenantScopeToOperationalEntities, RSSBWireless.API.Migrations, FixTenantScopeColumns, RSSBWireless.API.Migrations (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.23
Nodes (10): createAsset(), createType(), deleteAsset(), deleteType(), load(), updateAssetDetails(), updateStatus(), updateType() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.19
Nodes (3): IIssueService, IssueService, SmsHelper

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (3): AuthController, EmailHelper, JwtHelper

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (11): Breakage, Charger, Collector, Incharge, Issue, IssueItem, Kit, Photo (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (10): BreakageCreateDto, BreakageDto, CollectorCreateDto, DashboardStatsDto, IssueCreateDto, IssueItemDto, IssueItemResponseDto, IssueResponseDto (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (3): AccessScope, AccessScopeService, IAccessScopeService

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (7): AssetVisibilityRuleConfig, BrandingConfig, DashboardWidgetConfig, FeatureFlagsConfig, ProductConfigSnapshot, RoleDefaultConfig, SmsConfig

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (2): IReportService, ReportService

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 16 - "Community 16"
Cohesion: 0.47
Nodes (4): formatDate(), formatDateTime(), statusBadge(), statusColor()

### Community 17 - "Community 17"
Cohesion: 0.4
Nodes (1): CloudinaryHelper

### Community 18 - "Community 18"
Cohesion: 0.4
Nodes (3): AppDbContextModelSnapshot, RSSBWireless.API.Migrations, ModelSnapshot

### Community 19 - "Community 19"
Cohesion: 0.4
Nodes (4): AssetStatus, AssetTypeCodes, IssueStatus, Roles

### Community 20 - "Community 20"
Cohesion: 0.4
Nodes (4): Center, Department, MenuPage, MenuPagePermission

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (2): AppDbContext, IdentityDbContext

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (1): ExceptionHandlingMiddleware

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 0.83
Nodes (3): getActiveVisits(), getLatestActiveVisit(), getLatestVisit()

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (1): RequestLoggingMiddleware

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (2): Asset, AssetType

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (2): AppRole, PasswordResetRequest

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (2): IdentityUser, ApplicationUser

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (2): handleKeyDown(), lookup()

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **50 isolated node(s):** `IssueCreateDto`, `IssueItemDto`, `CollectorCreateDto`, `IssueResponseDto`, `IssueItemResponseDto` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 31`** (2 nodes): `SearchDropdown.tsx`, `handleClickOutside()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `logout()`, `AdminLayout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `useAuth.ts`, `useAuthState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `index.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `login.tsx`, `LoginPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `App()`, `_app.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `LegacyBulkIssueRedirect()`, `bulk-issue.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `LegacyBulkReceiveRedirect()`, `bulk-receive.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `incharge-history.tsx`, `getStatusColor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `issue.tsx`, `LegacyIssueRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `notifications.tsx`, `getStatusBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `receive.tsx`, `LegacyReceiveRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `scanner.tsx`, `LegacyScannerRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `index.tsx`, `InchargeDashboard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `cn()`, `cn.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `Program.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `RSSBWireless.API.AssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `RSSBWireless.API.GlobalUsings.g.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `RSSBWireless.API.MvcApplicationPartsAssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `[number].tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `onDelete()` connect `Community 1` to `Community 18`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `AuthController` connect `Community 8` to `Community 0`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `ProductConfigService` connect `Community 3` to `Community 0`, `Community 13`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `load()` (e.g. with `.GetTypes()` and `.GetAssets()`) actually correct?**
  _`load()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `IssueCreateDto`, `IssueItemDto`, `CollectorCreateDto` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._