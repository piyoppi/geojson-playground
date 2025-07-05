import { TrafficFileReader } from "../components/trafficFileReader"
import type { Route } from "./+types/home"
import { MapViewer } from "~/components/mapviewer"
import type { TrafficNode } from "@piyoppi/sansaku-pilot/traffic/graph/trafficGraph"
import { useCallback, useMemo, useState } from "react"
import type { Railroad, RailroadRoute } from "@piyoppi/sansaku-pilot/traffic/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/traffic/busroute"
import { Card, CardContent } from "~/components/ui/card"
import { RailroadList } from "~/components/railroadList"
import { BusRouteList } from "~/components/busRouteList"
import type { RouteId } from "@piyoppi/sansaku-pilot/traffic/transportation"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sansaku-Viewer" },
    { name: "description", content: "Sansaku MapViewer" },
  ];
}

export default function Home() {
  const [nodes, setNodes] = useState<TrafficNode[][]>([])
  const [railroads, setRailroads] = useState<RailroadRoute[]>([])
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([])
  const [activeRouteId, setActiveRouteId] = useState<RouteId | undefined>()

  const stations = useMemo(() => railroads.flatMap(r => r.stations), [railroads])
  const busStops = useMemo(() => busRoutes.flatMap(b => b.stations), [busRoutes])

  const handleFileLoaded = useCallback(
    (
      data: TrafficNode[],
      railroadRoutes: RailroadRoute[],
      busRoutes: BusRoute[]
    ) => {
      setNodes([...nodes, data])
      setRailroads(railroadRoutes)
      setBusRoutes(busRoutes)
    },
    []
  )

  const handleRailroadSelected = useCallback((railroad: RailroadRoute) => {
    setActiveRouteId(railroad.id)
  }, [])

  const handleBusRouteSelected = useCallback((busRoute: BusRoute) => {
    setActiveRouteId(busRoute.id)
  }, [])

  return <>
    <TrafficFileReader
      onFileLoaded={handleFileLoaded}
    />
    <div className="flex flex-row gap-4 w-screen h-screen">
      <MapViewer activeRouteId={activeRouteId} nodeSet={nodes} stations={stations} busStops={busStops}/>
    </div>
  </>;
}
