import { graphBuilder } from "../../graph/fromNeighborsNode.js"
import type { TrafficGraphNode } from "./trafficGraph"
import type { BusRoute, BusStop } from "../busroute"
import type { RouteId } from "../transportation"
import type { ArcGenerator } from "../../graph/arcGenerator"

export type BusStopNode = TrafficGraphNode<BusStop>

export const buildBusStopGraphGenerator = (
  generateArc: ArcGenerator<BusStopNode>
) => async (
  routes: BusRoute[],
): Promise<Map<RouteId, BusStopNode[]>> => {
  const fromNeighborsPoints = graphBuilder(generateArc)

  const busStops = routes.flatMap(b => b.stations)
  const routeById = new Map(routes.map(r => [r.id, r]))

  return new Map(
    await Promise.all(
     Map.groupBy(busStops, b => b.routeId)
      .entries()
      .map<Promise<[RouteId, BusStopNode[]]>>(async ([routeId, busStops]) => {
        const route = routeById.get(routeId)

        if (!route) {
          throw new Error(`Route is not found (routeId: ${routeId})`)
        }

        return [
          routeId,
          await fromNeighborsPoints(
            busStops,
            busStop => ({id: busStop.id, item: busStop, companyId: route.companyId}),
            busStop => busStop.position
          )
        ]
      })
      .toArray()
    )
  )
}
