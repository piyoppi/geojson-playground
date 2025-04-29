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

  if (!inputRailroadFilename || !inputStationFilename) {
    return { railroads: [], stationNodes: [] }
  }

  const railroadGeoJson = JSON.parse(readFileSync(inputRailroadFilename, "utf-8"))
  const stationsGeoJson = JSON.parse(readFileSync(inputStationFilename, "utf-8"))
  const overrideInput = option?.overrideRailroadInputFilename ?
    JSON.parse(readFileSync(option.overrideRailroadInputFilename, "utf-8")) :
    {}

  const railroadsGeoJson = {
    ...railroadGeoJson,
    features: [...railroadGeoJson.features, ...overrideInput.features ?? []],
  } as RailroadsGeoJson

  const railroads = await toRailRoads(railroadsGeoJson, stationsGeoJson)
  const stationNodes = await buildStationGraph(railroads)

  if (!inputBusStopFilename) {
    return { busRoutes: [], busNodes: [] }
  }

  const inputBusStopJson = JSON.parse(readFileSync(inputBusStopFilename, "utf-8"))
  const busRoutes = await toBusStops(inputBusStopJson)
  const busNodes = Array.from(buildBusStopGraph(busRoutes.flatMap(b => b.stations)).values()).flat()

  const output = JSON.stringify(await toTrafficGraphFile([...stationNodes, ...busNodes], railroads, busRoutes))

  writeFileSync(outputFileName, output, "utf-8")
}
