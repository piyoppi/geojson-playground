import { join as pathJoin } from 'node:path'
import { readFile } from 'node:fs/promises'
import { findShortestPath } from '@piyoppi/sansaku-pilot/graph/graph.js'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot'
import { buildPartitionedRepository, PartitionedRepository } from '@piyoppi/sansaku-pilot/graph/arc/partitionedRepositoryArc.js'
import { TrafficNodeItem, filterStationNodes } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'

export const shortest = async (inputGraphDir: string, fromId: string, fromPk: string, toId: string, toPk: string) => {
  const repository = buildPartitionedRepository<TrafficNodeItem>(
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

  const shortest = filterStationNodes(await findShortestPath(startNode, endNode))

  // Exclude same stations
  const grouped = shortest.reduce((acc, n, i, a) => {
    const next = a[i + 1]
    if (next === undefined) return acc

    if (n.item.station.groupId === undefined || n.item.station.groupId !== next.item.station.groupId) {
      acc.push(i)
    }

    return acc
  }, [] as number[])

  console.log(shortest.map(n => n.item.station.name))
  console.log(grouped)

  const firstRange = grouped.at(0) ?? 0
  const lastRange = (grouped.at(-1) ?? shortest.length - 1) + 1

  console.log(firstRange, lastRange)
  console.log(shortest.slice(firstRange, lastRange).map(s => s.item.station.name))

  return shortest.slice(firstRange, lastRange + 1)
}

const buildPartialFileLoader = (repository: PartitionedRepository<TrafficNodeItem>) => {
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile({
    repository
  })

  return async (baseDir: string, partitionKey: string) => {
    const fileContent = await readFile(pathJoin(baseDir, `${partitionKey}.json`), "utf-8")
    return buildTrafficGraphFromFile(JSON.parse(fileContent))
  }
}
