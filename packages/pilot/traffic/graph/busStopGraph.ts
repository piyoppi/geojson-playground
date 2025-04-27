import { fromNeighborsPoints } from "../../graph/fromNeighborsNode.js"
import { TrafficGraphNode } from "./trafficGraph.js"
import type { BusStop } from "../busroute"
import type { RouteId } from "../transportation"

export type BusStopNode = TrafficGraphNode<BusStop>

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
          busStop => ({id: busStop.id,  item: busStop}),
          busStop => busStop.position
        )
      ])
  )
}
