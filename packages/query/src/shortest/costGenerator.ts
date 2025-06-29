import type { Arc } from '@piyoppi/sansaku-pilot/graph/arc/index.js'
import { isBusStopNodeItem, isRailroadStationNode, type TrafficNode, type TrafficNodeItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph'
import type { StationId } from '@piyoppi/sansaku-pilot/traffic/transportation'

type CostGeneratorOption = {
  busRouteWeight: number
}

export const buildCostGenerator = (
  startNode: TrafficNode,
  getGroupId: (id: StationId) => string | undefined,
  option: CostGeneratorOption = {
    busRouteWeight: 3
  }
) => (
  arc: Arc<TrafficNodeItem>,
  a: TrafficNode,
  b: TrafficNode
): number => {
  if (isRailroadStationNode(a) && isRailroadStationNode(b)) {
    if (getGroupId(a.item.stationId) !== undefined &&
       getGroupId(a.item.stationId) === getGroupId(b.item.stationId) &&
       (a.id === startNode.id || b.id === startNode.id)) {
      return 0
    }

    // Bus routes are slower than other transportation.
    if (isBusStopNodeItem(a) && isBusStopNodeItem(b)) {
      return arc.cost * option.busRouteWeight
    }
  }

  return arc.cost
}
