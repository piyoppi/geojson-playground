import { buildWeakRefArc } from "../../graph/arc.js"
import { buildDuplicateNodesMarger, buildNodeMerger } from "../../graph/graph.js"
import { buildGraphDeserializer } from "../../graph/serialize.js"
import { buildBusStopGraphGenerator } from "./busStopGraph.js"
import { buildTrafficGraphDeserializer } from "./serialize.js"
import { buildStationGraphGenerator, StationNode } from "./stationGraph.js"
import { generateTransferOtherLineArc, generateTransferOwnLineArc, TrafficGraphNode } from "./trafficGraph.js"
import { buildTrafficGraphFromFile } from "./trafficGraphFile.js"
import type { Station } from "../transportation"
import type { BusStopNode } from "../busroute"
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

const defaultTrafficGraphGenerator: ArcGenerator<TrafficGraphNode<Station>> = (a, b, cost) => {
  if (a.companyId !== b.companyId) {
    return generateTransferOtherLineArc(a, b, cost)
  } else if (a.item.routeId !== b.item.routeId) {
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
