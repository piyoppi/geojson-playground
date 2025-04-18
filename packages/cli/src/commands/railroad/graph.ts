import { toStationGraph } from '@piyoppi/sansaku-pilot/stationGraph.js'
import { serialize } from '@piyoppi/sansaku-pilot/traffic/serialize.js'
import { readFileSync, writeFileSync } from 'node:fs'
import { fromMLITGeoJson as toRailRoads } from '@piyoppi/sansaku-pilot/railroad.js'
import type { RailroadsGeoJson } from '@piyoppi/sansaku-pilot/MLITGisTypes/railroad.js'

type Option = {
  overrideRailroadInputFilename?: string
}

export const execute = async (inputRailroadFilename: string, inputStationFilename: string, outputFileName: string, option?: Option) => {
  const railroadGeoJson = JSON.parse(readFileSync(inputRailroadFilename, "utf-8"))
  const stationsGeoJson = JSON.parse(readFileSync(inputStationFilename, "utf-8"))
  const overrideInput = option?.overrideRailroadInputFilename ? JSON.parse(readFileSync(option.overrideRailroadInputFilename, "utf-8")) : {}

  const railroadsGeoJson = {
    ...railroadGeoJson,
    features: [...railroadGeoJson.features, ...overrideInput.features ?? []],
  } as RailroadsGeoJson

  const stationNodes = await toStationGraph(toRailRoads(railroadsGeoJson, stationsGeoJson))
  const serialized = serialize(stationNodes)

  const output = JSON.stringify(serialized)
  writeFileSync(outputFileName, output, "utf-8")
}
