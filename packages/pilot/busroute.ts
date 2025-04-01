import { type GraphNode } from "./graph/graph"
import { buildPathchain, ends } from './pathchain'
import type { Path } from "./path"
import { BusRoutesGeoJson } from "./MLITGisTypes/busRoute"
import { BusStop } from "./busstop"
import { fromPathChain } from "./graph/fromPathChain"

export type BusRoute = {
  id: string,
  company: string,
  routes: Path[]
}

export type BusStopNode = BusStop & GraphNode

export const toBusStopGraph = (busRoute: BusRoute, busStops: BusStop[]): BusStopNode[] => {
  const pathchainGroups = buildPathchain(busRoute.routes)

  return pathchainGroups.flatMap(pathchains => {
    const end = ends(pathchains)[0]
    return fromPathChain(busStops, b => ({...b}))(pathchains, end.from())
  })
}

export const fromMLITGeoJson = (busRouteGeoJson: BusRoutesGeoJson): BusRoute[] => {
  const routeFeature = Map.groupBy(busRouteGeoJson.features, f => f.properties.N07_001)

  return routeFeature.entries().map(([company, properties]) => ({
    id: company,
    company,
    routes: properties.map(p => p.geometry.coordinates)
  })).toArray()
}
