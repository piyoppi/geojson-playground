import { TrafficGraphDeserializer, serialize, type SerializedTrafficGraph } from "./serialize.js"
import { deserializeRailroad, serializeRailroad, type Railroad, type SerializedRailroad } from "../railroad.js"
import { deserializeBusRoute, serializedBusRoute, type BusRoute, type SerializedBusRoute } from "../busroute.js"
import type { StationNode } from "./stationGraph"
import type { TrafficGraphNode } from "./trafficGraph"
import type { Station } from "../transportation.js"

export type TrafficGraphFile = {
  graph: SerializedTrafficGraph,
  railroads: SerializedRailroad[],
  busRoutes: SerializedBusRoute[]
}

export const toTrafficGraphFile = async (nodes: StationNode[], railroads: Railroad[], busRoutes: BusRoute[]): Promise<TrafficGraphFile> => {
  const graph = await serialize(nodes)

  return {
    graph,
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
  railroads: Railroad[],
  busRoutes: BusRoute[]
} => {
  const railroads = data.railroads.map(r => deserializeRailroad(r))
  const busRoutes = data.busRoutes.map(b => deserializeBusRoute(b))
  const stations = [...railroads, ...busRoutes].flatMap(r => r.stations)

  return {
    graph: deserialize(data.graph, stations),
    railroads: data.railroads.map(r => deserializeRailroad(r)),
    busRoutes: data.busRoutes.map(b => deserializeBusRoute(b))
  }
}
