import { BusStop } from "../busstop.js"
import { RouteName } from "../graph.js"
import { fromNeighborsPoints } from "../graph/fromNeighborsNode.js"
import { TrafficGraphNode } from "./trafficGraph.js"

export type BusStopNode = BusStop & TrafficGraphNode

export const toBusStopGraph = (
  busStops: BusStop[],
): Map<RouteName, BusStopNode[]> => {
  return new Map(
    Map.groupBy(busStops, b => b.route)
      .entries()
      .toArray()
      .map<[RouteName, BusStopNode[]]>(([routeName, busStops]) => [
        routeName,
        fromNeighborsPoints(
          busStops,
          busStop => ({ ...busStop }),
          busStop => busStop.position
        )
      ])
  )
}
