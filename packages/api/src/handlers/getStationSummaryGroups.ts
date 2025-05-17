import { findStationSummaryGroupsFromKeyword } from "@piyoppi/sansaku-viewmodel"
import { DatabaseHandler } from "@piyoppi/sansaku-viewmodel/dist/database"

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

  const results = findStationSummaryGroupsFromKeyword(databaseHandler, keyword, 20)

  return {
    items: results
  }
}
