import { buildWeakRefArc, buildWeakRefArcDeserializer } from "../../graph/arc.js"
import { buildDuplicateNodesMarger, buildNodeMerger, GraphNode, NodeId } from "../../graph/graph.js"
import { ArcDeserializer, buildGraphDeserializer } from "../../graph/serialize.js"
import { buildBusStopGraphGenerator } from "./busStopGraph.js"
import { buildTrafficGraphDeserializer } from "./serialize.js"
import { buildStationGraphGenerator } from "./stationGraph.js"
import { generateTransferOtherLineArc, generateTransferOwnLineArc, type TrafficItem } from "./trafficGraph.js"
import { buildTrafficGraphFromFile } from "./trafficGraphFile.js"
import type { ArcGenerator } from "../../graph/arcGenerator.js"
import { buildRepositoryArcDeserializer, PartitionedRepository, type NodeRepositoryGetter } from "../../graph/arc/externalRepositoryArc.js"

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
  if (a.item.companyId !== b.item.companyId) {
    return generateTransferOtherLineArc(a, b, cost)
  } else if (a.item.station.routeId !== b.item.station.routeId) {
    return generateTransferOwnLineArc(a, b, cost)
  }

  return buildWeakRefArc(a, b, cost)
}

type DefaultTrafficFromFileOptions = {
  repository?: PartitionedRepository<TrafficItem>
}

export const buildDefaultTrafficGraphFromFile = <I>(
  options: DefaultTrafficFromFileOptions = {}
) => buildTrafficGraphFromFile(
  buildTrafficGraphDeserializer(
    buildGraphDeserializer(
      options.repository &&
      defaultArcDeserializer(
        options.repository
      ),
    )
  )
)

export const defaultArcDeserializer = <I>(
  repository: PartitionedRepository<I>
): ArcDeserializer<I> => {
  const repositoryArcDeserializer = buildRepositoryArcDeserializer(repository)

  return (serializedArc, resolved) => 
    repositoryArcDeserializer(serializedArc, resolved) 
}
