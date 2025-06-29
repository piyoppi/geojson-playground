import {
  type SerializedArc,
  type GraphDeserializer as GraphNodeDeserializer,
  serialize as serializedGraphNode,
  SerializedGraph
} from '../../graph/serialize.js'
import { Junction, junctionIdToString, type Route, type Station, stationIdToString } from '../transportation.js'
import { createJunctionNodeItem, createStationNodeItem, filterJunctionNodes, TrafficNode, TrafficNodeItem } from './trafficGraph.js'

export type SerializedTrafficGraph = SerializedGraph

export const serialize = async (nodes: TrafficNode[]): Promise<SerializedTrafficGraph> => {
  const serialized = await serializedGraphNode(nodes)

  return serialized
}

export type TrafficGraphDeserializer = ReturnType<typeof buildTrafficGraphDeserializer>
export const buildTrafficGraphDeserializer = (
  deserializeGraphNode: GraphNodeDeserializer<TrafficNodeItem>
) => async (
  serialized: SerializedTrafficGraph,
  routes: Route<Station>[],
): Promise<TrafficNode[]> => {
  const stations = routes.flatMap(r => r.stations)
  const junctions = serialized.junctions
  const nodeIdItemMap = serialized.

  return deserializeGraphNode(
    serialized,
    serializedNode => {
      const station = stationsById.get(stringId)

      if (station) {
        const route = routeByStationId.get(stringId)
        if (!route) {
          throw new Error(`Route for station not found for id: ${stringId}`)
        }

        return {
          id: item.id,
          arcs: [],
          item: createStationNodeItem(station, route.companyId)
        }
      }

      const junction = junctionsById.get(stringId)

      if (junction) {
        const route = routeByJunctionId.get(stringId)
        if (!route) {
          throw new Error(`Route for station not found for id: ${stringId}`)
        }

        return {
          id: item.id,
          arcs: [],
          item: createJunctionNodeItem(junction, route.companyId)
        }
      }

      throw new Error(`Station or Junction is not found for id: ${stringId}`)
    }
  )
}
