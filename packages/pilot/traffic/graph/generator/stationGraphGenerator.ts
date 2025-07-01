import { buildGraphBuilder } from "../../../graph/builder/fromPathChain.js"
import { ends, buildPathchain } from '../../../geometry/path/pathchain.js'
import { connect, type GraphNode, type DuplicateNodesMarger, arcExists } from "../../../graph/graph.js"
import type { ArcGenerator } from "../../../graph/arc/index.js"
import type { Railroad } from "../../railroad.js"
import { Station, toJunctionId, type RouteId } from "../../transportation.js"
import { createJunctionNodeItem, createStationNodeItem, isRailroadStationNode, TrafficNode, type TrafficNodeItem } from "../trafficGraph.js"

type TransferCostGenerator = (aStation: Station, bStation: Station) => number
// type RailroadStationNode = GraphNode<RailroadStationNodeItem>
// type RailroadStationNodeItem = TrafficNodeItem

export const buildStationGraphGenerator = (
  generateArc: ArcGenerator<TrafficNodeItem>,
  generateTransferCost: TransferCostGenerator,
  nodeMerger: DuplicateNodesMarger<TrafficNodeItem>
) => async (
  railroads: Railroad[]
): Promise<TrafficNode[]> => {
  const stationNodes = (await Promise.all(
        railroads.map(railroad => buildPathchain(railroad.track).then(g => [railroad, g] as const))
      ).then(results => Promise.all(
        results.flatMap(([railroad, isolatedPathChains]) => {
          const fromPathChain = buildGraphBuilder(generateArc)
          return isolatedPathChains.map(pathchains => {
            const end = ends(pathchains)[0]

            return fromPathChain(
              railroad.route.stations.map(s => ({...s})),
              pathchains,
              end.from,
              s => Promise.resolve([
                s.id,
                createStationNodeItem(s)
              ]),
              async (p) => {
                const id = await toJunctionId(`${p[0]}-${p[0]}`)
                return [
                  id,
                  createJunctionNodeItem({ id, position: p }, railroad.route.companyId, railroad.route.id)
                ]
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
    }, new Map<RouteId, (GraphNode<TrafficNodeItem & {station: {groupId: string}}>)[]>())
    .values()
    .toArray()

  // Isolated pathchains may have same station
  //
  //  [A] ----- [B]         [A] ----- [B]
  //  [A] --+          =>    |
  //        |                |
  //        +-- [C]          +------- [C]
  //
  const mergedStationNodes = (await Promise.all(stationNodes.map(n => nodeMerger(n)))).flat()

  // Connect each transit station nodes
  //
  // [A(1)] ------ [B]      [A(1)] ------ [B]
  //                    =>    |
  // [A(2)] ------ [B]      [A(2)] ------ [B]
  //
  const stationById = new Map(railroads.flatMap(r => r.route.stations.map(s => [s.id, s])))
  const nodesByGroup = Map.groupBy(mergedStationNodes, n => (isRailroadStationNode(n) && stationById.get(n.item.stationId)?.groupId) ?? '')
  for (const sameGroupNodes of nodesByGroup.values()) {
    for (const current of sameGroupNodes) {
      for (const other of sameGroupNodes) {
        if (!isRailroadStationNode(current) || !isRailroadStationNode(other)) continue

        const currentStation = stationById.get(current.item.stationId)
        const otherStation = stationById.get(other.item.stationId)
        const isAlreadyConnected = await arcExists(current, other)

        if (!currentStation || !otherStation || isAlreadyConnected) continue

        if (current.id !== other.id && currentStation.routeId !== otherStation.routeId) {
          const arc = generateArc(current, other, generateTransferCost(currentStation, otherStation))
          connect(current, other, arc)
        }
      }
    }
  }

  return mergedStationNodes
}
