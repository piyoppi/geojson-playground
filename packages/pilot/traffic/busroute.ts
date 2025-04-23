import type { Position2D } from "../geojson"
import type { GraphNode } from "../graph/graph"
import type { Route, Station as TransportationStation } from "./transportation"

export type BusStopNode = BusStop & GraphNode

export type BusRoute = Route<BusStop>

export type BusStop = TransportationStation & {
  position: Position2D
}
