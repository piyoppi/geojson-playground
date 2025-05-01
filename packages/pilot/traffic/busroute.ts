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
import type { Position2D } from "../geojson"
import type { TrafficGraphNode } from "./graph/trafficGraph"

export type BusStopNode = TrafficGraphNode<BusStop>

export type BusRoute = Route<BusStop>

export type BusStop = TransportationStation & {
  position: Position2D
}

export type SerializedBusStop = SerializedStation & {
  position: Position2D
}
export type SerializedBusRoute = SerializedRoute<SerializedBusStop>

export const serializedBusRoute = (busRoute: BusRoute): SerializedBusRoute => 
  serializeRoute(busRoute, s => serializeStation(s))

export const deserializeBusRoute = (busRoute: SerializedBusRoute): BusRoute =>
  deserializeRoute(busRoute, (s, id) => deserializeStation(s, id))
