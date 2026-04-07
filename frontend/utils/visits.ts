type VisitLike = {
  id: number | string
  isActive?: boolean
}

export function getLatestVisit<T extends VisitLike>(visits: T[]) {
  return visits[0] ?? null
}

export function getActiveVisits<T extends VisitLike>(visits: T[]) {
  return visits.filter((visit) => visit.isActive)
}

export function getLatestActiveVisit<T extends VisitLike>(visits: T[]) {
  return getLatestVisit(getActiveVisits(visits))
}
