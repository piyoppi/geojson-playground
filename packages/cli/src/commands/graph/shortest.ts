import { join as pathJoin } from 'node:path'
import { readFile } from 'node:fs/promises'
import { findShortestPath, GraphNode } from '@piyoppi/sansaku-pilot/graph/graph.js'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot/traffic/graph/combined.js'
import { buildRepository, NodeRepositoryGetter, PartitionedRepository } from '@piyoppi/sansaku-pilot/graph/arc/externalRepositoryArc.js'
import { TrafficItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'

export const execute = async (inputGraphDir: string, fromId: string, fromPk: string, toId: string, toPk: string) => {
  const repository = buildRepository(
    async (partitionKey) => {
      const { graph } = await loadPartialFile(inputGraphDir, partitionKey)

      return graph
    },
    async () => {}
  )
  const loadPartialFile = buildPartialFileLoader(repository)

  const fromFile = await loadPartialFile(inputGraphDir, fromPk)
  const toFile = await loadPartialFile(inputGraphDir, toPk)

  const startNode = fromFile.graph.find(n => n.id === fromId)
  const endNode = toFile.graph.find(n => n.id === toId)

  if (!startNode || !endNode) {
    throw new Error("Start or end node not found");
  }

  for (const node of fromFile.graph) {
    repository.register(node, fromPk)
  }

  for (const node of toFile.graph) {
    repository.register(node, toPk)
  }

  console.log(
    `from: ${startNode.item.station.name}(${startNode.id}) \n` +
    `to: ${endNode.item.station.name}(${endNode.id}) \n` +
    (await findShortestPath(startNode, endNode))
      .map(node => `${node.item.station.name}(${node.id}) \n ↓ ${node.item.station.routeId} \n`)
      .join('')
  )
}

const buildPartialFileLoader = (repository: PartitionedRepository<TrafficItem>) => {
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile({
    repository
  })

  return async (baseDir: string, partitionKey: string) => {
    const fileContent = await readFile(pathJoin(baseDir, `${partitionKey}.json`), "utf-8")
    return buildTrafficGraphFromFile(JSON.parse(fileContent))
  }
}
