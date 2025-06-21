import type { Arc } from '@piyoppi/sansaku-pilot/graph/arc/index.js'
import type { TrafficGraphNode, TrafficNodeItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph'

export const costGenerator = (startNode: TrafficGraphNode) => (
  arc: Arc<TrafficNodeItem>, 
  a: TrafficGraphNode, 
  b: TrafficGraphNode
): number => {
  if (a.item.type === 'Station' && 
      b.item.type === 'Station' && 
      a.item.station.groupId !== undefined &&
      a.item.station.groupId === b.item.station.groupId &&
      (a.id === startNode.id || b.id === startNode.id)) {
    return 0
  }
  return arc.cost
}
