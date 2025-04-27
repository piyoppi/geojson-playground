import type { Path } from "../path"
import {
  serializeRoute,
  serializeStation,
  deserializeRoute,
  deserializeStation,
  type Route,
  type SerializedRoute,
  type SerializedStation,
  type Station as TransportationStation
} from "./transportation.js"

export type Railroad = Route<Station> & {
  rails: Path[]
}
export type SerializedRailroad = SerializedRoute<SerializedRailroadStation> & {
  rails?: undefined
}

export type Station = TransportationStation & {
  groupId: string,
}
export type SerializedRailroadStation = SerializedStation & {
  groupId: string,
}

export const serializeRailroad = (railroad: Railroad): SerializedRailroad => ({
  ...railroad,
  ...serializeRoute(railroad, (s) => ({
    ...s,
    ...serializeStation(s),
  })),
  rails: undefined
})

export const deserializeRailroad = (railroad: SerializedRailroad): Railroad => ({
  ...railroad,
  ...deserializeRoute(railroad, (s, id) => ({
    ...s,
    ...deserializeStation(s, id),
  })),
  rails: [] // [TODO] Deserialize rails
})
