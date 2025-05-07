import {
  type SerializedArc,
  type GraphDeserializer as GraphNodeDeserializer,
  serialize as serializedGraphNode
} from '../../graph/serialize.js'
import { type Route, type Station, stationIdToString } from '../transportation.js'
import { TrafficGraphNode, TrafficItem } from './trafficGraph.js'

export type SerializedTrafficGraph = {
  arcs: SerializedTrafficArc[]
}

type SerializedTrafficArc = SerializedArc

export const serialize = async (nodes: TrafficGraphNode[]): Promise<SerializedTrafficGraph> => {
  const serialized = await serializedGraphNode(nodes)

  return {
    arcs: serialized.arcs
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
  const stationsById = new Map(stations.map(station => [stationIdToString(station.id), station]))
  const routeByStationId = new Map(routes.flatMap(r => r.stations.map(s => [stationIdToString(s.id), r])))

  return deserializeGraphNode(
    stations,
    serialized,
    (item, stringId) => {
      const station = stationsById.get(stringId)
      if (!station) {
        throw new Error(`Station not found for id: ${stringId}`)
      }

      const route = routeByStationId.get(stringId)
      if (!route) {
        throw new Error(`Route for station not found for id: ${stringId}`)
      }

      return {
        id: item.id,
        arcs: [],
        item: {
          companyId: route.companyId,
          station
        }
      }
    }
  )
}
