import { ArcGenerator } from "../../graph/arcGenerator.js"
import { buildGraphBuilder } from "../../graph/fromPathChain.js"
import { arcExists, connect, type DuplicateNodesMarger } from "../../graph/graph.js"
import { ends, buildPathchain } from '../../pathchain.js'
import type { Railroad, Station } from "../railroad"
import type { RouteId } from "../transportation"
import type { TrafficGraphNode } from "./trafficGraph"

export type StationNode = TrafficGraphNode<Station>
type TransferCostGenerator = (aNode: StationNode, bNode: StationNode) => number

export const buildStationGraphGenerator = (
  generateArc: ArcGenerator<StationNode>,
  generateTransferCost: TransferCostGenerator,
  nodeMerger: DuplicateNodesMarger
) => async (
  railroads: Railroad[]
): Promise<StationNode[]> => {
  const stationNodes = (await Promise.all(
        railroads.map(railroad => buildPathchain(railroad.rails).then(g => [railroad, g] as const))
      ).then(results => Promise.all(
        results.flatMap(([railroad, isolatedPathChains]) => {
          const fromPathChain = buildGraphBuilder(
            railroad.stations.map(s => ({...s})),
            s => Promise.resolve({id: s.id, item: s, companyId: railroad.companyId}),
            s => s.routeId,
            generateArc
          )
          return isolatedPathChains.map(pathchains => {
            const end = ends(pathchains)[0]

            return fromPathChain(pathchains, end.from)
          })
        })
      ))
    )
    .reduce((acc, map) => {
      map.entries().forEach(([k, v]) => {
        const cur = acc.get(k) ?? []
        acc.set(k, [...cur, ...v])
      })
      return acc
    }, new Map<RouteId, StationNode[]>())
    .values()
    .toArray()

  // Isolated pathchains may have same station
  const mergedStationNodes = (await Promise.all(stationNodes.map(n => nodeMerger(n)))).flat()

  const nodesByGroup = Map.groupBy(mergedStationNodes, n => n.item.groupId ?? '')

  // Connect each transit station nodes
  mergedStationNodes.forEach(node => {
    const item = node.item
    if (!item) return
    nodesByGroup.get(item.groupId)?.forEach(current => {
      if (node !== current && !arcExists(node, current) && item.routeId !== current.item.routeId) {
        const arc = generateArc(node, current, generateTransferCost(node, current))
        connect(node, current, arc)
      }
    })
  })

  return mergedStationNodes
}

