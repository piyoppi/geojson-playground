import { type Company, type CompanyId, type RouteId, toCompanyId, toRouteId, toStationId } from "../../traffic/transportation.js"
import type { Railroad, RailroadStation } from "../../traffic/railroad.js"
import type { Feature, LineString2D } from "../index.js"
import type { StationFeature, StationsGeoJson } from './station.js'
import { center } from "../../geometry/index.js"

export type RailroadsGeoJson = {
  type: string
  features: Feature<LineString2D, RailroadProperty>[]
}

type RailroadFeature = Feature<LineString2D, RailroadProperty>

// ref: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2023.html
type RailroadProperty = {
  N02_001: string
  N02_002: string
  N02_003: string       // 路線名
  N02_004: string       // 鉄道事業者
}

export const fromMLITGeoJson = async (railroadsGeoJson: RailroadsGeoJson, stationsGeoJson: StationsGeoJson): Promise<[Company[], Railroad[]]> => {
  const railroadsFeature = Map.groupBy(railroadsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)
  const stationsFeature = Map.groupBy(stationsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)

  const routeIds = Array.from(railroadsFeature.keys());

  const companies = new Map<string, Company>(
    await Promise.all(
      new Set(railroadsGeoJson.features.map(f => f.properties.N02_004))
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

  const railroadPromises = routeIds.map(async routeId => {
    const railroadFeatures = railroadsFeature.get(routeId) || []
    if (railroadFeatures.length === 0) {
      throw new Error(`Railroad features not found for routeId: ${routeId}`)
    }

    const stationFeatures = stationsFeature.get(routeId) || []
    const companyName = railroadFeatures[0].properties.N02_004

    const company = companies.get(companyName)
    if (!company) {
      throw new Error(`Company is not found for name: ${companyName}`)
    }

    return createRailroad(railroadFeatures, company.id, stationFeatures, await toRouteId(routeId))
  })

  const railroads = (await Promise.all(railroadPromises))

  return [companies.values().toArray(), railroads]
}

const createRailroad = async (railroadFeatures: RailroadFeature[], companyId: CompanyId, stations: StationFeature[], routeId: RouteId): Promise<Railroad> => {
  if (railroadFeatures.length === 0) {
    throw new Error(`Railroad features not found for routeId: ${routeId}`)
  }
  const lineName = railroadFeatures[0].properties.N02_003
  const stationsList = await createStations(stations, routeId)

  return {
    id: routeId,
    name: lineName,
    kind: 'railroad',
    companyId,
    rails: railroadFeatures.map(r => r.geometry.coordinates),
    stations: stationsList
  }
}

const createStations = async (stationFeatures: StationFeature[], routeId: RouteId): Promise<RailroadStation[]> => {
  const stationPromises = stationFeatures.map(async s => ({
    name: s.properties.N02_005,
    id: await toStationId(s.properties.N02_005c),
    routeId,
    groupId: s.properties.N02_005g,
    position: center([s.geometry.coordinates[0], s.geometry.coordinates[1]])
  }))

  return Promise.all(stationPromises)
}
