import { center } from "./geometry"
import { fromPathChain } from "./graph/fromPathChain"
import { arcExists, connect, generateArc, type GraphNode } from "./graph/graph"
import { ends, buildPathchain } from './pathchain'
import { Railroad, Station } from "./railroad"

export type StationNode = Station & GraphNode

export const toStationGraph = async (railroads: Railroad[]): Promise<StationNode[]> => {
  const nodesByRailroad = (
    await Promise.all(
      railroads.map(railroad => buildPathchain(railroad.rails).then(g => [railroad, g] as const))
    ).then(results => Promise.all(
      results.flatMap(([railroad, isolatedPathChains]) => {
        const pathchains = isolatedPathChains.flat()
        if (pathchains.length === 0) return []
        const end = ends(pathchains)[0]

        return fromPathChain(
          railroad.stations.map(s => ({...s, position: center(s.platform)})),
          station => Promise.resolve([station.railroadId, {...station}])
        )(pathchains, end.from())
      })
    ))
  ).flat().reduce((acc, map) => {
    map.entries().forEach(([k, v]) => acc.set(k, v))
    return acc
  }, new Map<string, StationNode[]>())

  const stationNodes = nodesByRailroad.values().toArray().flat()
  const nodesByGroup = Map.groupBy(stationNodes, n => n.groupId)

  // Connect each transit station nodes
  stationNodes.forEach(node => {
    nodesByGroup.get(node.groupId)?.forEach(current => {
      if (node !== current && !arcExists(node, current) && node.railroadId !== current.railroadId) {
        const arc = generateArc(node, current, 0)
        connect(node, current, arc)
      }
    })
  })

  return stationNodes
}

