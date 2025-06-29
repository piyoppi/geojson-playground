import { buildWeakRefArc } from "../../graph/arc/weakRefArc.js"
import type { Arc, ArcGenerator } from "../../graph/arc/index.js"
import type { GraphNode } from "../../graph/graph.js"
import { junctionIdToString, stringToJunctionId, stationIdToString, stringToStationId, type Junction, type JunctionId, type Station, type StationId } from "../transportation.js"

/** Graph node representing a traffic element (station or junction) */
export type TrafficNode = GraphNode<TrafficNodeItem>

/** Graph node specifically representing a station */
export type StationNode = GraphNode<StationNodeItem>

export type RailroadStationNode = GraphNode<RailroadStationNodeItem>

export function isRailroadStationNode(node: GraphNode<unknown>): node is RailroadStationNode {
  return isRailroadStationNodeItem(node.item)
}

export type BusStopNode = GraphNode<BusStopNodeItem>

export type SerializedBusStopNodeItem = { t: 'B', ids: string[] }

export function isSerializedBusStopNodeItem(item: unknown): item is SerializedBusStopNodeItem {
  return (typeof item === 'object' && item !== null && 't' in item && item.t === 'B' && 'ids' in item)
}

export const serializeBusStopNodeItem = (item: BusStopNodeItem): SerializedBusStopNodeItem => ({
  t: 'B',
  ids: item.busStopIds.map(stationIdToString)
})

export const deserializeBusStopNodeItem = (serializedItem: SerializedBusStopNodeItem): BusStopNodeItem => ({
  type: 'BusStop',
  busStopIds: serializedItem.ids.map(stringToStationId)
})

export function isBusStopNode(node: GraphNode<unknown>): node is BusStopNode {
  return isBusStopNodeItem(node.item)
}

export type StationNodeItem = RailroadStationNodeItem | BusStopNodeItem

export type SerializedRailroadStationNodeItem = { t: 'S', id: string }

export function isSerializedRailroadStationNodeItem(item: unknown): item is SerializedRailroadStationNodeItem {
  return (typeof item === 'object' && item !== null && 't' in item && item.t === 'S' && 'id' in item && typeof item.id === 'string')
}

export const serializeRailroadStationNodeItem = (item: RailroadStationNodeItem): SerializedRailroadStationNodeItem => ({
  t: 'S',
  id: stationIdToString(item.stationId)
})

export const deserializeRailroadStationNodeItem = (serializedItem: SerializedRailroadStationNodeItem): RailroadStationNodeItem => ({
  type: 'Station',
  stationId: stringToStationId(serializedItem.id)
})


/** Graph node specifically representing a junction */
export type JunctionNode = GraphNode<JunctionNodeItem>

export function isJunctionNode(node: GraphNode<unknown>): node is JunctionNode {
  return isJunctionNodeItem(node.item)
}

/** Node item representing a junction in the transportation network */
type JunctionNodeItem = {
  type: 'Junction'
  junctionId: JunctionId
}

export type SerializedJunctionNodeItem = { t: 'J', id: string }

export function isSerializedJunctionNodeItem(item: unknown): item is SerializedJunctionNodeItem {
  return (typeof item === 'object' && item !== null && 't' in item && item.t === 'J' && 'id' in item && typeof item.id === 'string')
}

export const serializeJunctionNodeItem = (item: JunctionNodeItem): SerializedJunctionNodeItem => ({
  t: 'J',
  id: junctionIdToString(item.junctionId)
})

export const deserializeJunctionNodeItem = (serializedItem: SerializedJunctionNodeItem): JunctionNodeItem => ({
  type: 'Junction',
  junctionId: stringToJunctionId(serializedItem.id)
})

/**
 * Creates a station node
 * @param station - The station data
 * @param companyId - The ID of the company that owns the station
 * @param arcs      - The arcs
 * @returns A station node
 */
export const createJunctionNode = (junction: Junction, arcs: Arc<JunctionNodeItem>[] = []): JunctionNode => ({
  id: junction.id,
  item: createJunctionNodeItem(junction),
  arcs
})

/**
 * Creates a junction node item from junction data and company ID
 * @param junction - The junction data
 * @param companyId - The ID of the company that owns the junction
 * @returns A junction node item
 */
export const createJunctionNodeItem = (junction: Junction): JunctionNodeItem => ({
  type: 'Junction',
  junctionId: junction.id
})

export function isJunctionNodeItem(item: unknown): item is JunctionNodeItem {
  return (typeof item === 'object' && !!item && 'type' in item && item.type === 'Junction')
}

/** Node item representing a station in the transportation network */
export type RailroadStationNodeItem = {
  type: 'Station'
  stationId: StationId
}

export function isRailroadStationNodeItem(item: unknown): item is RailroadStationNodeItem {
  return (typeof item === 'object' && !!item && 'type' in item && item.type === 'Station')
}

/** Node item representing a busStop in the transportation network */
export type BusStopNodeItem = {
  type: 'BusStop'
  busStopIds: StationId[]
}

export function isBusStopNodeItem(item: unknown): item is BusStopNodeItem {
  return (typeof item === 'object' && !!item && 'type' in item && item.type === 'BusStop')
}

/**
 * Creates a railroad station node
 * @param station - The station data
 * @param companyId - The ID of the company that owns the station
 * @param arcs      - The arcs
 * @returns A station node
 */
export const createRailroadStationNode = (station: Station, arcs: Arc<StationNodeItem>[] = []): StationNode => ({
  id: station.id,
  item: createStationNodeItem(station),
  arcs
})

/**
 * Creates a busstop node
 * @param station - The station data
 * @param companyId - The ID of the company that owns the station
 * @param arcs      - The arcs
 * @returns A station node
 */
export const createBusStopNode = (busStops: Station[], arcs: Arc<StationNodeItem>[] = []): StationNode => ({
  id: busStops[0].id,
  item: createBusStopNodeItem(busStops),
  arcs
})

/**
 * Creates a station node item
 * @param station - The station data
 * @param companyId - The ID of the company that owns the station
 * @returns A station node item
 */
export const createStationNodeItem  = (station: Station): StationNodeItem => ({
  type: 'Station',
  stationId: station.id,
})

/**
 * Creates a busstop node item
 * @param busStops - The busStop data
 * @param companyId - The ID of the company that owns the station
 * @returns A station node item
 */
export const createBusStopNodeItem  = (busStops: Station[]): BusStopNodeItem => ({
  type: 'BusStop',
  busStopIds: busStops.map(b => b.id),
})

/** Union type representing either a junction or station node item */
export type TrafficNodeItem = JunctionNodeItem | StationNodeItem

/**
 * Filters an array of traffic nodes to return only station nodes
 * @param nodes - Array of traffic graph nodes to filter
 * @returns Array of station nodes
 */
export const filterStationNodes = (nodes: TrafficNode[]) => nodes.filter(n => n.item.type === 'Station') as GraphNode<RailroadStationNodeItem>[]

/**
 * Filters an array of traffic nodes to return only busstop nodes
 * @param nodes - Array of traffic graph nodes to filter
 * @returns Array of station nodes
 */
export const filterBusStopNodes = (nodes: TrafficNode[]) => nodes.filter(n => n.item.type === 'BusStop') as GraphNode<BusStopNodeItem>[]

/**
 * Filters an array of traffic nodes to return only junction nodes
 * @param nodes - Array of traffic graph nodes to filter
 * @returns Array of junction nodes
 */
export const filterJunctionNodes = (nodes: TrafficNode[]) => nodes.filter(n => n.item.type === 'Junction') as GraphNode<JunctionNodeItem>[]

/** Arc representing a transfer within the same transportation line */
export interface TransferOwnLineArc extends Arc<TrafficNodeItem> {
  /** Type discriminator for own-line transfer arcs */
  type: 'TransferOwnLine'
}

/** Arc representing a transfer between different transportation lines */
export interface TransferOtherLineArc extends Arc<TrafficNodeItem> {
  /** Type discriminator for other-line transfer arcs */
  type: 'TransferOtherLineArc'
}

/** Union type representing different types of arcs in the traffic graph */
export type TrafficArc =
    Arc<TrafficNodeItem>
  | TransferOwnLineArc
  | TransferOtherLineArc

/**
 * Generates an arc for transfers within the same transportation line
 * @param a - Source node
 * @param b - Target node
 * @param cost - Cost of the transfer
 * @returns A transfer own-line arc
 */
export const generateTransferOwnLineArc: ArcGenerator<TrafficNodeItem> = (a, b, cost) => ({
  type: 'TransferOwnLine',
  ...buildWeakRefArc(a, b, cost)
})

/**
 * Generates an arc for transfers between different transportation lines
 * @param a - Source node
 * @param b - Target node
 * @param cost - Cost of the transfer
 * @returns A transfer other-line arc
 */
export const generateTransferOtherLineArc: ArcGenerator<TrafficNodeItem> = (a, b, cost) => ({
  type: 'TransferOtherLineArc',
  ...buildWeakRefArc(a, b, cost)
})
