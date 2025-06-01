import { buildGraphBuilder } from "../../graph/fromPathChain.js"
import { ends, buildPathchain } from '../../geometry/path/pathchain.js'
import { arcExists, connect, type GraphNode, type DuplicateNodesMarger } from "../../graph/graph.js"
import type { Arc, ArcGenerator } from "../../graph/arc/index.js"
import type { Railroad, RailroadStation } from "../railroad.js"
import { toJunctionId, type RouteId } from "../transportation.js"
import { toStationNodes, type TrafficItem } from "./trafficGraph.js"

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
              s => Promise.resolve([
                s.id,
                {
                  type: 'Station',
                  station: s,
                  companyId: railroad.companyId,
                  position: () => s.position
                }
              ]),
              async (p) => {
                const id = await toJunctionId(`${p[0]}-${p[0]}`)
                return [
                  id,
                  {
                    type: 'Junction',
                    junction: { id, position: p },
                    companyId: railroad.companyId,
                    position: () => p
                  }]
              },
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
  const mergedStationNodes = toStationNodes((await Promise.all(stationNodes.map(n => nodeMerger(n)))).flat())
  const nodesByGroup = Map.groupBy(mergedStationNodes, n => n.item.station.groupId ?? '')

  // Connect each transit station nodes
  for (const node of mergedStationNodes) {
    const sameGroupNodes = (node.item.station.groupId && nodesByGroup.get(node.item.station.groupId)) || []
    for (const current of sameGroupNodes) {
      if (node.id !== current.id && !(await arcExists(node, current)) && node.item.station.routeId !== current.item.station.routeId) {
        const arc = generateArc(node, current, generateTransferCost(node, current))
        connect(node, current, arc)
      }
    }
  }

  return mergedStationNodes
}
