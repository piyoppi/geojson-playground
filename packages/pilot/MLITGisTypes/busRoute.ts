import { toRouteId, toStationId } from "../traffic/transportation.js"
import type { Feature, LineString2D } from "../geojson"
import type { BusRoute, BusStop } from "../traffic/busroute"
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
  const busStops: Readonly<[BusStop, string, string]>[] = (await Promise.all(busStopGeoJson.features
    .flatMap(f => f.properties.P11_003_01.split(',').map(r => [f.properties.P11_001, f.properties.P11_002, f.geometry, r] as const))
    .flatMap(async ([name, company, geometry, routeName]) => {
      if (!geometry) return []
      return [
        [
          {
            id: await toStationId(`${company}-${routeName}-${name}-${geometry.coordinates[0]}-${geometry.coordinates[1]}`),
            name,
            company,
            routeId: await toRouteId(`${company}-${routeName}-${name}`),
            position: geometry.coordinates
          },
          company,
          routeName
        ] as const
      ]
    }))).flat()

  return Array.from(
    Map.groupBy(busStops, ([b, company, routeName]) => [b.routeId, company, routeName] as const)
  ).map(([[routeId, company, routeName], b]) => ({
    id: routeId,
    name: `${company}-${routeName}`,
    company,
    stations: b.map(([b]) => b)
  }))
}
