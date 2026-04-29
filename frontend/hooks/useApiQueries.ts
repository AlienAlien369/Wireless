import { useQuery } from '@tanstack/react-query'
import {
  assetsApi, visitsApi, sewadaarsApi, reportsApi, tenantsApi, productConfigApi
} from '../services/api'
import type { Asset, AssetType, Visit, Sewadaar, Center, Department, DashboardStats, VisitWiseStat } from '../types'

// ─── Query Keys ─────────────────────────────────────────────────────────────
// Centralised keys prevent cache collisions and enable targeted invalidation.
export const queryKeys = {
  centers: () => ['centers'] as const,
  departments: (centerId?: number) => ['departments', centerId] as const,
  assetTypes: (centerId?: number, departmentId?: number) => ['assetTypes', centerId, departmentId] as const,
  assets: (centerId?: number, typeId?: number, status?: string, departmentId?: number) =>
    ['assets', centerId, typeId, status, departmentId] as const,
  visits: (centerId?: number, departmentId?: number) => ['visits', centerId, departmentId] as const,
  sewadaars: () => ['sewadaars'] as const,
  dashboard: (centerId?: number, departmentId?: number) => ['dashboard', centerId, departmentId] as const,
  visitWise: (centerId?: number, departmentId?: number) => ['visitWise', centerId, departmentId] as const,
  productConfig: () => ['productConfig'] as const,
}

// ─── Centers ─────────────────────────────────────────────────────────────────
export function useCenters() {
  return useQuery<Center[]>({
    queryKey: queryKeys.centers(),
    queryFn: async () => {
      const res = await tenantsApi.getCenters()
      return (res.data || []).filter((c: Center) => c.isActive)
    },
    staleTime: 5 * 60 * 1000, // 5 min – centers change rarely
  })
}

// ─── Departments ─────────────────────────────────────────────────────────────
export function useDepartments(centerId?: number | null) {
  return useQuery<Department[]>({
    queryKey: queryKeys.departments(centerId ?? undefined),
    queryFn: async () => {
      if (!centerId) return []
      const res = await tenantsApi.getDepartments(centerId)
      return (res.data || []).filter((d: Department) => d.isActive)
    },
    enabled: !!centerId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Asset Types ─────────────────────────────────────────────────────────────
export function useAssetTypes(centerId?: number | null, departmentId?: number | null) {
  return useQuery<AssetType[]>({
    queryKey: queryKeys.assetTypes(centerId ?? undefined, departmentId ?? undefined),
    queryFn: async () => {
      const res = await assetsApi.getTypes(centerId ?? undefined, departmentId ?? undefined)
      return res.data || []
    },
    enabled: !!centerId,
    staleTime: 2 * 60 * 1000,
  })
}

// ─── Assets ──────────────────────────────────────────────────────────────────
export function useAssets(centerId?: number | null, assetTypeId?: number, status?: string, departmentId?: number | null) {
  return useQuery<Asset[]>({
    queryKey: queryKeys.assets(centerId ?? undefined, assetTypeId, status, departmentId ?? undefined),
    queryFn: async () => {
      if (!centerId) return []
      const res = await assetsApi.getAssets(centerId, assetTypeId, status, departmentId ?? undefined)
      return res.data || []
    },
    enabled: !!centerId,
    staleTime: 30 * 1000, // 30s – assets change frequently
  })
}

// ─── Visits ──────────────────────────────────────────────────────────────────
export function useVisits(centerId?: number | null, departmentId?: number | null) {
  return useQuery<Visit[]>({
    queryKey: queryKeys.visits(centerId ?? undefined, departmentId ?? undefined),
    queryFn: async () => {
      const res = await visitsApi.getAll({ centerId: centerId ?? undefined, departmentId: departmentId ?? undefined })
      return res.data || []
    },
    staleTime: 60 * 1000,
  })
}

// ─── Sewadaars ───────────────────────────────────────────────────────────────
export function useSewadaars() {
  return useQuery<Sewadaar[]>({
    queryKey: queryKeys.sewadaars(),
    queryFn: async () => {
      const res = await sewadaarsApi.getAll()
      return res.data || []
    },
    staleTime: 60 * 1000,
  })
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function useDashboardStats(centerId?: number | null, departmentId?: number | null) {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard(centerId ?? undefined, departmentId ?? undefined),
    queryFn: async () => {
      const res = await reportsApi.getDashboard({ centerId: centerId ?? undefined, departmentId: departmentId ?? undefined })
      return res.data
    },
    enabled: !!centerId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // auto-refresh every 60s
  })
}

// ─── Visit-wise Dashboard ────────────────────────────────────────────────────
export function useVisitWiseDashboard(centerId?: number | null, departmentId?: number | null) {
  return useQuery<VisitWiseStat[]>({
    queryKey: queryKeys.visitWise(centerId ?? undefined, departmentId ?? undefined),
    queryFn: async () => {
      const res = await reportsApi.getVisitWiseDashboard({ centerId: centerId ?? undefined, departmentId: departmentId ?? undefined })
      return res.data || []
    },
    enabled: !!centerId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

// ─── Product Config ──────────────────────────────────────────────────────────
export function useProductConfig() {
  return useQuery({
    queryKey: queryKeys.productConfig(),
    queryFn: async () => {
      const res = await productConfigApi.get()
      return res.data
    },
    staleTime: 10 * 60 * 1000, // 10 min – config changes rarely
  })
}
