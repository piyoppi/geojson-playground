import { RouteId } from "@piyoppi/sansaku-pilot/traffic/transportation"

export type StationKind = 'station' | 'busStop'

export type StationSummaryGroup = {
  id: string,
  name: string,
  kind: StationKind,
  routeSummaries: RouteSummary[],
}

export type StationSummary = {
  id: string,
  groupId: string,
  partitionKey: string,
  name: string,
  kind: StationKind,
}

export type RouteSummary = {
  id: RouteId,
  name: string,
  CompanySummaries: CompanySummary[],
}

export type CompanySummary = {
  id: string,
  name: string,
}
