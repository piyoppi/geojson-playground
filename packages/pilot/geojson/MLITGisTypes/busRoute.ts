import { type Company, toCompanyId, toRouteId, toStationId } from "../../traffic/transportation.js"
import type { Feature, LineString2D } from "../index.js"
import type { BusRoute } from "../../traffic/busroute.js"
import type { BusStopsGeoJson } from "./busStop.js"
import { toId } from "../../utils/Id.js"

export type BusRoutesGeoJson = {
  type: string
  features: Feature<LineString2D, Properties>[]
}

// ref: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N07-2022.html
type Properties = {
  N07_001: string       // バス事業者名
  N07_002: string       // 備考
}

export const fromMLITGeoJson = async (busStopGeoJson: BusStopsGeoJson): Promise<[Company[], BusRoute[]]> => {
  const companies = new Map<string, Company>(
    await Promise.all(
      new Set(busStopGeoJson.features.map(f => f.properties.P11_002))
        .values()
        .toArray()
        .map(async name => [
          name,
          {
            id: await toCompanyId(name),
            name
          }
        ] as const)
    )
  )

  const processedFeatures = await Promise.all(
    busStopGeoJson.features.flatMap(f =>
      f.properties.P11_003_01.split(',').map(async routeName => ({
        name: f.properties.P11_001,
        companyName: f.properties.P11_002,
        routeName,
        geometry: f.geometry,
        groupId: await toId([f.properties.P11_001, f.properties.P11_002].join('-'))
      }))
    )
  )

  const busStops: BusRoute[] = await Promise.all(
    Map.groupBy(
      processedFeatures,
      ({companyName, routeName}) => [companyName, routeName].join('-')
    )
    .entries()
    .map(async ([routeKey, b]): Promise<BusRoute> => {
      const { companyName, routeName } = b[0]
      const routeId = await toRouteId(routeKey)

      const company = companies.get(companyName)
      if (!company) {
        throw new Error(`Company is not found name: ${companyName}`)
      }

      return {
        id: routeId,
        name: routeName,
        companyId: company.id,
        kind: 'bus',
        stations: await Promise.all(
          b.map(async ({name, geometry, groupId}) => ({
            id: await toStationId(`${companyName}-${routeName}-${name}-${geometry.coordinates[0]}-${geometry.coordinates[1]}`),
            name,
            routeIds: [routeId],
            groupId,
            position: geometry.coordinates
          }))
        ),
      }
    }))

  return [companies.values().toArray(), busStops]
}
