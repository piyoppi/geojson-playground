import type { Arc, GraphNode } from "../../graph/graph"
import { Station } from "../transportation"

export type TrafficGraphNode<T extends Station> = GraphNode & {
  item: T
}

export type TrafficArc = Arc
