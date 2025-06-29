import { type Company, toCompanyId, toRouteId, toStationId } from "../../traffic/transportation.js"
import type { Feature, LineString2D } from "../index.js"
import type { BusRoute, BusStop } from "../../traffic/busroute.js"
import type { BusStopsGeoJson } from "./busStop.js"
import { toId } from "../../utils/Id.js"

export type BusRoutesGeoJson = {
  type: string
  features: Feature<LineString2D, Properties>[]
}

// ref: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N07-2022.html
type Properties = {
  N07_001: string       // Bus operator name
  N07_002: string       // Notes
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

  const busStops: BusRoute[] = await Promise.all(Map.groupBy(
      busStopGeoJson.features.flatMap(f =>
        f.properties.P11_003_01.split(',').map(routeName => ({
          stopName: f.properties.P11_001,
          companyName: f.properties.P11_002,
          routeName,
          geometry: f.geometry
        }))
      ),
      ({ companyName, routeName }) => `${companyName}-${routeName}`
    )
    .entries()
    .map(async ([routeKey, stops]): Promise<BusRoute> => {
      const { companyName, routeName } = stops[0]
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
          stops.map(async ({ stopName, companyName, routeName, geometry }) => ({
            id: await toStationId(`${companyName}-${routeName}-${stopName}-${geometry.coordinates[0]}-${geometry.coordinates[1]}`),
            name: stopName,
            routeId,
            position: geometry.coordinates
          }))
        )
      }
    }))

  const allStations = busStops.flatMap(route => route.stations)
  await assignBusStopGroupIds(allStations)

  return [companies.values().toArray(), busStops]
}

const assignBusStopGroupIds = async (busStops: BusStop[]): Promise<BusStop[]> => {
  const nodePositionIndex = Map.groupBy(
    busStops,
    s => [s.name, ...s.position].join(',')
  )

  for (const [key, stations] of nodePositionIndex) {
    if (stations.length > 1) {
      const groupId = await toId(key)
      for (const station of stations) {
        station.groupId = groupId
      }
    }
  }

  return busStops
}

