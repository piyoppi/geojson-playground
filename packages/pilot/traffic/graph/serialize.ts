import { type SerializedArc, type GraphDeserializer as GraphNodeDeserializer, serialize as serializedGraphNode } from '../../graph/serialize.js'
import { type Route, type Station, stationIdToString } from '../transportation.js'

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
) => <S extends Station>(
  serialized: SerializedTrafficGraph,
  routes: Route<S>[],
): TrafficGraphNode<S>[] => {
  const stations = routes.flatMap(r => r.stations)
  const stationsById = new Map(stations.map(station => [stationIdToString(station.id), station]))
  const routeByStationId = new Map(routes.flatMap(r => r.stations.map(s => [stationIdToString(s.id), r])))

  return deserializeGraphNode(
    stations,
    serialized,
    (node, stringId) => {
      const item = stationsById.get(stringId)
      if (!item) {
        throw new Error(`Station not found for id: ${stringId}`)
      }

      const route = routeByStationId.get(stringId)
      if (!route) {
        throw new Error(`Route for station not found for id: ${stringId}`)
      }

      return {
        id: node.id,
        arcs: [],
        companyId: route.companyId,
        item
      }
    }
  )
}
