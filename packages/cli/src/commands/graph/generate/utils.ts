import { buildDefaultStationGrpahGenerator, buildDefaultBusStopGraphGenerator } from '@piyoppi/sansaku-pilot/traffic/graph/combined.js'
import { readFileSync } from 'node:fs'
import { fromMLITGeoJson as toBusStops } from '@piyoppi/sansaku-pilot/MLITGisTypes/busRoute.js'
import { fromMLITGeoJson as toRailRoads } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad.js'
import type { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad.js'

export const deserializeStationGraph = async (inputRailroadFilename: string, inputStationFilename: string, overrideRailroadInputFilename?: string) => {
  const buildStationGraph = buildDefaultStationGrpahGenerator()

  const railroadGeoJson = JSON.parse(readFileSync(inputRailroadFilename, "utf-8"))
  const stationsGeoJson = JSON.parse(readFileSync(inputStationFilename, "utf-8"))
  const overrideInput = overrideRailroadInputFilename ?
    JSON.parse(readFileSync(overrideRailroadInputFilename, "utf-8")) :
    {}

  const railroadsGeoJson = {
    ...railroadGeoJson,
    features: [...railroadGeoJson.features, ...overrideInput.features ?? []],
  } as RailroadsGeoJson

  const [railroadCompanies, railroads] = await toRailRoads(railroadsGeoJson, stationsGeoJson)
  const stationNodes = await buildStationGraph(railroads)

  return {
    stationNodes,
    railroads,
    railroadCompanies
  }
}

export const deserializeBusStopGraph = async (inputBusStopFilename: string) => {
  const buildBusStopGraph = buildDefaultBusStopGraphGenerator()

  const inputBusStopJson = JSON.parse(readFileSync(inputBusStopFilename, "utf-8"))
  const [busCompanies, busRoutes] = await toBusStops(inputBusStopJson)
  const busNodes = (await buildBusStopGraph(busRoutes)).values().toArray().flat()

  return {
    busNodes,
    busCompanies,
    busRoutes
  }
}
