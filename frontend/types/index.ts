// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  username: string
  role: string
  audience: string
  fullName: string
  token: string
  centerId?: number | null
  centerName?: string | null
  departmentId?: number | null
  departmentName?: string | null
}

// ─── Tenancy ──────────────────────────────────────────────────────────────────
export interface Center {
  id: number
  name: string
  isActive: boolean
}

export interface Department {
  id: number
  centerId: number
  name: string
  isActive: boolean
}

// ─── Assets ───────────────────────────────────────────────────────────────────
export interface AssetType {
  id: number
  centerId: number
  code: string
  name: string
  trackingMode: 'Individual' | 'Group'
  isActive: boolean
}

export interface Asset {
  id: number
  centerId: number
  assetTypeId: number
  assetTypeCode: string
  assetTypeName: string
  itemNumber: string | null
  brand: string | null
  status: 'Available' | 'Issued' | 'Broken'
  remarks: string | null
}

// ─── Visits ───────────────────────────────────────────────────────────────────
export interface Visit {
  id: number
  name: string
  location: string
  visitDate: string
  remarks: string | null
  isActive: boolean
  createdAt: string
  centerId?: number | null
  departmentId?: number | null
}

// ─── Sewadaars ────────────────────────────────────────────────────────────────
export interface Sewadaar {
  id: number
  name: string
  badgeNumber: string
  mobileNumber: string
  groupName: string | null
  isActive: boolean
  centerId?: number | null
  departmentId?: number | null
}

// ─── Issues ───────────────────────────────────────────────────────────────────
export interface IssueItemResponse {
  id: number
  itemType: string
  wirelessSetId?: number | null
  chargerId?: number | null
  kitId?: number | null
  assetId?: number | null
  itemNumber: string | null
  brand: string | null
  isReturned: boolean
  returnedAt: string | null
  returnRemarks: string | null
}

export interface CollectorInfo {
  id: number
  name: string
  badgeNumber: string
  phoneNumber: string
}

export interface SmsLogEntry {
  id: number
  mobileNumber: string
  message: string
  status: string
  errorMessage: string | null
  sentAt: string
}

export interface IssueResponse {
  id: number
  visitId: number
  visitName: string
  inchargeId: number
  inchargeName: string
  inchargeBadge: string
  inchargeMobile: string
  isGroupIssue: boolean
  groupName: string | null
  groupSetCount: number | null
  issuedBy: string
  issuedAt: string
  returnedAt: string | null
  status: 'Issued' | 'Returned' | 'Partial'
  remarks: string | null
  collector: CollectorInfo | null
  items: IssueItemResponse[]
  photoUrls: string[]
  smsLogs: SmsLogEntry[]
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalWirelessSets: number
  availableSets: number
  issuedSets: number
  brokenSets: number
  totalIncharges: number
  activeVisits: number
  todayIssues: number
  totalBreakages: number
}

export interface VisitWiseStat {
  visitId: number
  visitName: string
  totalCurrentlyIssued: number
  kenwoodSetsCurrentlyIssued: number
  kenwoodSetsRemaining: number
  vertelSetsCurrentlyIssued: number
  vertelSetsRemaining: number
  asperaSetsCurrentlyIssued: number
  asperaSetsRemaining: number
  kenwoodChargersCurrentlyIssued: number
  kenwoodChargersRemaining: number
  vertelChargersCurrentlyIssued: number
  vertelChargersRemaining: number
  asperaChargersCurrentlyIssued: number
  asperaChargersRemaining: number
  kitsCurrentlyIssued: number
  kitsRemaining: number
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
export interface MenuItem {
  code: string
  label: string
  path: string
  icon: string
  sortOrder: number
}

// ─── App Roles ────────────────────────────────────────────────────────────────
export interface AppRole {
  id: number
  name: string
  audience: 'Admin' | 'Sewadaar'
  isActive: boolean
}

// ─── Users ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string
  username: string
  fullName: string
  role: string
  centerId: number | null
  centerName: string | null
  departmentId: number | null
  departmentName: string | null
  badgeNumber: string | null
  email: string | null
  phoneNumber: string | null
  isActive: boolean
  createdAt: string
}

// ─── Product Config ───────────────────────────────────────────────────────────
export interface DashboardWidget {
  key: string
  label: string
  enabled: boolean
}

export interface ProductConfig {
  branding: { appName: string; defaultCenterName: string }
  sms: { issueEnabled: boolean; receiveEnabled: boolean }
  featureFlags: { unifiedAssetsEnabled: boolean; legacyWirelessEnabled: boolean; qrAssetFlowEnabled: boolean }
  centerHeadRoles: string[]
  roleDefaults: Array<{ role: string; smsEnabled: boolean }>
  assetVisibilityRules: Array<{ centerId: number; departmentId: number | null; role: string; assetTypeId: number }>
  dashboardWidgets: DashboardWidget[]
}
