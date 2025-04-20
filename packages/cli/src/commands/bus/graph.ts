import { toBusStopGraph } from '@piyoppi/sansaku-pilot/traffic/busStopGraph.js'
import { fromMLITGeoJson as toBusStops } from '@piyoppi/sansaku-pilot/busroute.js'
import { serialize } from '@piyoppi/sansaku-pilot/traffic/serialize.js'
import { readFileSync, writeFileSync } from 'node:fs'

export const execute = async (inputFilename: string, outputFileName: string) => {
  const input = JSON.parse(readFileSync(inputFilename, "utf-8"))

  const busRoutes = toBusStops(input)
  const busNodes = Array.from(toBusStopGraph(busRoutes.flatMap(b => b.busstops)).values()).flat()
  const graph = serialize(busNodes)

  const output = JSON.stringify({
    graph,
    busRoutes
  })

  writeFileSync(outputFileName, output, "utf-8")
}
