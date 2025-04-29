import { graphBuilder } from "../../graph/fromNeighborsNode.js"
import { TrafficGraphNode } from "./trafficGraph.js"
import type { BusStop } from "../busroute"
import type { RouteId } from "../transportation"
import { ArcGenerator } from "../../graph/arcGenerator.js"

export type BusStopNode = TrafficGraphNode<BusStop>

export const buildBusStopGraphGenerator = (
  generateArc: ArcGenerator
) => async (
  busStops: BusStop[],
): Promise<Map<RouteId, BusStopNode[]>> => {
  const fromNeighborsPoints = graphBuilder(generateArc)
  return new Map(
    await Promise.all(
     Map.groupBy(busStops, b => b.routeId)
      .entries()
      .map<Promise<[RouteId, BusStopNode[]]>>(async ([routeId, busStops]) => [
        routeId,
        await fromNeighborsPoints(
          busStops,
          busStop => ({id: busStop.id,  item: busStop}),
          busStop => busStop.position
        )
      ])
      .toArray()
    )
  )
}
