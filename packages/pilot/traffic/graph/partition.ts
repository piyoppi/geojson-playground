import { to } from "../../graph/graph.js";
import { buildPartitionedRepositoryArcGenerator, type PartitionedRepository } from "../../graph/arc/partitionedRepositoryArc.js";
import type { TrafficGraphNode, TrafficItem } from "./trafficGraph.js";
import { Route, Station } from "../transportation.js";

export const getTrafficGraphPartitionKey = (item: TrafficItem | Route<Station>) => item.companyId

export const partition = async (
  repository: PartitionedRepository<TrafficItem>,
  stationNodes: TrafficGraphNode[]
): Promise<void> => {
  const stationGroupByCompany = Map.groupBy(stationNodes, n => getTrafficGraphPartitionKey(n.item))
  const buildRepositoryArc = buildPartitionedRepositoryArcGenerator(
    repository.get,
    node => node.item.companyId
  )

  for (const [companyId, nodes] of stationGroupByCompany.entries()) {
    for (const node of nodes) {
      repository.register(node, companyId)
    }
  }

  for (const nodes of stationGroupByCompany.values()) {
    for (const node of nodes) {
      for (let i = 0; i < node.arcs.length; i++) {
        const arc = node.arcs[i]
        const toNode = await to(node, arc)

        if (toNode?.item.companyId === node.item.companyId) {
          continue
        }

        const [aNode, bNode] = await Promise.all([arc.a(), arc.b()])

        if (!aNode || !bNode) {
          continue
        }

        const newArc = buildRepositoryArc(aNode, bNode, arc.cost)
        node.arcs[i] = newArc
      }
      repository.register(node, node.item.companyId)
    }
  }
}
