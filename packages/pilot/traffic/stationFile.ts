import { serialize, type SerializedTrafficGraph } from "./serialize.js"
import type { Railroad } from "../railroad"
import type { StationNode } from "./stationGraph"

export type StationFile = {
  graph: SerializedTrafficGraph,
  railroads: Railroad[]
}

export const toStationFile = (nodes: StationNode[], railroads: Railroad[]): StationFile => {
  const graph = serialize(nodes)

  return {
    graph,
    railroads
  }
}
