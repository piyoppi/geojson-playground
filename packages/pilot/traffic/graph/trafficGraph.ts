import { buildWeakRefArc, type Arc } from "../../graph/arc.js"
import type { ArcGenerator } from "../../graph/arcGenerator"
import type { GraphNode } from "../../graph/graph"
import type { CompanyId, Station } from "../transportation"

export type TrafficGraphNode<T extends Station> = GraphNode & {
  item: T,
  companyId: CompanyId
}

export interface TransferOwnLineArc extends Arc {
  type: 'TransferOwnLine'
}

export interface TransferOtherLineArc extends Arc {
  type: 'TransferOtherLineArc'
}

export type TrafficArc = Arc | TransferOwnLineArc | TransferOtherLineArc

export const generateTransferOwnLineArc: ArcGenerator<GraphNode> = (a, b, cost) => ({
  type: 'transferOwnLine',
  ...buildWeakRefArc(a, b, cost)
})

export const generateTransferOtherLineArc: ArcGenerator<GraphNode> = (a, b, cost) => ({
  type: 'TransferOtherLineArc',
  ...buildWeakRefArc(a, b, cost)
})
