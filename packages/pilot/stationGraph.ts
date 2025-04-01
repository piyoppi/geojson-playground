import { center } from "./geometry"
import { fromPathChain } from "./graph/fromPathChain"
import { arcExists, connect, generateArc, removeDuplicateNode, type GraphNode } from "./graph/graph"
import { ends, buildPathchain } from './pathchain'
import { Railroad, Station } from "./railroad"

export type StationNode = Station & GraphNode

export const toStationGraph = (railroads: Railroad[]): StationNode[] => {
  const stationNodes = railroads.flatMap(railroad => {
    const pathchainGroups = buildPathchain(railroad.rails)

    return pathchainGroups.flatMap((pathchains) => {
      const end = ends(pathchains)[0]

      return fromPathChain(
        railroad.stations.map(s => ({...s, position: center(s.platform)})),
        station => ({...station})
      )(pathchains, end.from())
    })
  })

  const filteredStationNodes = removeDuplicateNode(stationNodes)

  // Connect each transit station nodes
  const nodesByGroup = Map.groupBy(filteredStationNodes, n => n.groupId)
  filteredStationNodes.forEach(node => {
    nodesByGroup.get(node.groupId)?.forEach(current => {
      if (node !== current && !arcExists(node, current) && node.railroadId !== current.railroadId) {
        const arc = generateArc(node, current, 0)
        connect(node, current, arc)
      }
    })
  })

  return filteredStationNodes
}

