import { Position2D } from "./geojson"
import { BusStopsGeoJson } from "./MLITGisTypes/busStop"
import { distance } from "./geometry"
import { RouteName } from "./graph"

export type BusStop = {
  id: string,
  name: string,
  company: string,
  route: RouteName,
  position: Position2D
}

export const fromMLITGeoJson = (busStopGeoJson: BusStopsGeoJson): BusStop[] => {
  return busStopGeoJson.features.map(f => {
    const name = f.properties.P11_001
    const company = f.properties.P11_002
    return f.properties.P11_003_01.split(',').flatMap(route => {
      if (!f.geometry) return []
      return [{
        id: `${company}-${route}-${name}-`,
        name,
        company,
        route: RouteName(route),
        position: f.geometry.coordinates
      }]
    })
  }).flat()
}

export const findNearestBusStops = (
  position: Position2D,
  busStops: BusStop[],
  limit: number = 1
): Array<{ busStop: BusStop, distance: number }> =>
  busStops
    .map(busStop => ({
      busStop,
      distance: distance(position, busStop.position)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)

export const findFarthestNeighboringBusStop = (busStops: BusStop[]): { from: BusStop, to: BusStop, distance: number } => {
  if (busStops.length < 2) {
    throw new Error('At least two bus stops are required to find the farthest nearest bus stop')
  }
  
  return busStops
    .flatMap(busStop => {
      const otherBusStops = busStops.filter(bs => bs.id !== busStop.id && bs.route === busStop.route)
      const nearest = findNearestBusStops(busStop.position, otherBusStops, 1)[0]

      if (!nearest) return []

      return [{
        from: busStop,
        to: nearest.busStop,
        distance: nearest.distance
      }]
    })
    .reduce((max, current) => 
      current.distance > max.distance ? current : max
    )
}
