import { to } from "../../graph/graph.js";
import { buildRepositoryArcGenerator, type PartitionedRepository } from "../../graph/arc/externalRepositoryArc.js";
import type { CompanyId, Station } from "../transportation";
import { TrafficGraphNode, TrafficItem } from "./trafficGraph.js";

export const separate = async (repository: PartitionedRepository<TrafficItem>, stationNodes: TrafficGraphNode[]): Promise<Map<CompanyId, TrafficGraphNode[]>> => {
  const stationGroupByCompany = Map.groupBy(stationNodes, n => n.item.companyId)
  const buildRepositoryArc = buildRepositoryArcGenerator(
    repository.get,
    node => ('companyId' in node && typeof node.companyId ==='string') ? node.companyId : ''
  )

  for (const [companyId, nodes] of stationGroupByCompany.entries()) {
    for (const node of nodes) {
      repository.register(node, companyId)
    }
  }

  return new Map(
    await Promise.all(
      stationGroupByCompany.entries().map(async ([companyId, nodes]) =>
        [
          companyId,
          await Promise.all(
            nodes.map(async node => ({
            ...node,
            arcs: await Promise.all(
              node.arcs.map(async arc => {
                const toNode = await to(node, arc)

                if (toNode?.item.companyId === node.item.companyId) {
                  return arc
                }

                const [aNode, bNode] = await Promise.all([arc.a(), arc.b()])

                if (!aNode || !bNode) {
                  throw new Error('Node is not found')
                }

                return {
                  ...arc,
                  ...buildRepositoryArc(aNode, bNode, arc.cost)
                }
              })
            )
            }))
          )
        ] as const
      )
    )
  )
}
