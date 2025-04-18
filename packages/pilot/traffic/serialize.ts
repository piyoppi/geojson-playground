import { Position2D } from '../geometry'
import { SerializedArc, SerializedGraphNode, serialize as serializedGraphNode, deserialize as deserializeGraphNode } from '../graph/serialize'
import type { TrafficGraphNode } from './trafficGraph'

type SerializedTrafficGraphNode = SerializedGraphNode & {
  position: Position2D
  name: string
}

type SerializedTrafficArc = SerializedArc

export const serialize = (nodes: TrafficGraphNode[]): { nodes: SerializedTrafficGraphNode[], arcs: SerializedTrafficArc[] } => {
  return serializedGraphNode(nodes)
}

export const deserialize = (serialized: { nodes: SerializedTrafficGraphNode[], arcs: SerializedTrafficArc[] }): TrafficGraphNode[] => {
  return deserializeGraphNode(serialized)
}
