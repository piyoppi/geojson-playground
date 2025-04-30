import { buildWeakRefArc } from "../../graph/arc.js"
import { ArcGenerator } from "../../graph/arcGenerator.js"
import { buildDuplicateNodesMarger, buildNodeMerger } from "../../graph/graph.js"
import { buildGraphDeserializer } from "../../graph/serialize.js"
import { Station } from "../railroad.js"
import { buildBusStopGraphGenerator } from "./busStopGraph.js"
import { buildTrafficGraphDeserializer } from "./serialize.js"
import { buildStationGraphGenerator, StationNode } from "./stationGraph.js"
import { generateTransferOtherLineArc, generateTransferOwnLineArc } from "./trafficGraph.js"
import { buildTrafficGraphFromFile } from "./trafficGraphFile.js"

export const buildDefaultStationGrpahGenerator = () => buildStationGraphGenerator(
  defaultRailroadGraphGenerator,
  () => 1,
  buildDuplicateNodesMarger(
    buildNodeMerger(
      defaultArcGenerator
    )
  )
)

export const buildDefaultBusStopGraphGenerator = () => buildBusStopGraphGenerator(
  defaultArcGenerator
)

export const buildDefaultTrafficGraphFromFile = () => buildTrafficGraphFromFile(
  defaultTrafficGraphDeserializer
)

const defaultArcGenerator = buildWeakRefArc

const defaultRailroadGraphGenerator: ArcGenerator<StationNode> = (a, b, cost) => {
  if (a.companyId !== b.companyId) {
    return generateTransferOtherLineArc(a, b, cost)
  } else if (a.item.routeId !== b.item.routeId) {
    return generateTransferOwnLineArc(a, b, cost)
  }

  return buildWeakRefArc(a, b, cost)
}

const defaultGraphDeserializer = buildGraphDeserializer(
  defaultArcGenerator
)

const defaultTrafficGraphDeserializer = buildTrafficGraphDeserializer(
  defaultGraphDeserializer
)
