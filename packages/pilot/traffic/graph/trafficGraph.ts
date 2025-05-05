import { buildWeakRefArc, type Arc } from "../../graph/arc.js"
import type { ArcGenerator } from "../../graph/arcGenerator.js"
import type { GraphNode } from "../../graph/graph.js"
import type { CompanyId, Station } from "../transportation.js"

export type TrafficGraphNode = GraphNode<TrafficItem>

export type TrafficItem = {
  station: Station,
  companyId: CompanyId
}

export interface TransferOwnLineArc extends Arc<TrafficItem> {
  type: 'TransferOwnLine'
}

export interface TransferOtherLineArc extends Arc<TrafficItem> {
  type: 'TransferOtherLineArc'
}

export type TrafficArc =
    Arc<TrafficItem>
  | TransferOwnLineArc
  | TransferOtherLineArc

export const generateTransferOwnLineArc: ArcGenerator<TrafficItem> = (a, b, cost) => ({
  type: 'TransferOwnLine',
  ...buildWeakRefArc(a, b, cost)
})

export const generateTransferOtherLineArc: ArcGenerator<TrafficItem> = (a, b, cost) => ({
  type: 'TransferOtherLineArc',
  ...buildWeakRefArc(a, b, cost)
})
