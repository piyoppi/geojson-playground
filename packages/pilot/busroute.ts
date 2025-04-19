import { type GraphNode } from "./graph/graph.js"
import type { Path } from "./path.js"
import { BusRoutesGeoJson } from "./MLITGisTypes/busRoute.js"
import { BusStop } from "./busstop.js"

export type BusRoute = {
  id: string,
  company: string,
  routes: Path[]
}

export type BusStopNode = BusStop & GraphNode

export const fromMLITGeoJson = (busRouteGeoJson: BusRoutesGeoJson): BusRoute[] => {
  const routeFeature = Map.groupBy(busRouteGeoJson.features, f => f.properties.N07_001)

  return routeFeature.entries().map(([company, properties]) => ({
    id: company,
    company,
    routes: properties.map(p => p.geometry.coordinates)
  })).toArray()
}
