import { buildWeakRefArc } from "../../graph/arc.js"
import { buildDuplicateNodesMarger, buildNodeMerger } from "../../graph/graph.js"
import { buildGraphDeserializer } from "../../graph/serialize.js"
import { buildBusStopGraphGenerator } from "./busStopGraph.js"
import { buildTrafficGraphDeserializer } from "./serialize.js"
import { buildStationGraphGenerator } from "./stationGraph.js"
import { generateTransferOtherLineArc, generateTransferOwnLineArc, TrafficGraphNode, TrafficItem } from "./trafficGraph.js"
import { buildTrafficGraphFromFile } from "./trafficGraphFile.js"
import type { ArcGenerator } from "../../graph/arcGenerator"

export const buildDefaultStationGrpahGenerator = () => buildStationGraphGenerator(
  defaultTrafficGraphGenerator,
  () => 1,
  buildDuplicateNodesMarger(
    buildNodeMerger(
      defaultArcGenerator
    )
  )
)

export const buildDefaultBusStopGraphGenerator = () => buildBusStopGraphGenerator(
  defaultTrafficGraphGenerator
)

export const buildDefaultTrafficGraphFromFile = () => buildTrafficGraphFromFile(
  defaultTrafficGraphDeserializer
)

const defaultArcGenerator = buildWeakRefArc

const defaultTrafficGraphGenerator: ArcGenerator<TrafficItem> = (a, b, cost) => {
  if (a.item.companyId !== b.item.companyId) {
    return generateTransferOtherLineArc(a, b, cost)
  } else if (a.item.station.routeId !== b.item.station.routeId) {
    return generateTransferOwnLineArc(a, b, cost)
  }

  return buildWeakRefArc(a, b, cost)
}

const defaultGraphDeserializer = buildGraphDeserializer(
  defaultTrafficGraphGenerator
)

const defaultTrafficGraphDeserializer = buildTrafficGraphDeserializer(
  defaultGraphDeserializer
)
