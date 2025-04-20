import { deserialize } from "@piyoppi/sansaku-pilot/traffic/serialize"
import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/trafficGraph"
import { JsonFileReader } from "./jsonFileReader";
import type { Railroad } from "@piyoppi/sansaku-pilot/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/busroute"

type JsonFileSelectorProps = {
  onRailroadFileLoaded: (nodes: TrafficGraphNode[], railroads: Railroad[]) => void
  onBusRouteFileLoaded: (nodes: TrafficGraphNode[], busRoutes: BusRoute[]) => void
}

export function TrafficFileReader ({ onRailroadFileLoaded, onBusRouteFileLoaded }: JsonFileSelectorProps) {
  const handleFileLoad = (data: any) => {
    const nodes = deserialize(data.graph)

    if (data.railroads) {
      onRailroadFileLoaded(nodes, data.railroads)
      return
    }
    if (data.busRoutes) {
      onBusRouteFileLoaded(nodes, data.busRoutes)
      return
    }
  }

  return (
    <JsonFileReader onFileLoaded={handleFileLoad} />
  )
}
