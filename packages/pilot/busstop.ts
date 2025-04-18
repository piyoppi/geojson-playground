import { Position2D } from "./geojson"
import { BusStopsGeoJson } from "./MLITGisTypes/busStop"
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
        id: `${company}-${route}-${name}-${f.geometry.coordinates[0]}-${f.geometry.coordinates[1]}`,
        name,
        company,
        route: RouteName(route),
        position: f.geometry.coordinates
      }]
    })
  }).flat()
}
