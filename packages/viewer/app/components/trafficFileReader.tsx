import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/graph/trafficGraph"
import type { TrafficGraphFile } from "@piyoppi/sansaku-pilot/traffic/trafficGraphFile"
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot'
import { JsonFileReader } from "./jsonFileReader";
import type { Railroad } from "@piyoppi/sansaku-pilot/traffic/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/traffic/busroute"

const trafficGraphFromFile = buildDefaultTrafficGraphFromFile()

type JsonFileSelectorProps = {
  onFileLoaded: (nodes: TrafficGraphNode[], railroads: Railroad[], busRoutes: BusRoute[]) => void
}

export function TrafficFileReader ({ onFileLoaded }: JsonFileSelectorProps) {
  const handleFileLoad = (data: TrafficGraphFile) => {
    const { graph, railroads, busRoutes } = trafficGraphFromFile(data)

    onFileLoaded(graph, railroads, busRoutes)
  }

  return (
    <JsonFileReader onFileLoaded={handleFileLoad} />
  )
}
