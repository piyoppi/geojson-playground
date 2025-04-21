import { findShortestPath } from '@piyoppi/sansaku-pilot/graph/graph'
import { deserialize } from '@piyoppi/sansaku-pilot/traffic/serialize.js'
import { readFileSync } from 'node:fs'

export const execute = (inputGraphFilename: string, fromId: string, toId: string) => {
  const railroadJson = JSON.parse(readFileSync(inputGraphFilename, "utf-8"))

  const graph = deserialize(railroadJson.graph)

  const startNode = graph.find(n => n.id === fromId)
  const endNode = graph.find(n => n.id === toId)

  console.log(`startNode: ${startNode?.name}(${startNode.id}), endNode: ${endNode?.name}(${endNode.id})`)

  console.log(findShortestPath(startNode, endNode).map(node => `${node.name}(${node.id})`).join(" -> "))
}
