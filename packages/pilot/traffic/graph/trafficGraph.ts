import { buildWeakRefArc } from "../../graph/arc/weakRefArc.js"
import type { Arc, ArcGenerator } from "../../graph/arc/index.js"
import type { GraphNode } from "../../graph/graph.js"
import type { CompanyId, Junction, Station } from "../transportation.js"
import { Position2D } from "../../geojson.js"

export type TrafficGraphNode = GraphNode<TrafficItem>
export type StationNode = GraphNode<StationNodeItem>

type NodeItem = {
  position: () => Position2D
  companyId: CompanyId
}

type JunctionNodeItem = NodeItem & {
  type: 'Junction'
  junction: Junction
}

type StationNodeItem = NodeItem & {
  type: 'Station'
  station: Station
}

export type TrafficItem = JunctionNodeItem | StationNodeItem

export const toStationNodes = (nodes: TrafficGraphNode[]) => nodes.filter(n => n.item.type === 'Station') as GraphNode<StationNodeItem>[]

export const toJunctionNodes = (nodes: TrafficGraphNode[]) => nodes.filter(n => n.item.type === 'Junction') as GraphNode<JunctionNodeItem>[]

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
