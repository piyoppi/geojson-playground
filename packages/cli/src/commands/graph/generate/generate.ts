import { writeFileSync } from 'node:fs'
import { toTrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile.js'
import { deserializeBusStopGraph, deserializeStationGraph } from './utils.js'

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
    await deserializeStationGraph(inputRailroadFilename, inputStationFilename, option?.overrideRailroadInputFilename) :
    { stationNodes: [], railroads: [], railroadCompanies: [] }

  const { busNodes, busCompanies, busRoutes } = inputBusStopFilename ?
    await deserializeBusStopGraph(inputBusStopFilename) :
    { busNodes: [], busCompanies: [], busRoutes: [] }

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
