import { findShortestPath } from '@piyoppi/sansaku-pilot/graph/graph.js'
import { readFileSync } from 'node:fs'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot/traffic/graph/combined.js'
import type { TrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile'

export const execute = async (inputGraphFilename: string, fromId: string, toId: string) => {
  const trafficGraphFromFile = buildDefaultTrafficGraphFromFile()
  const railroadJson = JSON.parse(readFileSync(inputGraphFilename, "utf-8")) as TrafficGraphFile

  const { graph } = trafficGraphFromFile(railroadJson)

  const startNode = graph.find(n => n.id === fromId)
  const endNode = graph.find(n => n.id === toId)

  if (!startNode || !endNode) {
    throw new Error("Start or end node not found");
  }

  console.log(
    (await findShortestPath(startNode, endNode))
      .map(node => `${node.item.station.name}(${node.id}) \n ↓ ${node.item.station.routeId} \n`)
      .join('')
  )
}
