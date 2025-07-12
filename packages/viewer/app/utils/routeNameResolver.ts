import { isBusStopNode, isJunctionNode, isRailroadStationNode, type TrafficNode } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph'
import type { Station } from '@piyoppi/sansaku-pilot/traffic/transportation'

export const createRouteNameResolver = (
  routeMap: Map<string, string>,
  stationMap: Map<string, Station>,
) => (node: TrafficNode) => {
  if (isJunctionNode(node)) {
    return routeMap.get(node.item.routeId) || node.item.routeId
  } else if (isRailroadStationNode(node)) {
    const station = stationMap.get(node.item.stationId)
    return station ? (routeMap.get(station.routeId) || station.routeId) : ""
  } else if (isBusStopNode(node)) {
    const routeNames = node.item.routeIds
    .map(routeId => routeMap.get(routeId) || routeId)
    .filter(name => name.length > 0)
    return routeNames.join(", ")
  }
  return ""
}
