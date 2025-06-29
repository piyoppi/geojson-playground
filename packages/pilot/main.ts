import { buildWeakRefArc } from "./graph/arc/weakRefArc.js"
import { buildDuplicateNodesMarger, buildNodeMerger } from "./graph/graph.js"
import { buildGraphDeserializer } from "./graph/serialize.js"
import { buildBusStopGraphGenerator } from "./traffic/graph/generator/busStopGraphGenerator.js"
import { buildStationGraphGenerator } from "./traffic/graph/generator/stationGraphGenerator.js"
import { buildTrafficGraphDeserializer } from "./traffic/graph/serialize.js"
import { BusStopNodeItem, type TrafficNodeItem } from "./traffic/graph/trafficGraph.js"
import { buildTrafficGraphFromFile } from "./traffic/trafficGraphFile.js"
import { buildPartitionedRepositoryArcDeserializer, type PartitionedRepository } from "./graph/arc/partitionedRepositoryArc.js"
import type { ArcGenerator } from "./graph/arc/index.js"

export const buildDefaultStationGrpahGenerator = () => buildStationGraphGenerator(
  defaultTrafficArcGenerator(),
  () => 1,
  buildDuplicateNodesMarger(
    buildNodeMerger(
      defaultArcGenerator
    )
  )
)

export const buildDefaultBusStopGraphGenerator = () => buildBusStopGraphGenerator(
  defaultTrafficArcGenerator() as ArcGenerator<BusStopNodeItem>
)

const defaultArcGenerator = buildWeakRefArc

export const defaultTrafficArcGenerator = (): ArcGenerator<TrafficNodeItem> => (a, b, cost) => buildWeakRefArc(a, b, cost)

type DefaultTrafficFromFileOptions = {
  repository?: PartitionedRepository<TrafficNodeItem>
}

export const buildDefaultTrafficGraphFromFile = (
  options: DefaultTrafficFromFileOptions = {}
) => buildTrafficGraphFromFile(
  buildTrafficGraphDeserializer(
    buildGraphDeserializer(
      ctx => buildPartitionedRepositoryArcDeserializer<TrafficNodeItem>(
        nodeId => Promise.resolve(ctx.getResolvedNode(nodeId)),
        async (nodeId, pk) => await options.repository?.get(nodeId, pk),
      )
    )
  )
)
