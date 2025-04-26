import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/graph/trafficGraph"
import { fromTrafficGraphFile, type TrafficGraphFile } from "@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile"
import { JsonFileReader } from "./jsonFileReader";
import type { Railroad } from "@piyoppi/sansaku-pilot/traffic/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/traffic/busroute"

type JsonFileSelectorProps = {
  onFileLoaded: (nodes: TrafficGraphNode[], railroads: Railroad[], busRoutes: BusRoute[]) => void
}

export function TrafficFileReader ({ onFileLoaded }: JsonFileSelectorProps) {
  const handleFileLoad = (data: TrafficGraphFile) => {
    const { graph, railroads, busRoutes } = fromTrafficGraphFile(data)

    onFileLoaded(graph, railroads, busRoutes)
  }

  return (
    <JsonFileReader onFileLoaded={handleFileLoad} />
  )
}
