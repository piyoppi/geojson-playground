import { TrafficGraphDeserializer, serialize, type SerializedTrafficGraph } from "./graph/serialize.js"
import { deserializeRailroad, serializeRailroad, type RailroadRoute, type SerializedRailroad } from "./railroad.js"
import { deserializeBusRoute, serializedBusRoute, type BusRoute, type SerializedBusRoute } from "./busroute.js"
import { deserializeCompany, serializeCompany, type Company, type SerializedCompany } from "./transportation.js"
import { type TrafficNode } from "./graph/trafficGraph.js"

export type TrafficGraphFile = {
  graph: SerializedTrafficGraph,
  railroads: SerializedRailroad[],
  busRoutes: SerializedBusRoute[],
  companies: SerializedCompany[],
}

export const toTrafficGraphFile = async (
  nodes: TrafficNode[],
  companies: Company[],
  railroads: RailroadRoute[],
  busRoutes: BusRoute[]
): Promise<TrafficGraphFile> => {
  const graph = await serialize(nodes)

  return {
    graph,
    companies: companies.map(c => serializeCompany(c)),
    railroads: railroads.map(r => serializeRailroad(r)),
    busRoutes: busRoutes.map(b => serializedBusRoute(b)),
  }
}

export const buildTrafficGraphFromFile = (
  deserialize: TrafficGraphDeserializer
) => async (
  data: TrafficGraphFile
): Promise<{
  graph: TrafficNode[],
  companies: Company[],
  railroads: RailroadRoute[],
  busRoutes: BusRoute[]
}> => {
  return {
    graph: await deserialize(data.graph),
    companies: data.companies.map(c => deserializeCompany(c)),
    railroads: data.railroads.map(r => deserializeRailroad(r)),
    busRoutes: data.busRoutes.map(b => deserializeBusRoute(b))
  }
}
