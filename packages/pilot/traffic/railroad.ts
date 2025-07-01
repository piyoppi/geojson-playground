import type { Path } from "../geometry/path/index.js"
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

export type RailroadRoute = Route<RailroadStation>

export type Railroad = {
  route: RailroadRoute
  track: Path[]
}

export type SerializedRailroad = SerializedRoute<SerializedRailroadStation>

export type RailroadStation = TransportationStation

export type SerializedRailroadStation = SerializedStation

export const serializeRailroad = (railroad: RailroadRoute): SerializedRailroad =>
  serializeRoute(railroad, (s) => ({
    ...serializeStation(s),
    groupId: s.groupId,
  }))

export const deserializeRailroad = (railroad: SerializedRailroad): RailroadRoute => ({
  ...deserializeRoute(railroad, (s, id) => ({
    ...s,
    ...deserializeStation(s, id),
  })),
})
