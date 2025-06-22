import { buildGraphBuilder } from "../../../graph/builder/fromNeighborsNode.js"
import type { BusRoute } from "../../busroute.js"
import type { RouteId } from "../../transportation.js"
import { type TrafficNode, type TrafficNodeItem } from "../trafficGraph.js"
import type { ArcGenerator } from "../../../graph/arc/index.js"

export const buildBusStopGraphGenerator = (
  generateArc: ArcGenerator<TrafficNodeItem>
) => async (
  routes: BusRoute[],
): Promise<Map<RouteId, TrafficNode[]>> => {
  const fromNeighborsPoints = buildGraphBuilder(generateArc)

  const busStops = routes.flatMap(b => b.stations)
  const routeById = new Map(routes.map(r => [r.id, r]))

  const nodeMap = new Map(
    await Promise.all(
      Map.groupBy(busStops, b => b.routeIds[0])
        .entries()
        .map<Promise<[RouteId, TrafficNode[]]>>(async ([routeId, busStops]) => {
          const route = routeById.get(routeId)

          if (!route) {
            throw new Error(`Route is not found (routeId: ${routeId})`)
          }

          return [
            routeId,
            await fromNeighborsPoints(
              busStops,
              busStop => [
                busStop.id,
                {
                  type: 'Station',
                  station: busStop,
                  companyId: route.companyId,
                  groupId: busStop.groupId,
                  position: () => busStop.position
                }
              ],
              busStop => busStop.position
            )
          ]
        })
        .toArray()
    )
  )

  return nodeMap
}
