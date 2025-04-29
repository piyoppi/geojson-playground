import { graphBuilder } from "../../graph/fromNeighborsNode.js"
import { TrafficGraphNode } from "./trafficGraph.js"
import type { BusStop } from "../busroute"
import type { RouteId } from "../transportation"
import { ArcGenerator } from "../../graph/arcGenerator.js"

export type BusStopNode = TrafficGraphNode<BusStop>

export const buildBusStopGraphGenerator = (
  generateArc: ArcGenerator
) => (
  busStops: BusStop[],
): Map<RouteId, BusStopNode[]> => {
  const fromNeighborsPoints = graphBuilder(generateArc)
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
