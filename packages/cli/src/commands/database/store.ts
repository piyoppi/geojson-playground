import { readFileSync } from 'node:fs'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot/main.js'
import type { TrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/trafficGraphFile.js'
import { createHandlerFromFile, createTable, insert } from '@piyoppi/sansaku-viewmodel'

export const execute = async (
  inputGraphFilename: string,
  outFilename: string,
) => {
  const railroadJson = JSON.parse(readFileSync(inputGraphFilename, "utf-8")) as TrafficGraphFile
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile()

  const { railroads, busRoutes, companies } = await buildTrafficGraphFromFile(railroadJson)

  const database = createHandlerFromFile(outFilename)

  createTable(database)
  insert(database, companies, [...railroads, ...busRoutes])

  database.close()
}
