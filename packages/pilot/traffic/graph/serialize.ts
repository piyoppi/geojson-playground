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
  arcs: SerializedTrafficArc[]
}

type SerializedTrafficArc = SerializedArc

export const serialize = <T extends Station>(nodes: TrafficGraphNode<T>[]): SerializedTrafficGraph => {
  const serialized = serializedGraphNode(nodes)

  return {
    arcs: serialized.arcs
  }
}

export const deserialize = <T extends Station>(serialized: SerializedTrafficGraph, stations: T[]): TrafficGraphNode<T>[] => {
  const stationsMap = new Map(stations.map(station => [stationIdToString(station.id), station]))

  return deserializeGraphNode(
    stations,
    serialized,
    (node, stringId) => {
      const item = stationsMap.get(stringId)

      if (!item) {
        throw new Error(`Station not found for id: ${stringId}`)
      }

      return {
        id: node.id,
        arcs: [],
        item
      }
    }
  )
}
