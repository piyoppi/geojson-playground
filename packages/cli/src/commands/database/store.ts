import { readFileSync } from 'node:fs'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot/traffic/graph/combined.js'
import type { TrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile.js'
import { createHandlerFromFile, createRouteTable, createStationTable } from '@piyoppi/sansaku-viewmodel'

export const execute = async (
  inputGraphFilename: string,
  outFilename: string,
) => {
  const railroadJson = JSON.parse(readFileSync(inputGraphFilename, "utf-8")) as TrafficGraphFile
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile()

  const { railroads, busRoutes } = buildTrafficGraphFromFile(railroadJson)

  const database = createHandlerFromFile(outFilename)

  createStationTable(database, [...railroads, ...busRoutes])
  createRouteTable(database, [...railroads, ...busRoutes])

  database.close()
}
