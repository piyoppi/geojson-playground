import type { Arc } from '@piyoppi/sansaku-pilot/graph/arc/index.js'
import type { BusRoute } from '@piyoppi/sansaku-pilot/traffic/busroute'
import type { TrafficNode, TrafficNodeItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph'
import type { RouteId } from '@piyoppi/sansaku-pilot/traffic/transportation'

type CostGeneratorOption = {
  busRouteWeight: number
}

export const buildCostGenerator = (
  getBusRoute: (id: RouteId) => BusRoute | undefined,
  startNode: TrafficNode,
  option: CostGeneratorOption = {
    busRouteWeight: 3
  }
) => (
  arc: Arc<TrafficNodeItem>, 
  a: TrafficNode, 
  b: TrafficNode
): number => {
  if (a.item.type === 'Station' && b.item.type === 'Station') {
    if (a.item.station.groupId !== undefined &&
       a.item.station.groupId === b.item.station.groupId &&
       (a.id === startNode.id || b.id === startNode.id)) {
      return 0
    }

    if (a.item.station.routeIds.some(rid => getBusRoute(rid)) && b.item.station.routeIds.some(rid => getBusRoute(rid))) {
      return arc.cost * option.busRouteWeight
    }
  }

  return arc.cost
}
