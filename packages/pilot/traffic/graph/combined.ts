import { buildWeakRefArc } from "../../graph/arc.js"
import { ArcGenerator } from "../../graph/arcGenerator.js"
import { buildDuplicateNodesMarger, buildNodeMerger } from "../../graph/graph.js"
import { buildGraphDeserializer } from "../../graph/serialize.js"
import { Station } from "../railroad.js"
import { buildBusStopGraphGenerator } from "./busStopGraph.js"
import { buildTrafficGraphDeserializer } from "./serialize.js"
import { buildStationGraphGenerator, StationNode } from "./stationGraph.js"
import { buildTrafficGraphFromFile } from "./trafficGraphFile.js"

export const buildDefaultStationGrpahGenerator = () => buildStationGraphGenerator(
  defaultArcGenerator,
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

//const defaultRailroadGraphGenerator: ArcGenerator<StationNode> = (a, b, cost) => {
//
//}

const defaultGraphDeserializer = buildGraphDeserializer(
  defaultArcGenerator
)

const defaultTrafficGraphDeserializer = buildTrafficGraphDeserializer(
  defaultGraphDeserializer
)
