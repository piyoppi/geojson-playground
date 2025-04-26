import type { Arc, GraphNode } from "../../graph/graph"
import type { Position2D } from "../../geometry"
import type { RouteId } from "../transportation"

export type TrafficGraphNode = GraphNode & {
  position: Position2D
  name: string
  routeId: RouteId
}

export type TrafficArc = Arc
