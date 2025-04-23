import { deserialize } from "@piyoppi/sansaku-pilot/traffic/graph/serialize"
import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/graph/trafficGraph"
import { JsonFileReader } from "./jsonFileReader";
import type { Railroad } from "@piyoppi/sansaku-pilot/traffic/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/traffic/busroute"

type JsonFileSelectorProps = {
  onFileLoaded: (nodes: TrafficGraphNode[], railroads: Railroad[], busRoutes: BusRoute[]) => void
}

export function TrafficFileReader ({ onFileLoaded }: JsonFileSelectorProps) {
  const handleFileLoad = (data: any) => {
    const nodes = deserialize(data.graph)

    onFileLoaded(nodes, data.railroads, data.busRoutes)
  }

  return (
    <JsonFileReader onFileLoaded={handleFileLoad} />
  )
}
