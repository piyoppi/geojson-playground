import { type SerializedArc, SerializedGraphNode, serialize as serializedGraphNode, deserialize as deserializeGraphNode } from '../../graph/serialize.js'
import type { Position2D } from '../../geometry'
import type { TrafficGraphNode } from './trafficGraph'
import { type Station, stationIdToString } from '../transportation.js'

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

export const serialize = <T extends Station>(nodes: TrafficGraphNode<T>[]): SerializedTrafficGraph => {
  return serializedGraphNode(
    nodes,
    node => {
      const item = node.item

      if (!item) throw new Error('Item is not defined')

      return {
        id: node.id,
        arcs: node.arcs
      }
    }
  )
}

export const deserialize = <T extends Station>(serialized: SerializedTrafficGraph, stations: T[]): TrafficGraphNode<T>[] => {
  const stationsMap = new Map(stations.map(station => [stationIdToString(station.id), station]))

  return deserializeGraphNode(
    serialized,
    node => {
      const item = stationsMap.get(node.id)

      if (!item) throw new Error(`Station not found for routeId: ${node.routeId}`)

      return {
        item,
        id: item.id
      }
    }
  )
}
