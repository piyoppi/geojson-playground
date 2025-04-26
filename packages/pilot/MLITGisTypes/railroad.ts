import { toRouteId, toStationId } from "../traffic/transportation.js"
import type { Railroad } from "../traffic/railroad"
import type { Feature, LineString2D } from "../geojson"
import type { StationsGeoJson } from './station'

export type RailroadsGeoJson = {
  type: string
  features: Feature<LineString2D, Properties>[]
}

// ref: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2023.html
type Properties = {
  N02_001: string
  N02_002: string
  N02_003: string       // 路線名
  N02_004: string       // 鉄道事業者
}

export const fromMLITGeoJson = async (railroadsGeoJson: RailroadsGeoJson, stationsGeoJson: StationsGeoJson): Promise<Railroad[]> => {
  const railroadsFeature = Map.groupBy(railroadsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)
  const stationsFeature = Map.groupBy(stationsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)

  return (await Promise.all(Array.from(railroadsFeature.keys()).map(async id => {
    const railroadGeoJson = railroadsFeature.get(id) || []
    if (railroadGeoJson.length === 0) return []

    const stations =  stationsFeature.get(id) || []
    const lineName = railroadGeoJson[0].properties.N02_003
    const company = railroadGeoJson[0].properties.N02_004
    const routeId = await toRouteId(id)
    const railroad: Railroad = {
      id: routeId,
      name: lineName,
      company,
      rails: railroadGeoJson.map(r => r.geometry.coordinates),
      stations: await Promise.all(
        stations.map(async s =>
          ({
            name: s.properties.N02_005,
            id: await toStationId(s.properties.N02_005c),
            routeId,
            groupId: s.properties.N02_005g,
            platform: [s.geometry.coordinates[0], s.geometry.coordinates[1]],
          })
        )
      )
    }

    return [railroad]
  }))).flat()
}
