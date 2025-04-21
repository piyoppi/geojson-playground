import { Position2D } from '../geometry.js'
import { SerializedArc, SerializedGraphNode, serialize as serializedGraphNode, deserialize as deserializeGraphNode } from '../graph/serialize.js'
import type { TrafficGraphNode } from './trafficGraph'

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

export const serialize = (nodes: TrafficGraphNode[]): SerializedTrafficGraph => {
  return serializedGraphNode(nodes)
}

export const deserialize = (serialized: SerializedTrafficGraph): TrafficGraphNode[] => {
  return deserializeGraphNode(serialized)
}
