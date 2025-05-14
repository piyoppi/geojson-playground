import { findStationSummariesFromKeyword } from "@piyoppi/sansaku-viewmodel"
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

  const results = findStationSummariesFromKeyword(databaseHandler, keyword)

  return {
    items: results
  }
}
