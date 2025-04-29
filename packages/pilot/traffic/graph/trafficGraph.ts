import type { Arc } from "../../graph/arc"
import type { GraphNode } from "../../graph/graph"
import type { Station } from "../transportation"

export type TrafficGraphNode<T extends Station> = GraphNode & {
  item: T
}

export type TrafficArc = Arc
