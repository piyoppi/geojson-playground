import { TrafficGraphDeserializer, serialize, type SerializedTrafficGraph } from "./serialize.js"
import { deserializeRailroad, serializeRailroad, type Railroad, type SerializedRailroad } from "../railroad.js"
import { deserializeBusRoute, serializedBusRoute, type BusRoute, type SerializedBusRoute } from "../busroute.js"
import { deserializeCompany, serializeCompany, type Company, type SerializedCompany, type Station } from "../transportation.js"
import type { StationNode } from "./stationGraph"
import type { TrafficGraphNode } from "./trafficGraph"

export type TrafficGraphFile = {
  graph: SerializedTrafficGraph,
  railroads: SerializedRailroad[],
  busRoutes: SerializedBusRoute[],
  companies: SerializedCompany[]
}

export const toTrafficGraphFile = async (nodes: StationNode[], companies: Company[], railroads: Railroad[], busRoutes: BusRoute[]): Promise<TrafficGraphFile> => {
  const graph = await serialize(nodes)

  return {
    graph,
    companies: companies.map(c => serializeCompany(c)),
    railroads: railroads.map(r => serializeRailroad(r)),
    busRoutes: busRoutes.map(b => serializedBusRoute(b))
  }
}

export const buildTrafficGraphFromFile = (
  deserialize: TrafficGraphDeserializer
) => (
  data: TrafficGraphFile
): {
  graph: TrafficGraphNode<Station>[],
  companies: Company[],
  railroads: Railroad[],
  busRoutes: BusRoute[]
} => {
  const railroads = data.railroads.map(r => deserializeRailroad(r))
  const busRoutes = data.busRoutes.map(b => deserializeBusRoute(b))
  const routes = [...railroads, ...busRoutes]

  return {
    graph: deserialize(data.graph, routes),
    companies: data.companies.map(c => deserializeCompany(c)),
    railroads: data.railroads.map(r => deserializeRailroad(r)),
    busRoutes: data.busRoutes.map(b => deserializeBusRoute(b))
  }
}
