import { findRouteSummariesFromId, findStationSummariesFromGroupId } from "@piyoppi/sansaku-viewmodel"
import { DatabaseHandler } from "@piyoppi/sansaku-viewmodel/dist/database"
import { shortest } from '@piyoppi/sansaku-query'
import { isRailroadStationNode, isBusStopNode } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'

export const createGetTransferHandler = (
  databaseHandler: DatabaseHandler,
  inputGraphDir: string
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
    toStationSummary.partitionKey
  )

  const routeIds = Array.from(new Set([
    ...Array.from(stations.values()).map(s => s.routeId),
    ...Array.from(busRoutes.values()).map(b => b.routeId)
  ]))
  const routeSummaries = new Map(
    findRouteSummariesFromId(databaseHandler, routeIds)
      .map(r => [r.id, r.name])
  )

  return {
    items: nodes.map(node => {
      if (isRailroadStationNode(node)) {
        const station = stations.get(node.item.stationId)
        return station ? {
          id: station.id,
          name: station.name,
          routeName: routeSummaries.get(station.routeId) || '',
        } : null
      } else if (isBusStopNode(node)) {
        // For bus stops, use the first bus stop ID
        const busStop = busRoutes.get(node.item.busStopIds[0])
        return busStop ? {
          id: busStop.id,
          name: busStop.name,
          routeName: routeSummaries.get(busStop.routeId) || '',
        } : null
      }
      // Junction nodes
      return null
    }).filter((item): item is NonNullable<typeof item> => item !== null),
  }
}
