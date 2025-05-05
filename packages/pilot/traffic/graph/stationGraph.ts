import { Arc } from "../../graph/arc.js"
import { ArcGenerator } from "../../graph/arcGenerator.js"
import { buildGraphBuilder } from "../../graph/fromPathChain.js"
import { arcExists, connect, GraphNode, type DuplicateNodesMarger } from "../../graph/graph.js"
import { ends, buildPathchain } from '../../pathchain.js'
import type { Railroad, RailroadStation } from "../railroad.js"
import type { RouteId } from "../transportation.js"
import type { TrafficItem } from "./trafficGraph.js"

type TransferCostGenerator = (aNode: RailroadStationNode, bNode: RailroadStationNode) => number

export type RailroadStationNode = GraphNode<RailroadStationNodeItem>
export type RailroadStationNodeItem = TrafficItem
export type RailroadArc = Arc<RailroadStation>

export const buildStationGraphGenerator = (
  generateArc: ArcGenerator<TrafficItem>,
  generateTransferCost: TransferCostGenerator,
  nodeMerger: DuplicateNodesMarger<TrafficItem>
) => async (
  railroads: Railroad[]
): Promise<RailroadStationNode[]> => {
  const stationNodes = (await Promise.all(
        railroads.map(railroad => buildPathchain(railroad.rails).then(g => [railroad, g] as const))
      ).then(results => Promise.all(
        results.flatMap(([railroad, isolatedPathChains]) => {
          const fromPathChain = buildGraphBuilder(generateArc)
          return isolatedPathChains.map(pathchains => {
            const end = ends(pathchains)[0]

            return fromPathChain(
              railroad.stations.map(s => ({...s})),
              pathchains,
              end.from,
              s => Promise.resolve([s.id, {station: s, companyId: railroad.companyId}]),
              s => s.routeId,
            )
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
    }, new Map<RouteId, (GraphNode<TrafficItem & {station: {groupId: string}}>)[]>())
    .values()
    .toArray()

  // Isolated pathchains may have same station
  const mergedStationNodes = (await Promise.all(stationNodes.map(n => nodeMerger(n)))).flat()

  const nodesByGroup = Map.groupBy(mergedStationNodes, n => n.item.station.groupId ?? '')

  // Connect each transit station nodes
  for (const node of mergedStationNodes) {
    const sameGroupNodes = nodesByGroup.get(node.item.station.groupId) ?? []
    for (const current of sameGroupNodes) {
      if (node.id !== current.id && !(await arcExists(node, current)) && node.item.station.routeId !== current.item.station.routeId) {
        const arc = generateArc(node, current, generateTransferCost(node, current))
        connect(node, current, arc)
      }
    }
  }

  return mergedStationNodes
}
