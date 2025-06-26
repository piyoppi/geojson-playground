import { buildGraphBuilder } from "../../../graph/builder/fromNeighborsNode.js"
import type { BusRoute } from "../../busroute.js"
import type { RouteId } from "../../transportation.js"
import { createBusStopNodeItem, filterStationNodes, type TrafficNode, type TrafficNodeItem } from "../trafficGraph.js"
import type { ArcGenerator } from "../../../graph/arc/index.js"
import { toId } from "../../../utils/Id.js"

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
      Map.groupBy(busStops, b => b.routeId)
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
                createBusStopNodeItem([busStop], route.companyId)
              ],
              busStop => busStop.position
            )
          ]
        })
        .toArray()
    )
  )

  // [TODO] Spatial index
  const nodePositionIndex = Map.groupBy(
    filterStationNodes(nodeMap.values().toArray().flat()),
    n => [n.item.station.name, ...n.item.station.position].join(',')
  )

  for (const [key, nodes] of nodePositionIndex) {
    if (nodes.length > 1) {
      const positionIndex = await toId(key)
      for (const node of nodes) {
        node.item.station.groupId = positionIndex
      }
    }
  }


  return nodeMap
}
