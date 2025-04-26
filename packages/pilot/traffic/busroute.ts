import type { Position2D } from "../geojson"
import type { GraphNode } from "../graph/graph"
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

export type BusStopNode = BusStop & GraphNode

export type BusRoute = Route<BusStop>

export type BusStop = TransportationStation & {
  position: Position2D
}

export type SerializedBusStop = SerializedStation & {
  position: Position2D
}
export type SerializedBusRoute = SerializedRoute<SerializedBusStop>

export const serializedBusRoute = (busRoute: BusRoute): SerializedBusRoute => ({
  ...busRoute,
  ...serializeRoute(busRoute, (s) => ({
    ...s,
    ...serializeStation(s),
  }))
})

export const deserializeBusRoute = (busRoute: SerializedBusRoute): BusRoute => ({
  ...busRoute,
  ...deserializeRoute(busRoute, (s) => ({
    ...s,
    ...deserializeStation(s),
  }))
})
