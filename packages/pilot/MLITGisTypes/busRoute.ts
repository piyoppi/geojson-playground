import { RouteId } from "../traffic/transportation.js"
import type { Feature, LineString2D } from "../geojson"
import type { BusRoute } from "../traffic/busroute"
import type { BusStopsGeoJson } from "./busStop"

export type BusRoutesGeoJson = {
  type: string
  features: Feature<LineString2D, Properties>[]
}

// ref: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N07-2022.html
type Properties = {
  N07_001: string       // バス事業者名
  N07_002: string       // 備考
}

export const fromMLITGeoJson = (busStopGeoJson: BusStopsGeoJson): BusRoute[] => {
  const busStops = busStopGeoJson.features.map(f => {
    const name = f.properties.P11_001
    const company = f.properties.P11_002
    return f.properties.P11_003_01.split(',').flatMap(route => {
      if (!f.geometry) return []
      return [{
        id: RouteId(`${company}-${route}-${name}-${f.geometry.coordinates[0]}-${f.geometry.coordinates[1]}`),
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
      id,
      name: `${busStops[0].company}-${id}`,
      company: busStops[0].company,
      stations: busRoutes.get(id) || []
    }
  ])
}
