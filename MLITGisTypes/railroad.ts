import type { Feature, LineString2D } from "../geojson"

export type RailroadsGeoJson = {
  type: string
  features: Feature<LineString2D, Properties>[]
}

type Properties = {
  N02_001: string
  N02_002: string
  N02_003: string       // 路線名
  N02_004: string       // 鉄道事業者
}
