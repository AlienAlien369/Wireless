import { format, parseISO, formatDistanceToNow } from 'date-fns'

export function formatDate(date: string | Date | null | undefined, pattern = 'dd/MM/yyyy'): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, pattern)
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'Available': return 'text-green-600 bg-green-50 border-green-200'
    case 'Issued':    return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    case 'Broken':    return 'text-red-600 bg-red-50 border-red-200'
    case 'Returned':  return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'Partial':   return 'text-orange-600 bg-orange-50 border-orange-200'
    default:          return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function statusBadge(status: string): string {
  return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(status)}`
}
