import { buildWeakRefArc } from "../../graph/arc.js"
import { buildDuplicateNodesMarger, buildNodeMerger } from "../../graph/graph.js"
import { buildGraphDeserializer } from "../../graph/serialize"
import { buildBusStopGraphGenerator } from "./busStopGraph.js"
import { buildTrafficGraphDeserializer } from "./serialize.js"
import { buildStationGraphGenerator } from "./stationGraph.js"
import { buildTrafficGraphFromFile } from "./trafficGraphFile.js"

export const buildDefaultStationGrpahGenerator = () => buildStationGraphGenerator(
  defaultArcGenerator,
  () => 1,
  buildDuplicateNodesMarger(
    buildNodeMerger(
      buildWeakRefArc
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

const defaultGraphDeserializer = buildGraphDeserializer(
  defaultArcGenerator
)

const defaultTrafficGraphDeserializer = buildTrafficGraphDeserializer(
  defaultGraphDeserializer
)

