import { findRouteSummariesFromId, findStationSummariesFromId } from "@piyoppi/sansaku-viewmodel"
import { DatabaseHandler } from "@piyoppi/sansaku-viewmodel/dist/database"
import { shortest } from '@piyoppi/sansaku-query'

export const createGetTransferHandler = (
  databaseHandler: DatabaseHandler,
  inputGraphDir: string
) => async (
  from: string,
  to: string
) => {
  const stationSummaries = findStationSummariesFromId(databaseHandler, [from, to])

  if (stationSummaries.length !== 2) {
    throw new Error('')
  }

  const [fromStationSummary, toStationSummary] = stationSummaries

  const results = await shortest(
    inputGraphDir,
    fromStationSummary.id,
    fromStationSummary.partitionKey,
    toStationSummary.id,
    toStationSummary.partitionKey
  )

  const routeIds = Array.from(new Set(results.map(node => node.item.station.routeId)))
  const routeSummaries = new Map(
    findRouteSummariesFromId(databaseHandler, routeIds)
      .map(r => [r.id, r.name])
  )

  return {
    items: results.map(node => ({
      id: node.item.station.id,
      name: node.item.station.name,
      routeName: routeSummaries.get(node.item.station.routeId) || '',
    })),
  }
}
