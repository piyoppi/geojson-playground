import { Position2D } from "./geojson"
import { BusStopsGeoJson } from "./MLITGisTypes/busStop"

export type BusStop = {
  id: string,
  name: string,
  company: string,
  route: string,
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
        route,
        position: f.geometry.coordinates
      }]
    })
  }).flat()
}
