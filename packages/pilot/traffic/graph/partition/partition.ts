import { to } from "../../../graph/graph.js";
import { buildPartitionedRepositoryArcGenerator, type PartitionedRepository } from "../../../graph/arc/partitionedRepositoryArc.js";
import type { TrafficNode, TrafficNodeItem } from "../trafficGraph.js";

export const partition = async (
  repository: PartitionedRepository<TrafficNodeItem>,
  trafficNodes: TrafficNode[],
  getPartitionKey: (node: TrafficNode) => string
): Promise<void> => {
  const stationGroupByPartitionKey = Map.groupBy(trafficNodes, n => getPartitionKey(n))
  const buildRepositoryArc = buildPartitionedRepositoryArcGenerator(
    repository.get,
    node => getPartitionKey(node)
  )

  for (const [partitionKey, nodes] of stationGroupByPartitionKey.entries()) {
    for (const node of nodes) {
      repository.register(node, partitionKey)
    }
  }

  for (const nodes of stationGroupByPartitionKey.values()) {
    for (const node of nodes) {
      const nodePartitionKey = getPartitionKey(node)

      for (let i = 0; i < node.arcs.length; i++) {
        const arc = node.arcs[i]
        const toNode = await to(node, arc)

        if (!toNode || getPartitionKey(toNode) === nodePartitionKey) {
          continue
        }

        const [aNode, bNode] = await Promise.all([arc.a(), arc.b()])

        if (!aNode || !bNode) {
          continue
        }

        const newArc = buildRepositoryArc(aNode, bNode, arc.cost)
        node.arcs[i] = newArc
      }
      repository.register(node, nodePartitionKey)
    }
  }
}
