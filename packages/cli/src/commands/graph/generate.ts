import { buildDefaultStationGrpahGenerator, buildDefaultBusStopGraphGenerator } from '@piyoppi/sansaku-pilot/traffic/graph/combined.js'
import { readFileSync, writeFileSync } from 'node:fs'
import { fromMLITGeoJson as toBusStops } from '@piyoppi/sansaku-pilot/MLITGisTypes/busRoute.js'
import { fromMLITGeoJson as toRailRoads } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad.js'
import { toTrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile.js'
import type { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad.js'
import type { BusRoute, BusStopNode } from '@piyoppi/sansaku-pilot/traffic/busroute'
import type { Railroad, Station } from '@piyoppi/sansaku-pilot/traffic/railroad'
import { Company } from '@piyoppi/sansaku-pilot/traffic/transportation'

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

  let railroads: Railroad[] = []
  let railroadCompanies: Company[] = []
  let stationNodes: Station[] = []

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

    [railroadCompanies, railroads] = await toRailRoads(railroadsGeoJson, stationsGeoJson)
    stationNodes = await buildStationGraph(railroads)
  }

  let busRoutes: BusRoute[] = []
  let busCompanies: Company[] = []
  let busNodes: BusStopNode[] = []

  if (inputBusStopFilename) {
    const inputBusStopJson = JSON.parse(readFileSync(inputBusStopFilename, "utf-8"));
    [busCompanies, busRoutes] = await toBusStops(inputBusStopJson)
    busNodes = (await buildBusStopGraph(busRoutes)).values().toArray().flat()
  }

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
