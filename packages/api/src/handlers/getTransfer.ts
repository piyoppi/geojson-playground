import { findRouteSummariesFromId, findStationSummariesFromGroupId } from "@piyoppi/sansaku-viewmodel"
import { DatabaseHandler } from "@piyoppi/sansaku-viewmodel/dist/database"
import { shortest } from '@piyoppi/sansaku-query'

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

  const results = await shortest(
    inputGraphDir,
    fromStationSummary.id,
    fromStationSummary.partitionKey,
    toStationSummary.id,
    toStationSummary.partitionKey
  )

  const routeIds = Array.from(new Set(results.flatMap(node => node.item.station.routeIds)))
  const routeSummaries = new Map(
    findRouteSummariesFromId(databaseHandler, routeIds)
      .map(r => [r.id, r.name])
  )

  return {
    items: results.map(node => ({
      id: node.item.station.id,
      name: node.item.station.name,
      routeName: routeSummaries.get(node.item.station.routeIds[0]) || '',
    })),
  }
}
