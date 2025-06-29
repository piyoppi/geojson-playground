import { TrafficGraphDeserializer, serialize, type SerializedTrafficGraph } from "./graph/serialize.js"
import { deserializeRailroad, serializeRailroad, type Railroad, type SerializedRailroad } from "./railroad.js"
import { deserializeBusRoute, serializedBusRoute, type BusRoute, type SerializedBusRoute } from "./busroute.js"
import { deserializeCompany, Junction, serializeCompany, type Company, type SerializedCompany } from "./transportation.js"
import { isBusStopNode, isRailroadStationNode, isJunctionNode, filterJunctionNodes, type TrafficNode } from "./graph/trafficGraph.js"

export type TrafficGraphFile = {
  graph: SerializedTrafficGraph,
  graphItemIdMap: Record<string, string[]>
  railroads: SerializedRailroad[],
  busRoutes: SerializedBusRoute[],
  companies: SerializedCompany[],
  junctions: Junction[]
}

export const toTrafficGraphFile = async (
  nodes: TrafficNode[],
  companies: Company[],
  railroads: Railroad[],
  busRoutes: BusRoute[]
): Promise<TrafficGraphFile> => {
  const graph = await serialize(nodes)

  const graphItemIdMap = Object.fromEntries(
    nodes
      .map(node =>
        isBusStopNode(node) ? [node.id, node.item.busStops.map(b => b.id)] :
        isRailroadStationNode(node) ? [node.id, [node.item.station.id]] :
        isJunctionNode(node) ? [node.id, [node.item.junction.id]] :
        []
      )
      .filter(v => v.length === 2)
  )

  return {
    graph,
    graphItemIdMap,
    companies: companies.map(c => serializeCompany(c)),
    railroads: railroads.map(r => serializeRailroad(r)),
    busRoutes: busRoutes.map(b => serializedBusRoute(b)),
    junctions: filterJunctionNodes(nodes).map(n => n.item.junction)
  }
}

export const buildTrafficGraphFromFile = (
  deserialize: TrafficGraphDeserializer
) => async (
  data: TrafficGraphFile
): Promise<{
  graph: TrafficNode[],
  companies: Company[],
  railroads: Railroad[],
  busRoutes: BusRoute[]
}> => {
  const railroads = data.railroads.map(r => deserializeRailroad(r))
  const busRoutes = data.busRoutes.map(b => deserializeBusRoute(b))
  const routes = [...railroads, ...busRoutes]

  return {
    graph: await deserialize(data.graph, routes),
    companies: data.companies.map(c => deserializeCompany(c)),
    railroads: data.railroads.map(r => deserializeRailroad(r)),
    busRoutes: data.busRoutes.map(b => deserializeBusRoute(b))
  }
}
