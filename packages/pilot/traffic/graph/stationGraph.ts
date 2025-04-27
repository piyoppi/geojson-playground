import { center } from "../../geometry.js"
import { fromPathChain } from "../../graph/fromPathChain.js"
import { arcExists, connect, generateArc, mergeDuplicateNodes, NodeId } from "../../graph/graph.js"
import { ends, buildPathchain } from '../../pathchain.js'
import { Railroad, Station } from "../railroad.js"
import type { TrafficGraphNode } from "./trafficGraph"

export type StationNode = TrafficGraphNode<Station>

export const toStationGraph = async (railroads: Railroad[]): Promise<StationNode[]> => {
  const stationNodes = (await Promise.all(
        railroads.map(railroad => buildPathchain(railroad.rails).then(g => [railroad, g] as const))
      ).then(results => Promise.all(
        results.flatMap(([railroad, isolatedPathChains]) =>
          isolatedPathChains.map(pathchains => {
            const end = ends(pathchains)[0]

            return fromPathChain(
              railroad.stations.map(s => ({...s})),
              s => Promise.resolve({id: s.id, item: s}),
              s => s.routeId
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
    }, new Map<NodeId, StationNode[]>())
    .values()
    .map(v => mergeDuplicateNodes(v))         // Isolated pathchains may have same station
    .toArray()
    .flat()

  const nodesByGroup = Map.groupBy(stationNodes, n => n.item.groupId ?? '')

  // Connect each transit station nodes
  stationNodes.forEach(node => {
    const item = node.item
    if (!item) return
    nodesByGroup.get(item.groupId)?.forEach(current => {
      if (node !== current && !arcExists(node, current) && item.routeId !== current.item.routeId) {
        // TODO: configure arc cost
        const arc = generateArc(node, current, 1)
        connect(node, current, arc)
      }
    })
  })

  return stationNodes
}
