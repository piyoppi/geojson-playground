import {
  type GraphDeserializer as GraphNodeDeserializer,
  serialize as serializedGraphNode,
  SerializedGraph
} from '../../graph/serialize.js'
import {
  deserializeBusStopNodeItem,
  deserializeJunctionNodeItem,
  deserializeRailroadStationNodeItem,
  isBusStopNodeItem,
  isJunctionNodeItem,
  isRailroadStationNodeItem,
  isSerializedBusStopNodeItem,
  isSerializedJunctionNodeItem,
  isSerializedRailroadStationNodeItem,
  serializeBusStopNodeItem,
  SerializedBusStopNodeItem,
  SerializedJunctionNodeItem,
  SerializedRailroadStationNodeItem,
  serializeJunctionNodeItem,
  serializeRailroadStationNodeItem,
  TrafficNode,
  TrafficNodeItem
} from './trafficGraph.js'

export type SerializedTrafficGraph = SerializedGraph<SerializedJunctionNodeItem | SerializedRailroadStationNodeItem | SerializedBusStopNodeItem>

export const serialize = async (nodes: TrafficNode[]): Promise<SerializedTrafficGraph> => {
  const itemSerializer = (item: TrafficNodeItem) => {
    if (isJunctionNodeItem(item)) {
      return serializeJunctionNodeItem(item)
    } else if (isRailroadStationNodeItem(item)) {
      return serializeRailroadStationNodeItem(item)
    } else if (isBusStopNodeItem(item)) {
      return serializeBusStopNodeItem(item)
    }

    throw new Error('Unexpected type of node was given.')
  }

  const serialized = await serializedGraphNode(nodes, itemSerializer)

  return serialized
}

export type TrafficGraphDeserializer = ReturnType<typeof buildTrafficGraphDeserializer>
export const buildTrafficGraphDeserializer = (
  deserializeGraphNode: GraphNodeDeserializer<TrafficNodeItem>
) => async (
  serialized: SerializedTrafficGraph,
): Promise<TrafficNode[]> => {
  return deserializeGraphNode(
    serialized,
    serializedItem => {
      if (isSerializedRailroadStationNodeItem(serializedItem)) {
        return deserializeRailroadStationNodeItem(serializedItem)
      } else if (isSerializedBusStopNodeItem(serializedItem)) {
        return deserializeBusStopNodeItem(serializedItem)
      } else if (isSerializedJunctionNodeItem(serializedItem)) {
        return deserializeJunctionNodeItem(serializedItem)
      }

      throw new Error(`Station or Junction is not found for id: ${stringId}`)
    }
  )
}
