import { createHandlerFromFile, findStationSummaries } from "@piyoppi/sansaku-viewmodel"

export const createKeywordHandler = (
  outFilename: string
) => (
  keyword: string
) => {
  const database = createHandlerFromFile(outFilename)
  const results = findStationSummaries(database, keyword)

  return results
}
