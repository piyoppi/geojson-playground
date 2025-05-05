import type { Path } from "../path.js"
import {
  serializeRoute,
  serializeStation,
  deserializeRoute,
  deserializeStation,
  type Route,
  type SerializedRoute,
  type SerializedStation,
  type Station as TransportationStation,
} from "./transportation.js"

export type Railroad = Route<RailroadStation> & {
  rails: Path[]
}

export type SerializedRailroad = SerializedRoute<SerializedRailroadStation> & {
  rails?: undefined
}

export type RailroadStation = TransportationStation & {
  groupId: string,
}

export type SerializedRailroadStation = SerializedStation & {
  groupId: string,
}

export const serializeRailroad = (railroad: Railroad): SerializedRailroad =>
  serializeRoute(railroad, (s) => ({
    ...serializeStation(s),
    groupId: s.groupId,
  }))

export const deserializeRailroad = (railroad: SerializedRailroad): Railroad => ({
  ...deserializeRoute(railroad, (s, id) => ({
    ...s,
    ...deserializeStation(s, id),
  })),
  rails: [] // [TODO] Deserialize rails
})
