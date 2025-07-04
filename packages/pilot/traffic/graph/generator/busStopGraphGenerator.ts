import { buildGraphBuilder } from "../../../graph/builder/fromNeighborsNode.js"
import type { BusRoute } from "../../busroute.js"
import { BusStopNodeItem, createBusStopNodeItem, type TrafficNode } from "../trafficGraph.js"
import type { ArcGenerator } from "../../../graph/arc/index.js"
import { buildDuplicateNodesMarger, buildNodeMerger } from "../../../graph/graph.js"

export const buildBusStopGraphGenerator = (
  generateArc: ArcGenerator<BusStopNodeItem>,
) => async (
  routes: BusRoute[],
): Promise<TrafficNode[]> => {
  const fromNeighborsPoints = buildGraphBuilder(generateArc)
  const busStops = routes.flatMap(b => b.stations)
  const routeById = new Map(routes.map(r => [r.id, r]))

  const busStopByRoute = Map.groupBy(busStops, b => b.routeId)

  const nodes = []
  for (const [routeId, busStops] of busStopByRoute) {
    const route = routeById.get(routeId)

    if (!route) {
      throw new Error(`Route is not found (routeId: ${routeId})`)
    }

    const routeNodes = await fromNeighborsPoints(
      busStops,
      busStop => [
        busStop.id,
        createBusStopNodeItem([busStop])
      ],
      busStop => busStop.position
    )

    nodes.push(...routeNodes)
  }

  //
  //  [A (Route 1)] ----- [B (Route 1)]         [A (Route1, Route2] ----- [B (Route 1)]
  //  [A (Route 1)] --+                    =>            |
  //                  |                                  |
  //                  +-- [C (Route 2)]                  +--------------- [C (Route 2)]
  //
  const busStopById = new Map(busStops.map(b => [b.id, b]))
  const mergeDuplicateBusStopNode = buildDuplicateNodesMarger<BusStopNodeItem>(
    buildNodeMerger(generateArc),
    n => {
      const nodeItemId = n.item.busStopIds[0]
      return nodeItemId ? busStopById.get(nodeItemId)?.groupId : undefined
    }
  )

  const merged = await mergeDuplicateBusStopNode(
    nodes,
    (merged, targets) => {
      const busStops = []
      for (const target of targets) {
        busStops.push(...target.item.busStopIds)
      }
      merged.item.busStopIds = busStops
    }
  )

  return merged
}
