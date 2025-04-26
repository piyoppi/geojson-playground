import type { Position2D } from "../geometry"
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
export type SerializedRailroad = SerializedRoute<SerializedRailroadStation>

export type Station = TransportationStation & {
  groupId: string,
  platform: [Position2D, Position2D],
}
export type SerializedRailroadStation = SerializedStation & {
  groupId: string,
  platform: [Position2D, Position2D]
}

export const serializeRailroad = (railroad: Railroad): SerializedRailroad => ({
  ...railroad,
  ...serializeRoute(railroad, (s) => ({
    ...s,
    ...serializeStation(s),
  }))
})

export const deserializeRailroad = (railroad: SerializedRailroad): Railroad => ({
  ...railroad,
  ...deserializeRoute(railroad, (s) => ({
    ...s,
    ...deserializeStation(s),
  })),
  rails: [] // [TODO] Deserialize rails
})
