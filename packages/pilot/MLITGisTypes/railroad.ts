import { Railroad } from "../traffic/railroad"
import { RouteId } from "../traffic/transportation.js"
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

export const fromMLITGeoJson = (railroadsGeoJson: RailroadsGeoJson, stationsGeoJson: StationsGeoJson): Railroad[] => {
  const railroadsFeature = Map.groupBy(railroadsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)
  const stationsFeature = Map.groupBy(stationsGeoJson.features, (f) => `${f.properties.N02_003}-${f.properties.N02_004}`)

  return Array.from(railroadsFeature.keys()).flatMap(id => {
    const railroad = railroadsFeature.get(id) || []
    if (railroad.length === 0) return []

    const stations =  stationsFeature.get(id) || []
    const lineName = railroad[0].properties.N02_003
    const company = railroad[0].properties.N02_004

    return [{
      id: RouteId(id),
      name: lineName,
      company,
      rails: railroad.map(r => r.geometry.coordinates),
      stations: stations.map(s =>
        ({
          name: s.properties.N02_005,
          id: s.properties.N02_005c,
          routeId: RouteId(id),
          groupId: s.properties.N02_005g,
          platform: [s.geometry.coordinates[0], s.geometry.coordinates[1]],
        })
      )
    }]
  })
}
