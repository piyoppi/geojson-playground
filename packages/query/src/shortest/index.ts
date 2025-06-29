import { join as pathJoin } from 'node:path'
import { readFile } from 'node:fs/promises'
import { findShortestPath } from '@piyoppi/sansaku-pilot/graph/graph.js'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot'
import { buildPartitionedRepository, PartitionedRepository } from '@piyoppi/sansaku-pilot/graph/arc/partitionedRepositoryArc.js'
import { isBusStopNode, isRailroadStationNode, type TrafficNodeItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'
import { buildCostGenerator } from './costGenerator.js'
import type { StationId } from '@piyoppi/sansaku-pilot/traffic/transportation'
import type { BusStop } from '@piyoppi/sansaku-pilot/traffic/busroute'
import type { RailroadStation } from '@piyoppi/sansaku-pilot/traffic/railroad'

export const shortest = async (inputGraphDir: string, fromId: string, fromPk: string, toId: string, toPk: string) => {
  const loadedBusStops = new Map<StationId, BusStop>()
  const loadedRailroadStation = new Map<StationId, RailroadStation>
  const repository = buildPartitionedRepository<TrafficNodeItem>(
    async (partitionKey) => {
      const { busRoutes, railroads, graph } = await loadPartialFile(inputGraphDir, partitionKey)

      for (const busStop of busRoutes.flatMap(r => r.stations)) {
        loadedBusStops.set(busStop.id, busStop)
      }

      for (const railroadStation of railroads.flatMap(r => r.stations)) {
        loadedRailroadStation.set(railroadStation.id, railroadStation)
      }

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

  const costGenerator = buildCostGenerator(
    startNode,
    id => loadedBusStops.get(id)?.groupId || loadedRailroadStation.get(id)?.groupId
  )

  const shortest = await findShortestPath(startNode, endNode, costGenerator)

  // Exclude same stations
  const grouped = shortest.reduce((acc, node, i, a) => {
    const next = a[i + 1]
    if (next === undefined) return acc

    const groupId =
      isRailroadStationNode(node) ? loadedRailroadStation.get(node.item.stationId)?.groupId :
      isBusStopNode(node) ? loadedBusStops.get(node.item.busStopIds[0])?.groupId :
      undefined

    const nextGroupId =
      isRailroadStationNode(next) ? loadedRailroadStation.get(next.item.stationId)?.groupId :
      isBusStopNode(next) ? loadedBusStops.get(next.item.busStopIds[0])?.groupId :
      undefined

    if (groupId === undefined || groupId !== nextGroupId) {
      acc.push(i)
    }

    return acc
  }, [] as number[])

  const firstRange = grouped.at(0) ?? 0
  const lastRange = (grouped.at(-1) ?? shortest.length - 1) + 1

  return shortest.slice(firstRange, lastRange + 1)
}

const buildPartialFileLoader = (repository: PartitionedRepository<TrafficNodeItem>) => {
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile({
    repository
  })

  return async (baseDir: string, partitionKey: string) => {
    const fileContent = await readFile(pathJoin(baseDir, `${partitionKey}.json`), "utf-8")
    return await buildTrafficGraphFromFile(JSON.parse(fileContent))
  }
}
