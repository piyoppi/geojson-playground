import type { Feature, Point } from "../index.js"

export type BusStopsGeoJson = {
  type: string
  features: Feature<Point, Properties>[]
}

// ref: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P11-2022.html
export type Properties = {
  P11_001: string       // Bus stop name
  P11_002: string       // Bus operator name
  P11_003_01: string    // Bus route
  P11_003_02: string    // Bus route
  P11_003_03: string    // Bus route
  P11_003_04: string    // Bus route
  P11_003_05: string    // Bus route
  P11_003_06: string    // Bus route
  P11_003_07: string    // Bus route
  P11_003_08: string    // Bus route
  P11_003_09: string    // Bus route
  P11_003_10: string    // Bus route
  P11_003_11: string    // Bus route
  P11_003_12: string    // Bus route
  P11_003_13: string    // Bus route
  P11_003_14: string    // Bus route
  P11_003_15: string    // Bus route
  P11_003_16: string    // Bus route
  P11_003_17: string    // Bus route
  P11_003_18: string    // Bus route
  P11_003_19: string    // Bus route
  P11_003_20: string    // Bus route
  P11_003_21: string    // Bus route
  P11_003_22: string    // Bus route
  P11_003_23: string    // Bus route
  P11_003_24: string    // Bus route
  P11_003_25: string    // Bus route
  P11_003_26: string    // Bus route
  P11_003_27: string    // Bus route
  P11_003_28: string    // Bus route
  P11_003_29: string    // Bus route
  P11_003_30: string    // Bus route
  P11_003_31: string    // Bus route
  P11_003_32: string    // Bus route
  P11_003_33: string    // Bus route
  P11_003_34: string    // Bus route
  P11_003_35: string    // Bus route
  P11_004_01: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_02: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_03: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_04: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_05: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_06: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_07: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_08: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_09: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_10: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_11: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_12: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_13: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_14: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_15: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_16: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_17: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_18: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_19: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_20: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_21: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_22: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_23: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_24: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_25: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_26: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_27: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_28: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_29: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_30: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_31: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_32: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_33: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_34: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_004_35: string    // Bus class code (ref: https://nlftp.mlit.go.jp/ksj/gml/codelist/BusClassCd.html)
  P11_005: string       // Notes
}
