import { findShortestPath } from '@piyoppi/sansaku-pilot/graph/graph.js'
import { deserialize } from '@piyoppi/sansaku-pilot/traffic/graph/serialize.js'
import { readFileSync } from 'node:fs'
import type { TrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile'

export const execute = (inputGraphFilename: string, fromId: string, toId: string) => {
  const railroadJson = JSON.parse(readFileSync(inputGraphFilename, "utf-8")) as TrafficGraphFile

  const graph = deserialize(railroadJson.graph)

  const startNode = graph.find(n => n.id === fromId)
  const endNode = graph.find(n => n.id === toId)

  console.log(`startNode: ${startNode?.name}(${startNode.id}), endNode: ${endNode?.name}(${endNode.id})`)

  console.log(
    findShortestPath(startNode, endNode)
      .map(node => `${node.name}(${node.id}) \n ↓ ${node.routeId} \n`)
      .join('')
  )
}
