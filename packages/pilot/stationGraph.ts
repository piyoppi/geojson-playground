import { center } from "./geometry"
import { fromPathChain } from "./graph/fromPathChain"
import { arcExists, connect, generateArc, mergeDuplicateNodes, type GraphNode } from "./graph/graph"
import { ends, buildPathchain } from './pathchain'
import { Railroad, Station } from "./railroad"

export type StationNode = Station & GraphNode

export const toStationGraph = async (railroads: Railroad[]): Promise<StationNode[]> => {
  const stationNodes = (await Promise.all(
        railroads.map(railroad => buildPathchain(railroad.rails).then(g => [railroad, g] as const))
      ).then(results => Promise.all(
        results.flatMap(([railroad, isolatedPathChains]) =>
          isolatedPathChains.map(pathchains => {
            const end = ends(pathchains)[0]

            return fromPathChain(
              railroad.stations.map(s => ({...s, position: center(s.platform)})),
              station => Promise.resolve({...station}),
              station => station.railroadId
            )(pathchains, end.from)
          })
        )
      ))
    )
    .reduce((acc, map) => {
      map.entries().forEach(([k, v]) => {
        const cur = acc.get(k) ?? []
        acc.set(k, [...cur, ...v])
      })
      return acc
    }, new Map<string, StationNode[]>())
    .values()
    .map(v => mergeDuplicateNodes(v))         // Isolated pathchains may have same station
    .toArray()
    .flat()

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

