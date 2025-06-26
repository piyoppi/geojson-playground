import { buildGraphBuilder } from "../../../graph/builder/fromNeighborsNode.js"
import type { BusRoute } from "../../busroute.js"
import type { RouteId, CompanyId } from "../../transportation.js"
import { CompanyId as createCompanyId } from "../../transportation.js"
import { createBusStopNodeItem, filterStationNodes, type TrafficNode, type TrafficNodeItem } from "../trafficGraph.js"
import type { ArcGenerator } from "../../../graph/arc/index.js"

export const buildBusStopGraphGenerator = (
  generateArc: ArcGenerator<TrafficNodeItem>
) => async (
  routes: BusRoute[],
): Promise<Map<RouteId, TrafficNode[]>> => {
  const fromNeighborsPoints = buildGraphBuilder(generateArc)

  const busStops = routes.flatMap(b => b.stations)
  const routeById = new Map(routes.map(r => [r.id, r]))

  const busStopsByGroupId = Map.groupBy(busStops, s => s.groupId || s.id)

  const nodesByGroupId = new Map<string, TrafficNode>()

  for (const [groupId, stationsInGroup] of busStopsByGroupId) {
    const companyIds = new Set<CompanyId>()
    for (const station of stationsInGroup) {
      const route = routeById.get(station.routeId)
      if (route) {
        companyIds.add(route.companyId)
      }
    }

    const companyId = companyIds.values().next().value
    if (!companyId) {
      throw new Error(`No route found for stations in group ${groupId}`)
    }

    const node = await fromNeighborsPoints(
      [stationsInGroup[0]],
      _ => [
        groupId,
        createBusStopNodeItem(stationsInGroup, companyId)
      ],
      s => s.position
    )

    nodesByGroupId.set(groupId, node[0])
  }

  const nodeMap = new Map<RouteId, TrafficNode[]>()

  for (const [routeId, route] of routes.map(r => [r.id, r] as const)) {
    const nodesForRoute: TrafficNode[] = []
    const addedGroupIds = new Set<string>()

    for (const station of route.stations) {
      const groupId = station.groupId || station.id
      if (!addedGroupIds.has(groupId)) {
        const node = nodesByGroupId.get(groupId)
        if (node) {
          nodesForRoute.push(node)
          addedGroupIds.add(groupId)
        }
      }
    }

    nodeMap.set(routeId, nodesForRoute)
  }

  return nodeMap
}
