import type { BusStop } from "../busroute.js"
import { RouteId } from "../graph.js"
import { fromNeighborsPoints } from "../graph/fromNeighborsNode.js"
import { TrafficGraphNode } from "./trafficGraph.js"

export type BusStopNode = BusStop & TrafficGraphNode

export const toBusStopGraph = (
  busStops: BusStop[],
): Map<RouteId, BusStopNode[]> => {
  return new Map(
    Map.groupBy(busStops, b => b.routeId)
      .entries()
      .toArray()
      .map<[RouteId, BusStopNode[]]>(([routeId, busStops]) => [
        routeId,
        fromNeighborsPoints(
          busStops,
          busStop => ({ ...busStop }),
          busStop => busStop.position
        )
      ])
  )
}
