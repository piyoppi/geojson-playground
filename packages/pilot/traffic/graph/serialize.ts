import {
  type GraphDeserializer as GraphNodeDeserializer,
  serialize as serializedGraphNode,
  SerializedGraph
} from '../../graph/serialize.js'
import { Junction, junctionIdToString, type Route, type Station, stationIdToString } from '../transportation.js'
import { createJunctionNodeItem, createStationNodeItem, TrafficNode, TrafficNodeItem } from './trafficGraph.js'

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
  junctions?: Junction[]
): Promise<TrafficNode[]> => {
  // Create maps for efficient lookups
  const stationsById = new Map<string, Station>()
  const routeByStationId = new Map<string, Route<Station>>()

  routes.forEach(route => {
    route.stations.forEach(station => {
      stationsById.set(stationIdToString(station.id), station)
      routeByStationId.set(stationIdToString(station.id), route)
    })
  })

  const junctionsById = new Map<string, Junction>()
  junctions?.forEach(junction => {
    junctionsById.set(junctionIdToString(junction.id), junction)
  })

  return deserializeGraphNode(
    serialized,
    serializedNode => {
      const stringId = serializedNode.id
      const station = stationsById.get(stringId)

      if (station) {
        return {
          id: serializedNode.id,
          arcs: [],
          item: createStationNodeItem(station)
        }
      }

      const junction = junctionsById.get(stringId)

      if (junction) {
        return {
          id: serializedNode.id,
          arcs: [],
          item: createJunctionNodeItem(junction)
        }
      }

      throw new Error(`Station or Junction is not found for id: ${stringId}`)
    }
  )
}
