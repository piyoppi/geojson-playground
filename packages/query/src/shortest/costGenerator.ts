import type { Arc } from '@piyoppi/sansaku-pilot/graph/arc/index.js'
import { isBusStopNode, isRailroadStationNode, type TrafficNode, type TrafficNodeItem, type BusStopNode } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph'
import { RouteId, type StationId } from '@piyoppi/sansaku-pilot/traffic/transportation'

type CostGeneratorOption = {
  busRouteWeight: number,
  busTransferWeight: number
}

export const buildCostGenerator = (
  startNode: TrafficNode,
  getGroupId: (id: StationId) => string | undefined,
  option: CostGeneratorOption = {
    busRouteWeight: 3,
    busTransferWeight: 1
  }
) => {
  return async (
    arc: Arc<TrafficNodeItem>,
    current: TrafficNode,
    next: TrafficNode
  ): Promise<number> => {
    if (isRailroadStationNode(current) && isRailroadStationNode(next)) {
      if (getGroupId(current.item.stationId) !== undefined &&
         getGroupId(current.item.stationId) === getGroupId(next.item.stationId) &&
         (current.id === startNode.id || next.id === startNode.id)) {
        return 0
      }
    } else if (isBusStopNode(current) && isBusStopNode(next)) {
      const currentRoutes = await getCurrentlyRidingBusRoutes(current, next)
      const nextRoutes = new Set(next.item.routeIds)

      const isTransfer = !currentRoutes.some(route => nextRoutes.has(route))

      const baseCost = arc.cost * option.busRouteWeight

      if (isTransfer) {
        return baseCost + option.busTransferWeight
      }

      return baseCost
    }

    return arc.cost
  }
}

const getCurrentlyRidingBusRoutes = async (
  current: BusStopNode,
  next: BusStopNode
): Promise<RouteId[]> => {
  const adjacentNodes = await Promise.all(
    current.arcs
      .filter(arc => arc.cost > 0)
      .map(async arc => {
        const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])
        const target = nodeA === current ? nodeB : nodeA
        return target
      })
  )

  const adjacentBusStops = adjacentNodes
    .filter((node): node is BusStopNode => !!node && isBusStopNode(node) && node.id !== next.id)

  if (adjacentBusStops.length === 0) {
    return current.item.routeIds
  }

  const allRouteSets = [...adjacentBusStops, current].map(stop => new Set(stop.item.routeIds))

  const commonRoutes = Array.from(allRouteSets[0]).filter(route =>
    allRouteSets.every(routeSet => routeSet.has(route))
  )

  return commonRoutes
}
