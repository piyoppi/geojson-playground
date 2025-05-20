import { writeFileSync } from 'node:fs'
import { toTrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile.js'
import { buildDefaultStationGrpahGenerator, buildDefaultBusStopGraphGenerator } from '@piyoppi/sansaku-pilot/traffic/graph/combined.js'
import { readFileSync } from 'node:fs'
import { fromMLITGeoJson as toBusStops } from '@piyoppi/sansaku-pilot/MLITGisTypes/busRoute.js'
import { fromMLITGeoJson as toRailRoads } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad.js'
import type { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad.js'
import { connectBusToStation } from '@piyoppi/sansaku-pilot/traffic/graph/merge'

type Option = {
  overrideRailroadInputFilename?: string
}

export const execute = async (
  outputFileName: string,
  inputRailroadFilename?: string,
  inputStationFilename?: string,
  inputBusStopFilename?: string,
  option?: Option
) => {
  const { stationNodes, railroads, railroadCompanies } = inputRailroadFilename && inputStationFilename ?
    await loadStationGraph(inputRailroadFilename, inputStationFilename, option?.overrideRailroadInputFilename) :
    { stationNodes: [], railroads: [], railroadCompanies: [] }

  const { busNodes, busCompanies, busRoutes } = inputBusStopFilename ?
    await loadBusStopGraph(inputBusStopFilename) :
    { busNodes: [], busCompanies: [], busRoutes: [] }

  connectBusToStation(stationNodes, busNodes)

  const output = JSON.stringify(
    await toTrafficGraphFile(
      [...stationNodes, ...busNodes],
      [...railroadCompanies, ...busCompanies],
      railroads,
      busRoutes
    )
  )

  writeFileSync(outputFileName, output, "utf-8")
}

export const loadStationGraph = async (inputRailroadFilename: string, inputStationFilename: string, overrideRailroadInputFilename?: string) => {
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

export const loadBusStopGraph = async (inputBusStopFilename: string) => {
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
