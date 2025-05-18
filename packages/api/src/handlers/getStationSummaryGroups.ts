import { findStationSummaryGroupsFromKeyword, DatabaseHandler } from "@piyoppi/sansaku-viewmodel"

export const createKeywordHandler = (
  databaseHandler: DatabaseHandler
) => (
  keyword: string
) => {
  if (keyword === '') {
    return {
      items: []
    }
  }

  const stationSummaryGroups = findStationSummaryGroupsFromKeyword(databaseHandler, keyword, 20)

  return {
    items: stationSummaryGroups
  }
}
