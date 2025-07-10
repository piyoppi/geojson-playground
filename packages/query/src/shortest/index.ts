import { join as pathJoin } from 'node:path'
import { readFile } from 'node:fs/promises'
import { findShortestPath } from '@piyoppi/sansaku-pilot/graph/graph.js'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot'
import { buildPartitionedRepository, PartitionedRepository } from '@piyoppi/sansaku-pilot/graph/arc/partitionedRepositoryArc.js'
import { isBusStopNode, isRailroadStationNode, type TrafficNodeItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'
import { buildCostGenerator } from './costGenerator.js'
import type { StationId } from '@piyoppi/sansaku-pilot/traffic/transportation'
import type { BusRoute, BusStop } from '@piyoppi/sansaku-pilot/traffic/busroute'
import type { RailroadRoute, RailroadStation } from '@piyoppi/sansaku-pilot/traffic/railroad'

export const shortest = async (
  inputGraphDir: string,
  fromId: string,
  fromPk: string,
  toId: string,
  toPk: string
) => {
  const repository = buildPartitionedRepository<TrafficNodeItem>(
    async (partitionKey) => (await loadPartialFile(inputGraphDir, partitionKey)).graph,
    async () => {}
  )

  const loadedBusStops = new Map<StationId, BusStop>()
  const loadedRailroadStation = new Map<StationId, RailroadStation>()
  const loadPartialFile = buildPartialFileLoader(
    repository,
    (railroads, busRoutes) => {
      for (const busStop of busRoutes.flatMap(r => r.stations)) {
        loadedBusStops.set(busStop.id, busStop)
      }

      for (const railroadStation of railroads.flatMap(r => r.stations)) {
        loadedRailroadStation.set(railroadStation.id, railroadStation)
      }
    }
  )

  const fromFile = await repository.load(fromPk)
  const toFile = await repository.load(toPk)

  const startNode = fromFile.get(fromId)
  const endNode = toFile.get(toId)

  if (!startNode || !endNode) {
    throw new Error("Start or end node not found");
  }

  const costGenerator = buildCostGenerator(
    startNode,
    id => loadedBusStops.get(id)?.groupId || loadedRailroadStation.get(id)?.groupId
  )

  const shortest = await findShortestPath(
    startNode,
    endNode,
    {
      getCost: costGenerator
    }
  )

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

  const nodes = shortest.slice(firstRange, lastRange + 1)

  return {
    nodes,
    stations: new Map(
      nodes
        .filter(isRailroadStationNode)
        .flatMap(node => {
          const { stationId } = node.item
          const station = loadedRailroadStation.get(stationId)
          return station ? [[stationId, station] as const] : []
        })
    ),
    busRoutes: new Map(
      nodes
        .filter(isBusStopNode)
        .flatMap(node => {
          const { busStopIds } = node.item
          return busStopIds.flatMap(busStopId => {
            const busStop = loadedBusStops.get(busStopId)
            return busStop ? [[busStopId, busStop] as const] : []
          })
        })
    )
  }

}

const buildPartialFileLoader = (
  repository: PartitionedRepository<TrafficNodeItem>,
  loadedHook: (railroadRoutes: RailroadRoute[], busRoutes: BusRoute[]) => void
) => {
  const trafficGraphFromFile = buildDefaultTrafficGraphFromFile({
    repository
  })

  return async (baseDir: string, partitionKey: string) => {
    const fileContent = await readFile(pathJoin(baseDir, `${partitionKey}.json`), "utf-8")
    const item = await trafficGraphFromFile(JSON.parse(fileContent))

    loadedHook(item.railroads, item.busRoutes)

    return item
  }
}
