import { type SerializedArc, SerializedGraphNode, serialize as serializedGraphNode, GraphDeserializer as GraphNodeDeserializer } from '../../graph/serialize.js'
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

export const serialize = async <T extends Station>(nodes: TrafficGraphNode<T>[]): Promise<SerializedTrafficGraph> => {
  const serialized = await serializedGraphNode(nodes)

  return {
    arcs: serialized.arcs
  }
}

export type TrafficGraphDeserializer = ReturnType<typeof buildTrafficGraphDeserializer>
export const buildTrafficGraphDeserializer = (
  deserializeGraphNode: GraphNodeDeserializer
) => <T extends Station>(
  serialized: SerializedTrafficGraph,
  stations: T[]
): TrafficGraphNode<T>[] => {
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
