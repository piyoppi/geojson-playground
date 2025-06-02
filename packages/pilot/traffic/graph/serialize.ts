import {
  type SerializedArc,
  type GraphDeserializer as GraphNodeDeserializer,
  serialize as serializedGraphNode
} from '../../graph/serialize.js'
import { Junction, junctionIdToString, type Route, type Station, stationIdToString } from '../transportation.js'
import { toJunctionNodes, TrafficGraphNode, TrafficItem } from './trafficGraph.js'

export type SerializedTrafficGraph = {
  arcs: SerializedArc[]
  junctions: Junction[]
}

export const serialize = async (nodes: TrafficGraphNode[]): Promise<SerializedTrafficGraph> => {
  const serialized = await serializedGraphNode(nodes)

  return {
    arcs: serialized.arcs,
    junctions: toJunctionNodes(nodes).map(n => n.item.junction)
  }
}

export type TrafficGraphDeserializer = ReturnType<typeof buildTrafficGraphDeserializer>
export const buildTrafficGraphDeserializer = (
  deserializeGraphNode: GraphNodeDeserializer<TrafficItem>
) => (
  serialized: SerializedTrafficGraph,
  routes: Route<Station>[],
): TrafficGraphNode[] => {
  const stations = routes.flatMap(r => r.stations)
  const junctions = serialized.junctions
  const stationsById = new Map(stations.map(station => [stationIdToString(station.id), station]))
  const junctionsById = new Map(junctions.map(junction => [junctionIdToString(junction.id), junction]))
  const routeByStationId = new Map(routes.flatMap(r => r.stations.map(s => [stationIdToString(s.id), r])))

  return deserializeGraphNode(
    [...stations, ...junctions],
    serialized,
    (item, stringId) => {
      const station = stationsById.get(stringId)

      const route = routeByStationId.get(stringId)
      if (!route) {
        throw new Error(`Route for station not found for id: ${stringId}`)
      }

      if (station) {
        return {
          id: item.id,
          arcs: [],
          item: {
            type: 'Station',
            companyId: route.companyId,
            station,
            position: () => station.position
          }
        }
      }

      const junction = junctionsById.get(stringId)

      if (junction) {
        return {
          id: item.id,
          arcs: [],
          item: {
            type: 'Junction',
            companyId: route.companyId,
            junction,
            position: () => junction.position
          }
        }
      }

      throw new Error(`Station or Junction is not found for id: ${stringId}`)
    }
  )
}
