import { findRouteSummariesFromId, findStationSummariesFromGroupId } from "@piyoppi/sansaku-viewmodel"
import { DatabaseHandler } from "@piyoppi/sansaku-viewmodel/dist/database"
import { shortest } from '@piyoppi/sansaku-query'
import { isRailroadStationNode, isBusStopNode, BusStopNode, nodeKind, TrafficNode, filterBusStopNodes, filterStationNodes } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'
import { RouteId } from "@piyoppi/sansaku-pilot/traffic/transportation"

export const createGetTransferHandler = (
  databaseHandler: DatabaseHandler,
  inputGraphDir: string,
  maxSteps?: number
) => async (
  from: string,
  to: string
) => {
  const stationSummaries = Map.groupBy(findStationSummariesFromGroupId(databaseHandler, [from, to]), s => s.groupId)
  const fromStationSummary = stationSummaries.get(from)?.at(0)
  const toStationSummary = stationSummaries.get(to)?.at(0)

  if (!fromStationSummary || !toStationSummary) {
    throw new Error('')
  }

  const { nodes, stations, busRoutes } = await shortest(
    inputGraphDir,
    fromStationSummary.id,
    fromStationSummary.partitionKey,
    toStationSummary.id,
    toStationSummary.partitionKey,
    { maxSteps }
  )

  const routeIds = Array.from(new Set([
    ...Array.from(stations.values()).map(s => s.routeId),
    ...Array.from(busRoutes.values()).map(b => b.routeId)
  ]))
  const routeSummaries = new Map(
    findRouteSummariesFromId(databaseHandler, routeIds)
      .map(r => [r.id, r.name])
  )

  const items =
    nodes.reduce((acc, val) => {
      const current = acc.at(-1)
      if (current && nodeKind(current[0]) === nodeKind(val)) {
        current.push(val)
      } else {
        acc.push([val])
      }

      return acc
    }, [] as TrafficNode[][])
    .flatMap(nodes => {
      if (isRailroadStationNode(nodes[0])) {
        const stationNodes = filterStationNodes(nodes)
        return stationNodes.flatMap(node => {
          const station = stations.get(node.item.stationId)

          return station ? [{
            id: node.id,
            name: station.name,
            routeNames: [routeSummaries.get(station.routeId) || ''],
          }] : []
        })
      } else if (isBusStopNode(nodes[0])) {
        const busStopNodes = filterBusStopNodes(nodes)
        const { determinedRouteMap, transferredBusStopNodes } = determineBusRoute(busStopNodes)
        return busStopNodes.flatMap(node => {
          const busStop = busRoutes.get(node.item.busStopIds[0])
          const determinedRouteIds = determinedRouteMap.get(node)
          if (!busStop || !determinedRouteIds) {
            throw new Error('busStop or routeId is not found.')
          }

          const currentRouteNames = Array.from(determinedRouteIds)
            .map(routeId => routeSummaries.get(routeId) || '')
            .filter(name => name !== '')

          const transferedFirstNode = transferredBusStopNodes.get(node)
          if (transferedFirstNode) {
            const nextRouteIds = determinedRouteMap.get(transferedFirstNode)

            if (!nextRouteIds) {
              throw new Error('nextRouteIds is not found.')
            }

            const nextRouteNames = Array.from(nextRouteIds)
              .map(routeId => routeSummaries.get(routeId) || '')
              .filter(name => name !== '')

            return [
              {
                id: node.id,
                name: busStop.name,
                routeNames: currentRouteNames,
              },
              {
                id: node.id,
                name: busStop.name,
                routeNames: nextRouteNames,
              },
            ]
          } else {
            return [{
              id: node.id,
              name: busStop.name,
              routeNames: currentRouteNames,
            }]
          }
        })
      } else {
        return []
      }
    })

  return {
    items
  }
}

const determineBusRoute = (nodes: BusStopNode[]) => {
  const first = nodes[0]
  const narrowingRouteMap = new Map<BusStopNode, Set<RouteId>>([[first, new Set(first.item.routeIds)]])
  const currentRouteSet = new Set<RouteId>(nodes[0].item.routeIds)
  const transferredBusStopNodes = new Map<BusStopNode, BusStopNode>()

  for (let i = 1; i < nodes.length; i++) {
    const current = nodes[i]
    const previous = nodes[i - 1]
    const currentRouteIds = new Set(current.item.routeIds)
    const intersectedRouteIds = currentRouteSet.intersection(currentRouteIds)

    if (intersectedRouteIds.size === 0) {
      transferredBusStopNodes.set(previous, current)
      current.item.routeIds.forEach(id => currentRouteSet.add(id))
      narrowingRouteMap.set(current, currentRouteIds)
    } else {
      narrowingRouteMap.set(current, intersectedRouteIds)
    }
  }

  const last = nodes.at(-1)!
  let currentRidingRouteIds = new Set<RouteId>(narrowingRouteMap.get(last))
  const determinedRouteMap = new Map<BusStopNode, Set<RouteId>>([[last, narrowingRouteMap.get(last)!]])

  for (let i = nodes.length - 2; i >= 0; i--) {
    const current = nodes[i]

    if (transferredBusStopNodes.has(current)) {
      currentRidingRouteIds = narrowingRouteMap.get(current) ?? new Set<RouteId>()
    }

    determinedRouteMap.set(current, currentRidingRouteIds)
  }

  return {
    determinedRouteMap,
    transferredBusStopNodes
  }
}
