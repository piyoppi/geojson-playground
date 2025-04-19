import type { Feature, Point } from "../geojson.js"

export type BusStopsGeoJson = {
  type: string
  features: Feature<Point, Properties>[]
}

// ref: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P11-2022.html
type Properties = {
  P11_001: string       // バス停留所名
  P11_002: string       // バス事業者名
  P11_003_01: string    // バス系統
  P11_003_02: string    // バス系統
  P11_003_03: string    // バス系統
  P11_003_04: string    // バス系統
  P11_003_05: string    // バス系統
  P11_003_06: string    // バス系統
  P11_003_07: string    // バス系統
  P11_003_08: string    // バス系統
  P11_003_09: string    // バス系統
  P11_003_10: string    // バス系統
  P11_003_11: string    // バス系統
  P11_003_12: string    // バス系統
  P11_003_13: string    // バス系統
  P11_003_14: string    // バス系統
  P11_003_15: string    // バス系統
  P11_003_16: string    // バス系統
  P11_003_17: string    // バス系統
  P11_003_18: string    // バス系統
  P11_003_19: string    // バス系統
  P11_003_20: string    // バス系統
  P11_003_21: string    // バス系統
  P11_003_22: string    // バス系統
  P11_003_23: string    // バス系統
  P11_003_24: string    // バス系統
  P11_003_25: string    // バス系統
  P11_003_26: string    // バス系統
  P11_003_27: string    // バス系統
  P11_003_28: string    // バス系統
  P11_003_29: string    // バス系統
  P11_003_30: string    // バス系統
  P11_003_31: string    // バス系統
  P11_003_32: string    // バス系統
  P11_003_33: string    // バス系統
  P11_003_34: string    // バス系統
  P11_003_35: string    // バス系統
  P11_004_01: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_02: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_03: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_04: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_05: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_06: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_07: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_08: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_09: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_10: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_11: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_12: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_13: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_14: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_15: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_16: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_17: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_18: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_19: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_20: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_21: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_22: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_23: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_24: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_25: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_26: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_27: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_28: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_29: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_30: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_31: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_32: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_33: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_34: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_35: string    // バス区分コード (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_005: string       // 備考
}
