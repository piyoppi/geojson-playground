import { type SerializedArc, SerializedGraphNode, serialize as serializedGraphNode, deserialize as deserializeGraphNode } from '../../graph/serialize.js'
import type { Position2D } from '../../geometry'
import type { TrafficGraphNode } from './trafficGraph'
import { hexStringToRouteId, routeIdToString } from '../transportation.js'

type SerializedTrafficGraphNode = SerializedGraphNode & {
  position: Position2D
  name: string
  routeId: string
}

export type SerializedTrafficGraph = {
  nodes: SerializedTrafficGraphNode[],
  arcs: SerializedTrafficArc[]
}

type SerializedTrafficArc = SerializedArc

export const serialize = (nodes: TrafficGraphNode[]): SerializedTrafficGraph =>
  serializedGraphNode(
    nodes,
    node => ({...node, routeId: routeIdToString(node.routeId)})
  )

export const deserialize = (serialized: SerializedTrafficGraph): TrafficGraphNode[] => 
  deserializeGraphNode(
    serialized,
    node => ({...node, routeId: hexStringToRouteId(node.routeId)})
  )
