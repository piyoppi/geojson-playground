import {
  type SerializedArc,
  type GraphDeserializer as GraphNodeDeserializer,
  serialize as serializedGraphNode
} from '../../graph/serialize.js'
import { Junction, junctionIdToString, type Route, type Station, stationIdToString } from '../transportation.js'
import { createJunctionNodeItem, createStationNodeItem, filterJunctionNodes, TrafficGraphNode, TrafficNodeItem } from './trafficGraph.js'

export type SerializedTrafficGraph = {
  arcs: SerializedArc[]
  junctions: Junction[]
}

export const serialize = async (nodes: TrafficGraphNode[]): Promise<SerializedTrafficGraph> => {
  const serialized = await serializedGraphNode(nodes)

  return {
    arcs: serialized.arcs,
    junctions: filterJunctionNodes(nodes).map(n => n.item.junction)
  }
}

export type TrafficGraphDeserializer = ReturnType<typeof buildTrafficGraphDeserializer>
export const buildTrafficGraphDeserializer = (
  deserializeGraphNode: GraphNodeDeserializer<TrafficNodeItem>
) => async (
  serialized: SerializedTrafficGraph,
  routes: Route<Station>[],
): Promise<TrafficGraphNode[]> => {
  const stations = routes.flatMap(r => r.stations)
  const junctions = serialized.junctions
  const stationsById = new Map(stations.map(station => [stationIdToString(station.id), station]))
  const junctionsById = new Map(junctions.map(junction => [junctionIdToString(junction.id), junction]))
  const routeByStationId = new Map(routes.flatMap(r => r.stations.map(s => [stationIdToString(s.id), r])))
  const routeByJunctionId = new Map(routes.flatMap(r => junctions.map(j => [junctionIdToString(j.id), r])))

  return deserializeGraphNode(
    [...stations, ...junctions],
    serialized,
    (item, stringId) => {
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
