import { buildDefaultStationGrpahGenerator, buildDefaultBusStopGraphGenerator } from '@piyoppi/sansaku-pilot/traffic/graph/combined.js'
import { readFileSync, writeFileSync } from 'node:fs'
import { fromMLITGeoJson as toBusStops } from '@piyoppi/sansaku-pilot/MLITGisTypes/busRoute.js'
import { fromMLITGeoJson as toRailRoads } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad.js'
import { toTrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile.js'
import type { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad.js'

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
  const buildStationGraph = buildDefaultStationGrpahGenerator()
  const buildBusStopGraph = buildDefaultBusStopGraphGenerator()

  const railroads = []
  const stationNodes = []

  if (inputRailroadFilename && inputStationFilename) {
    const railroadGeoJson = JSON.parse(readFileSync(inputRailroadFilename, "utf-8"))
    const stationsGeoJson = JSON.parse(readFileSync(inputStationFilename, "utf-8"))
    const overrideInput = option?.overrideRailroadInputFilename ?
      JSON.parse(readFileSync(option.overrideRailroadInputFilename, "utf-8")) :
      {}

    const railroadsGeoJson = {
      ...railroadGeoJson,
      features: [...railroadGeoJson.features, ...overrideInput.features ?? []],
    } as RailroadsGeoJson

    railroads.push(...await toRailRoads(railroadsGeoJson, stationsGeoJson))
    stationNodes.push(...await buildStationGraph(railroads))
  }

  const busRoutes = []
  const busNodes = []

  if (inputBusStopFilename) {
    const inputBusStopJson = JSON.parse(readFileSync(inputBusStopFilename, "utf-8"))
    busRoutes.push(...await toBusStops(inputBusStopJson))
    busNodes.push(...Array.from((await buildBusStopGraph(busRoutes.flatMap(b => b.stations))).values()).flat())
  }

  const output = JSON.stringify(await toTrafficGraphFile([...stationNodes, ...busNodes], railroads, busRoutes))

  writeFileSync(outputFileName, output, "utf-8")
}
