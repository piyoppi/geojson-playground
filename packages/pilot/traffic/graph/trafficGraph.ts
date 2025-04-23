import type { Arc, GraphNode } from "../../graph/graph"
import type { Position2D } from "../../geometry"

export type TrafficGraphNode = GraphNode & {
  position: Position2D
  name: string
  routeId: string
}

export type TrafficArc = Arc
