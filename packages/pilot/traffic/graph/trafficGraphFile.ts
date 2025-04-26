import { deserialize, serialize, type SerializedTrafficGraph } from "./serialize.js"
import { deserializeRailroad, serializeRailroad, type Railroad, type SerializedRailroad } from "../railroad.js"
import { deserializeBusRoute, serializedBusRoute, type BusRoute, type SerializedBusRoute } from "../busroute.js"
import type { StationNode } from "./stationGraph"
import type { TrafficGraphNode } from "./trafficGraph"

export type TrafficGraphFile = {
  graph: SerializedTrafficGraph,
  railroads: SerializedRailroad[],
  busRoutes: SerializedBusRoute[]
}

export const toTrafficGraphFile = (nodes: StationNode[], railroads: Railroad[], busRoutes: BusRoute[]): TrafficGraphFile => {
  const graph = serialize(nodes)

  return {
    graph,
    railroads: railroads.map(r => serializeRailroad(r)),
    busRoutes: busRoutes.map(b => serializedBusRoute(b))
  }
}

export const fromTrafficGraphFile = (data: TrafficGraphFile): {
  graph: TrafficGraphNode[],
  railroads: Railroad[],
  busRoutes: BusRoute[]
} => {
  return {
    graph: deserialize(data.graph),
    railroads: data.railroads.map(r => deserializeRailroad(r)),
    busRoutes: data.busRoutes.map(b => deserializeBusRoute(b))
  }
}
