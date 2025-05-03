import { buildWeakRefArc, type Arc } from "../../graph/arc.js"
import type { ArcGenerator } from "../../graph/arcGenerator"
import type { GraphNode } from "../../graph/graph"
import type { CompanyId, Station } from "../transportation"

export type TrafficGraphNode<S extends Station> = GraphNode<TrafficItem<S>>

export type TrafficItem<T extends Station = Station> = {
  station: T,
  companyId: CompanyId
}

export interface TransferOwnLineArc<S extends Station> extends Arc<TrafficItem<S>> {
  type: 'TransferOwnLine'
}

export interface TransferOtherLineArc<S extends Station> extends Arc<TrafficItem<S>> {
  type: 'TransferOtherLineArc'
}

export type TrafficArc<S extends Station> =
    Arc<TrafficItem<S>>
  | TransferOwnLineArc<S>
  | TransferOtherLineArc<S>

export const generateTransferOwnLineArc: ArcGenerator<TrafficItem<Station>> = (a, b, cost) => ({
  type: 'TransferOwnLine',
  ...buildWeakRefArc(a, b, cost)
})

export const generateTransferOtherLineArc: ArcGenerator<Station> = (a, b, cost) => ({
  type: 'TransferOtherLineArc',
  ...buildWeakRefArc(a, b, cost)
})
