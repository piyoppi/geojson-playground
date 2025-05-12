import { createHandlerFromFile, findStationSummaries } from "@piyoppi/sansaku-viewmodel"

export const createKeywordHandler = (
  outFilename: string
) => (
  keyword: string
) => {
  if (keyword === '') {
    return {
      items: []
    }
  }

  const database = createHandlerFromFile(outFilename)
  const results = findStationSummaries(database, keyword)

  return {
    items: results
  }
}
