import { fromNeighborsPoints } from "../graph/fromNeighborsNode.js"
import { TrafficGraphNode } from "./trafficGraph.js"
import type { BusStop } from "../busroute"
import type { RouteId } from "../graph"

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
