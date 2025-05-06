import { buildWeakRefArc } from "../../graph/arc.js"
import { buildDuplicateNodesMarger, buildNodeMerger, GraphNode } from "../../graph/graph.js"
import { ArcDeserializer, buildGraphDeserializer } from "../../graph/serialize.js"
import { buildBusStopGraphGenerator } from "./busStopGraph.js"
import { buildTrafficGraphDeserializer } from "./serialize.js"
import { buildStationGraphGenerator } from "./stationGraph.js"
import { generateTransferOtherLineArc, generateTransferOwnLineArc, type TrafficItem } from "./trafficGraph.js"
import { buildTrafficGraphFromFile } from "./trafficGraphFile.js"
import type { ArcGenerator } from "../../graph/arcGenerator.js"
import { buildRepositoryArcDeserializer, type NodeRepositoryGetter } from "../../graph/arc/externalRepositoryArc.js"

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
  nodeRepositoryGetter?: NodeRepositoryGetter<GraphNode<TrafficItem>>
}

export const buildDefaultTrafficGraphFromFile = <I>(
  options: DefaultTrafficFromFileOptions = {}
) => buildTrafficGraphFromFile(
  buildTrafficGraphDeserializer(
    buildGraphDeserializer(
      defaultArcDeserializer(options.nodeRepositoryGetter),
    )
  )
)

export const defaultArcDeserializer = <I>(
  getter?: NodeRepositoryGetter<GraphNode<I>>
): ArcDeserializer<I> => {
  if (!getter) {
    return (serializedArc, a, b) => buildWeakRefArc(a, b, Number(serializedArc.arcCost))
  }

  const repositoryArcDeserializer = buildRepositoryArcDeserializer(getter)

  return (serializedArc, a, b) => 
    repositoryArcDeserializer(serializedArc, a, b) ||
    buildWeakRefArc(a, b, Number(serializedArc.arcCost))
}
