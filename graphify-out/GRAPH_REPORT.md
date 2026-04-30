# Graph Report - .  (2026-04-30)

## Corpus Check
- 92 files · ~50,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 421 nodes · 580 edges · 55 communities detected
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 184 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Asset Management Core|Asset Management Core]]
- [[_COMMUNITY_Authentication & JWT|Authentication & JWT]]
- [[_COMMUNITY_React Query Hooks|React Query Hooks]]
- [[_COMMUNITY_TypeScript Types|TypeScript Types]]
- [[_COMMUNITY_Issue Service|Issue Service]]
- [[_COMMUNITY_Report Service|Report Service]]
- [[_COMMUNITY_Dashboard Components|Dashboard Components]]
- [[_COMMUNITY_Tenant & Menu System|Tenant & Menu System]]
- [[_COMMUNITY_Middleware Pipeline|Middleware Pipeline]]
- [[_COMMUNITY_EF Core Data Layer|EF Core Data Layer]]
- [[_COMMUNITY_Service Interfaces|Service Interfaces]]
- [[_COMMUNITY_Constants & Enums|Constants & Enums]]
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Error Handling|Error Handling]]
- [[_COMMUNITY_Rate Limiting|Rate Limiting]]
- [[_COMMUNITY_Health Checks|Health Checks]]
- [[_COMMUNITY_Visit Management|Visit Management]]
- [[_COMMUNITY_Sewadaar Management|Sewadaar Management]]
- [[_COMMUNITY_Breakage Tracking|Breakage Tracking]]
- [[_COMMUNITY_Product Config|Product Config]]
- [[_COMMUNITY_Admin Layout|Admin Layout]]
- [[_COMMUNITY_Issue Assets Page|Issue Assets Page]]
- [[_COMMUNITY_Receive Assets Page|Receive Assets Page]]
- [[_COMMUNITY_Assets Page|Assets Page]]
- [[_COMMUNITY_Access Scope Service|Access Scope Service]]
- [[_COMMUNITY_Photo & QR Code|Photo & QR Code]]
- [[_COMMUNITY_SMS Notifications|SMS Notifications]]
- [[_COMMUNITY_User Management|User Management]]
- [[_COMMUNITY_Role Management|Role Management]]
- [[_COMMUNITY_ExcelPDF Reports|Excel/PDF Reports]]
- [[_COMMUNITY_Response Compression|Response Compression]]
- [[_COMMUNITY_Inventory Legacy API|Inventory Legacy API]]
- [[_COMMUNITY_Collectors|Collectors]]
- [[_COMMUNITY_Search Dropdown|Search Dropdown]]
- [[_COMMUNITY_Identity Models|Identity Models]]
- [[_COMMUNITY_Domain Models|Domain Models]]
- [[_COMMUNITY_Asset Type Setup|Asset Type Setup]]
- [[_COMMUNITY_Frontend Formatters|Frontend Formatters]]
- [[_COMMUNITY_Migration Scripts|Migration Scripts]]
- [[_COMMUNITY_Error Boundary|Error Boundary]]
- [[_COMMUNITY_CenterDept Filters|Center/Dept Filters]]
- [[_COMMUNITY_Docker Config|Docker Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Tailwind Styles|Tailwind Styles]]
- [[_COMMUNITY_App Entry Points|App Entry Points]]
- [[_COMMUNITY_Password Reset|Password Reset]]
- [[_COMMUNITY_QR Scan Flow|QR Scan Flow]]
- [[_COMMUNITY_LoginAuth Pages|Login/Auth Pages]]
- [[_COMMUNITY_Incharge Portal|Incharge Portal]]
- [[_COMMUNITY_Breakage Controller|Breakage Controller]]
- [[_COMMUNITY_Visits Controller|Visits Controller]]
- [[_COMMUNITY_Issues Controller|Issues Controller]]
- [[_COMMUNITY_Menu Controller|Menu Controller]]
- [[_COMMUNITY_Tenants Controller|Tenants Controller]]
- [[_COMMUNITY_Roles Controller|Roles Controller]]

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
  frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts
- `createAsset()` --calls--> `toastError()`  [INFERRED]
  frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts
- `updateType()` --calls--> `toastError()`  [INFERRED]
  frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts
- `deleteType()` --calls--> `toastError()`  [INFERRED]
  frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts
- `updateAssetDetails()` --calls--> `toastError()`  [INFERRED]
  frontend\pages\admin\assets.tsx → frontend\utils\errorHandler.ts

## Communities

### Community 0 - "Asset Management Core"
Cohesion: 0.06
Nodes (10): BreakagesController, ControllerBase, IIssueService, InchargesController, InventoryController, IssuesController, ProductConfigController, QrCodeHelper (+2 more)

### Community 1 - "Authentication & JWT"
Cohesion: 0.05
Nodes (20): InitialCreate, RSSBWireless.API.Migrations, AddTenancyAndMenu, RSSBWireless.API.Migrations, AddTenantScopeToOperationalEntities, RSSBWireless.API.Migrations, FixTenantScopeColumns, RSSBWireless.API.Migrations (+12 more)

### Community 2 - "React Query Hooks"
Cohesion: 0.08
Nodes (8): loadAssignment(), loadPages(), save(), AssetsController, IAccessScopeService, MenuController, TenantsController, UsersController

### Community 3 - "TypeScript Types"
Cohesion: 0.09
Nodes (19): createCenter(), createDepartment(), createRole(), deleteCenter(), deleteDepartment(), deleteRole(), loadAssetTypes(), loadCenters() (+11 more)

### Community 4 - "Issue Service"
Cohesion: 0.09
Nodes (6): AuthController, EmailHelper, IIssueService, IssueService, JwtHelper, SmsHelper

### Community 5 - "Report Service"
Cohesion: 0.13
Nodes (6): IReportService, download(), downloadBlob(), handleVisitSelect(), loadVisitDetails(), ReportsController

### Community 6 - "Dashboard Components"
Cohesion: 0.1
Nodes (9): InitialCreate, RSSBWireless.API.Migrations, AddTenancyAndMenu, RSSBWireless.API.Migrations, AddTenantScopeToOperationalEntities, RSSBWireless.API.Migrations, FixTenantScopeColumns, RSSBWireless.API.Migrations (+1 more)

### Community 7 - "Tenant & Menu System"
Cohesion: 0.29
Nodes (10): createAsset(), createType(), deleteAsset(), deleteType(), load(), updateAssetDetails(), updateStatus(), updateType() (+2 more)

### Community 8 - "Middleware Pipeline"
Cohesion: 0.17
Nodes (11): Breakage, Charger, Collector, Incharge, Issue, IssueItem, Kit, Photo (+3 more)

### Community 9 - "EF Core Data Layer"
Cohesion: 0.18
Nodes (10): BreakageCreateDto, BreakageDto, CollectorCreateDto, DashboardStatsDto, IssueCreateDto, IssueItemDto, IssueItemResponseDto, IssueResponseDto (+2 more)

### Community 10 - "Service Interfaces"
Cohesion: 0.2
Nodes (0): 

### Community 11 - "Constants & Enums"
Cohesion: 0.29
Nodes (3): AccessScope, AccessScopeService, IAccessScopeService

### Community 12 - "Frontend API Client"
Cohesion: 0.25
Nodes (7): AssetVisibilityRuleConfig, BrandingConfig, DashboardWidgetConfig, FeatureFlagsConfig, ProductConfigSnapshot, RoleDefaultConfig, SmsConfig

### Community 13 - "Error Handling"
Cohesion: 0.29
Nodes (2): IReportService, ReportService

### Community 14 - "Rate Limiting"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 15 - "Health Checks"
Cohesion: 0.47
Nodes (4): formatDate(), formatDateTime(), statusBadge(), statusColor()

### Community 16 - "Visit Management"
Cohesion: 0.4
Nodes (1): CloudinaryHelper

### Community 17 - "Sewadaar Management"
Cohesion: 0.4
Nodes (4): AssetStatus, AssetTypeCodes, IssueStatus, Roles

### Community 18 - "Breakage Tracking"
Cohesion: 0.4
Nodes (4): Center, Department, MenuPage, MenuPagePermission

### Community 19 - "Product Config"
Cohesion: 0.5
Nodes (2): AppDbContext, IdentityDbContext

### Community 20 - "Admin Layout"
Cohesion: 0.67
Nodes (1): ExceptionHandlingMiddleware

### Community 21 - "Issue Assets Page"
Cohesion: 0.5
Nodes (0): 

### Community 22 - "Receive Assets Page"
Cohesion: 0.83
Nodes (3): getActiveVisits(), getLatestActiveVisit(), getLatestVisit()

### Community 23 - "Assets Page"
Cohesion: 0.67
Nodes (1): RequestLoggingMiddleware

### Community 24 - "Access Scope Service"
Cohesion: 0.67
Nodes (2): Asset, AssetType

### Community 25 - "Photo & QR Code"
Cohesion: 0.67
Nodes (2): AppRole, PasswordResetRequest

### Community 26 - "SMS Notifications"
Cohesion: 0.67
Nodes (2): IdentityUser, ApplicationUser

### Community 27 - "User Management"
Cohesion: 0.67
Nodes (0): 

### Community 28 - "Role Management"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Excel/PDF Reports"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Response Compression"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Inventory Legacy API"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Collectors"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Search Dropdown"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Identity Models"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Domain Models"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Asset Type Setup"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Frontend Formatters"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Migration Scripts"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Error Boundary"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Center/Dept Filters"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Docker Config"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Tailwind Styles"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "App Entry Points"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Password Reset"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "QR Scan Flow"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Login/Auth Pages"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Incharge Portal"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Breakage Controller"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Visits Controller"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Issues Controller"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Menu Controller"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Tenants Controller"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Roles Controller"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **50 isolated node(s):** `IssueCreateDto`, `IssueItemDto`, `CollectorCreateDto`, `IssueResponseDto`, `IssueItemResponseDto` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Role Management`** (2 nodes): `SearchDropdown.tsx`, `handleClickOutside()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Excel/PDF Reports`** (2 nodes): `logout()`, `AdminLayout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Response Compression`** (2 nodes): `useAuth.ts`, `useAuthState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Inventory Legacy API`** (2 nodes): `index.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Collectors`** (2 nodes): `login.tsx`, `LoginPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Search Dropdown`** (2 nodes): `App()`, `_app.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Identity Models`** (2 nodes): `LegacyBulkIssueRedirect()`, `bulk-issue.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domain Models`** (2 nodes): `LegacyBulkReceiveRedirect()`, `bulk-receive.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Asset Type Setup`** (2 nodes): `incharge-history.tsx`, `getStatusColor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Formatters`** (2 nodes): `issue.tsx`, `LegacyIssueRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Migration Scripts`** (2 nodes): `notifications.tsx`, `getStatusBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Error Boundary`** (2 nodes): `receive.tsx`, `LegacyReceiveRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Center/Dept Filters`** (2 nodes): `scanner.tsx`, `LegacyScannerRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Docker Config`** (2 nodes): `index.tsx`, `InchargeDashboard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (2 nodes): `cn()`, `cn.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Styles`** (1 nodes): `Program.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Entry Points`** (1 nodes): `RSSBWireless.API.AssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Password Reset`** (1 nodes): `RSSBWireless.API.GlobalUsings.g.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `QR Scan Flow`** (1 nodes): `RSSBWireless.API.MvcApplicationPartsAssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Login/Auth Pages`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Incharge Portal`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Breakage Controller`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Visits Controller`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Issues Controller`** (1 nodes): `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Menu Controller`** (1 nodes): `[number].tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tenants Controller`** (1 nodes): `api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Roles Controller`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `onDelete()` connect `Authentication & JWT` to `TypeScript Types`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `AuthController` connect `Issue Service` to `Asset Management Core`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `ReportsController` connect `Report Service` to `Asset Management Core`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `load()` (e.g. with `.GetTypes()` and `.GetAssets()`) actually correct?**
  _`load()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `IssueCreateDto`, `IssueItemDto`, `CollectorCreateDto` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Asset Management Core` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Authentication & JWT` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._