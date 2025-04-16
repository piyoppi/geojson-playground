import { type GraphNode } from "./graph/graph"
import { BusStop } from "./busstop"
import { RouteName } from "./graph"
import { fromNeighborsPoints } from "./graph/fromNeighborsNode"

export type BusStopNode = BusStop & GraphNode

export const toBusStopGraph = (
  busStops: BusStop[],
): Map<RouteName, BusStopNode[]> => {
  return new Map(Map.groupBy(busStops, b => b.route)
    .entries()
    .toArray()
    .flatMap<[RouteName, BusStopNode[]]>(([routeName, busStops]) => [
      routeName,
      fromNeighborsPoints(
        busStops,
        busStop => ({ ...busStop }),
        busStop => busStop.position
      )
    ]))
}
