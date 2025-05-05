import { findShortestPath } from '@piyoppi/sansaku-pilot/graph/graph.js'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot/traffic/graph/combined.js'
import { buildRepository, buildRepositoryArcGenerator } from '@piyoppi/sansaku-pilot/graph/arc/externalRepositoryArc'
import { join as pathJoin } from 'node:path'
import { readFile } from 'node:fs/promises'

export const execute = async (inputGraphDir: string, fromId: string, toId: string) => {
  const repository = buildRepository(
    async (partitionKey) => {
      const { graph } = await loadPartialFile(inputGraphDir, partitionKey)

      return graph
    },
    async () => {}
  )

  const buildRepositoryArc = buildRepositoryArcGenerator(
    repository.get,
    node => node.item.companyId
  )

  //const startNode = graph.find(n => n.id === fromId)
  //const endNode = graph.find(n => n.id === toId)

  //if (!startNode || !endNode) {
  //  throw new Error("Start or end node not found");
  //}

  //console.log(
  //  (await findShortestPath(startNode, endNode))
  //    .map(node => `${node.item.station.name}(${node.id}) \n ↓ ${node.item.station.routeId} \n`)
  //    .join('')
  //)
}

const loadPartialFile = async (baseDir: string, partitionKey: string) => {
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile()
  const filename = pathJoin(baseDir, `${partitionKey}.json`)
  const fileContent = await readFile(filename, "utf-8")
  const file = buildTrafficGraphFromFile(JSON.parse(fileContent))

  return file
}
