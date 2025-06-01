import { buildWeakRefArc } from "../../graph/arc/weakRefArc.js"
import { buildDuplicateNodesMarger, buildNodeMerger, GraphNode, NodeId } from "../../graph/graph.js"
import { ArcDeserializer, buildGraphDeserializer } from "../../graph/serialize.js"
import { buildBusStopGraphGenerator } from "./busStopGraph.js"
import { buildTrafficGraphDeserializer } from "./serialize.js"
import { buildStationGraphGenerator } from "./stationGraph.js"
import { generateTransferOtherLineArc, generateTransferOwnLineArc, type TrafficItem } from "./trafficGraph.js"
import { buildTrafficGraphFromFile } from "./trafficGraphFile.js"
import { buildRepositoryArcDeserializer, type PartitionedRepository } from "../../graph/arc/externalRepositoryArc.js"
import type { ArcGenerator } from "../../graph/arc/index.js"

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

const defaultTrafficArcGenerator: ArcGenerator<TrafficItem> = (a, b, cost) => {
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
  repository?: PartitionedRepository<TrafficItem>
}

export const buildDefaultTrafficGraphFromFile = (
  options: DefaultTrafficFromFileOptions = {}
) => buildTrafficGraphFromFile(
  buildTrafficGraphDeserializer(
    buildGraphDeserializer(
      getter => buildDefaultArcDeserializer<TrafficItem>(
        options.repository,
        getter
      )
    )
  )
)

export const buildDefaultArcDeserializer = <I>(
  repository: PartitionedRepository<I> | undefined,
  getter: (id: NodeId) => GraphNode<I> | undefined
): ArcDeserializer<I> => {
  if (!repository) return () => undefined

  const repositoryArcDeserializer = buildRepositoryArcDeserializer(repository, getter)

  return (serializedArc, resolved) => 
    repositoryArcDeserializer(serializedArc, resolved) 
}
