import { graphBuilder } from "../../graph/fromNeighborsNode.js"
import type { BusRoute, BusStop } from "../busroute.js"
import type { RouteId } from "../transportation.js"
import type { ArcGenerator } from "../../graph/arcGenerator.js"
import { TrafficGraphNode, TrafficItem } from "./trafficGraph.js"
import { Arc } from "../../graph/arc.js"

export type BusRouteArc = Arc<BusStop>

export const buildBusStopGraphGenerator = (
  generateArc: ArcGenerator<TrafficItem>
) => async (
  routes: BusRoute[],
): Promise<Map<RouteId, TrafficGraphNode[]>> => {
  const fromNeighborsPoints = graphBuilder(generateArc)

  const busStops = routes.flatMap(b => b.stations)
  const routeById = new Map(routes.map(r => [r.id, r]))

  return new Map(
    await Promise.all(
     Map.groupBy(busStops, b => b.routeId)
      .entries()
      .map<Promise<[RouteId, TrafficGraphNode[]]>>(async ([routeId, busStops]) => {
        const route = routeById.get(routeId)

        if (!route) {
          throw new Error(`Route is not found (routeId: ${routeId})`)
        }

        return [
          routeId,
          await fromNeighborsPoints(
            busStops,
            busStop => [busStop.id, {station: busStop, companyId: route.companyId}],
            busStop => busStop.position
          )
        ]
      })
      .toArray()
    )
  )
}
