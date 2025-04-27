import { toRouteId, toStationId } from "../traffic/transportation.js"
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

export const fromMLITGeoJson = async (busStopGeoJson: BusStopsGeoJson): Promise<BusRoute[]> => {
  const busStops: BusRoute[] = await Promise.all(Map.groupBy(
      busStopGeoJson.features.flatMap(f => f.properties.P11_003_01.split(',').map(r => [f.properties.P11_001, f.properties.P11_002, r, f.geometry] as const)),
      ([_, company, routeName]) => [company, routeName].join('-')
    )
    .entries()
    .map(async ([k, b]) => {
      const [_name, company, routeName] = b[0]
      const routeId = await toRouteId(k)
      return {
        id: routeId,
        name: routeName,
        company,
        stations: await Promise.all(
          b.map(async ([name, _company, _routeName, geometry])=> ({
            id: await toStationId(`${company}-${routeName}-${name}-${geometry.coordinates[0]}-${geometry.coordinates[1]}`),
            name,
            routeId,
            position: geometry.coordinates
          }))
        )
      }
    }))

  return busStops
}
