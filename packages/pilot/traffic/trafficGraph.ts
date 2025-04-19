import type { Arc, GraphNode } from "../graph/graph.js"
import type { Position2D } from "../geometry"

export type TrafficGraphNode = GraphNode & {
  position: Position2D
  name: string
}

export type TrafficArc = Arc
