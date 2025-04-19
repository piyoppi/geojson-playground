import type { Feature, LineString2D } from "../geojson.js"

export type StationsGeoJson = {
  type: string
  name: string
  features: Feature<LineString2D, Properties>[]
}

// ref: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2023.html
type Properties = {
  N02_001: string
  N02_002: string
  N02_003: string       // 路線名
  N02_004: string       // 鉄道事業者
  N02_005: string       // 駅名
  N02_005c: string      // 駅コード
  N02_005g: string      // 駅グループ
}
