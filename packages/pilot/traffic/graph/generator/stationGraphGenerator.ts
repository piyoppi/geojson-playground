import { buildGraphBuilder } from "../../../graph/builder/fromPathChain.js"
import { ends, buildPathchain } from '../../../geometry/path/pathchain.js'
import { arcExists, connect, type GraphNode, type DuplicateNodesMarger } from "../../../graph/graph.js"
import type { ArcGenerator } from "../../../graph/arc/index.js"
import type { Railroad } from "../../railroad.js"
import { toJunctionId, type RouteId } from "../../transportation.js"
import { createJunctionNodeItem, createStationNodeItem, filterStationNodes, type TrafficNodeItem } from "../trafficGraph.js"

type TransferCostGenerator = (aNode: RailroadStationNode, bNode: RailroadStationNode) => number
type RailroadStationNode = GraphNode<RailroadStationNodeItem>
type RailroadStationNodeItem = TrafficNodeItem

export const buildStationGraphGenerator = (
  generateArc: ArcGenerator<TrafficNodeItem>,
  generateTransferCost: TransferCostGenerator,
  nodeMerger: DuplicateNodesMarger<TrafficNodeItem>
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
              s => Promise.resolve([
                s.id,
                createStationNodeItem(s, railroad.companyId)
              ]),
              async (p) => {
                const id = await toJunctionId(`${p[0]}-${p[0]}`)
                return [
                  id,
                  createJunctionNodeItem({ id, position: p }, railroad.companyId)
                ]
              },
              s => s.routeIds[0],
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
    }, new Map<RouteId, (GraphNode<TrafficNodeItem & {station: {groupId: string}}>)[]>())
    .values()
    .toArray()

  // Isolated pathchains may have same station
  const mergedStationNodes = (await Promise.all(stationNodes.map(n => nodeMerger(n)))).flat()
  const nodesByGroup = Map.groupBy(mergedStationNodes, n => ('station' in n.item && n.item.station.groupId) ?? '')

  // Connect each transit station nodes
  for (const node of filterStationNodes(mergedStationNodes)) {
    const sameGroupNodes = filterStationNodes((node.item.station.groupId && nodesByGroup.get(node.item.station.groupId)) || [])
    for (const current of sameGroupNodes) {
      if (node.id !== current.id && !(await arcExists(node, current)) && !node.item.station.routeIds.some(rid => current.item.station.routeIds.includes(rid))) {
        const arc = generateArc(node, current, generateTransferCost(node, current))
        connect(node, current, arc)
      }
    }
  }

  return mergedStationNodes
}
