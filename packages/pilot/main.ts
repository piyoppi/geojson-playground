import { buildWeakRefArc } from "./graph/arc/weakRefArc.js"
import { buildDuplicateNodesMarger, buildNodeMerger, GraphNode } from "./graph/graph.js"
import { ArcDeserializer, buildGraphDeserializer } from "./graph/serialize.js"
import { buildBusStopGraphGenerator } from "./traffic/graph/generator/busStopGraphGenerator.js"
import { buildStationGraphGenerator } from "./traffic/graph/generator/stationGraphGenerator.js"
import { buildTrafficGraphDeserializer } from "./traffic/graph/serialize.js"
import { generateTransferOtherLineArc, generateTransferOwnLineArc, type TrafficNodeItem } from "./traffic/graph/trafficGraph.js"
import { buildTrafficGraphFromFile } from "./traffic/trafficGraphFile.js"
import { buildPartitionedRepositoryArcDeserializer, PartitionedRepositoryGetter, type PartitionedRepository } from "./graph/arc/partitionedRepositoryArc.js"
import type { ArcGenerator } from "./graph/arc/index.js"

export const buildDefaultStationGrpahGenerator = () => buildStationGraphGenerator(
  defaultTrafficArcGenerator,
  () => 1,
  buildDuplicateNodesMarger(
    buildNodeMerger(
      defaultArcGenerator
    )
  )
)

export const buildDefaultBusStopGraphGenerator = () => buildBusStopGraphGenerator(
  defaultTrafficArcGenerator
)

const defaultArcGenerator = buildWeakRefArc

const defaultTrafficArcGenerator: ArcGenerator<TrafficNodeItem> = (a, b, cost) => {
  if (a.item.type === 'Station' && b.item.type === 'Station') {
    if (a.item.companyId !== b.item.companyId) {
      return generateTransferOtherLineArc(a, b, cost)
    } else if (a.item.station.routeId !== b.item.station.routeId) {
      return generateTransferOwnLineArc(a, b, cost)
    }
  }

  return buildWeakRefArc(a, b, cost)
}

type DefaultTrafficFromFileOptions = {
  repository?: PartitionedRepository<TrafficNodeItem>
}

export const buildDefaultTrafficGraphFromFile = (
  options: DefaultTrafficFromFileOptions = {}
) => buildTrafficGraphFromFile(
  buildTrafficGraphDeserializer(
    buildGraphDeserializer(
      getResolvedNode => buildDefaultArcDeserializer<TrafficNodeItem>(
        async (nodeId, pk) => getResolvedNode(nodeId) || await options.repository?.get(nodeId, pk),
      )
    )
  )
)

export const buildDefaultArcDeserializer = <I>(
  getNode: PartitionedRepositoryGetter<GraphNode<I>>
): ArcDeserializer<I> => {
  return buildPartitionedRepositoryArcDeserializer(getNode)
}
