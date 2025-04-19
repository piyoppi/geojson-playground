import { toBusStopGraph } from '@piyoppi/sansaku-pilot/busStopGraph'
import { fromMLITGeoJson as toBusStops } from '@piyoppi/sansaku-pilot/busstop.js'
import { serialize } from '@piyoppi/sansaku-pilot/traffic/serialize.js'
import { readFileSync, writeFileSync } from 'node:fs'

export const execute = async (inputFilename: string, outputFileName: string) => {
  const input = JSON.parse(readFileSync(inputFilename, "utf-8"))

  const busStops = toBusStops(input)
  const busNodes = Array.from(toBusStopGraph(busStops).values()).flat()
  const serialized = serialize(busNodes)

  const output = JSON.stringify(serialized)
  writeFileSync(outputFileName, output, "utf-8")
}
