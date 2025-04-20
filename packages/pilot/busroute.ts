import { BusStopsGeoJson } from "./MLITGisTypes/busStop.js"
import { Position2D } from "./geojson.js"
import { RouteId } from "./graph.js"
import { type GraphNode } from "./graph/graph.js"

export type BusStopNode = BusStop & GraphNode

export type BusRoute = {
  id: string,
  company: string,
  busstops: BusStop[]
}

export type BusStop = {
  id: string,
  name: string,
  routeId: RouteId,
  position: Position2D
}

export const fromMLITGeoJson = (busStopGeoJson: BusStopsGeoJson): BusRoute[] => {
  const busStops = busStopGeoJson.features.map(f => {
    const name = f.properties.P11_001
    const company = f.properties.P11_002
    return f.properties.P11_003_01.split(',').flatMap(route => {
      if (!f.geometry) return []
      return [{
        id: `${company}-${route}-${name}-${f.geometry.coordinates[0]}-${f.geometry.coordinates[1]}`,
        name,
        company,
        routeId: RouteId(route),
        position: f.geometry.coordinates
      }]
    })
  }).flat()

  const busRoutes = Map.groupBy(busStops, b => b.routeId)

  return Array.from(busRoutes.keys()).flatMap(id => [
    {
      id: id,
      company: busStops[0].company,
      busstops: busRoutes.get(id) || []
    }
  ])
}
