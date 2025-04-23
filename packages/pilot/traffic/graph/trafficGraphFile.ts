import { serialize, type SerializedTrafficGraph } from "./serialize.js"
import type { Railroad } from "../railroad"
import type { StationNode } from "./stationGraph"
import type { BusRoute } from "../busroute"

export type TrafficGraphFile = {
  graph: SerializedTrafficGraph,
  railroads: Railroad[],
  busRoutes: BusRoute[]
}

export const toTrafficGraphFile = (nodes: StationNode[], railroads: Railroad[], busRoutes: BusRoute[]): TrafficGraphFile => {
  const graph = serialize(nodes)

  return {
    graph,
    railroads,
    busRoutes
  }
}
