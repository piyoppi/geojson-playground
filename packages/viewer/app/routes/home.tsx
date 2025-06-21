import { TrafficFileReader } from "../components/trafficFileReader"
import type { Route } from "./+types/home"
import { MapViewer } from "~/components/mapviewer"
import type { TrafficNode } from "@piyoppi/sansaku-pilot/traffic/graph/trafficGraph"
import { useCallback, useState } from "react"
import type { Railroad } from "@piyoppi/sansaku-pilot/traffic/railroad"
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
  const [railroads, setRailroads] = useState<Railroad[]>([])
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([])
  const [activeRouteId, setActiveRouteId] = useState<RouteId | undefined>()

  const handleFileLoaded = useCallback(
    (
      data: TrafficNode[],
      railroads: Railroad[],
      busRoutes: BusRoute[]
    ) => {
      setNodes([...nodes, data])
      setRailroads(railroads)
      setBusRoutes(busRoutes)
    },
    []
  )

  const handleRailroadSelected = useCallback((railroad: Railroad) => {
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
      <div className="flex flex-col gap-4 w-96 h-full">
        <Card className="h-1/3">
          <CardContent className="h-full overflow-y-scroll">
            <RailroadList railroads={railroads} onRailroadSelected={handleRailroadSelected} />
          </CardContent>
        </Card>
        <Card className="h-1/3">
          <CardContent className="h-full overflow-y-scroll">
            <BusRouteList busRoutes={busRoutes} onBusRouteSelected={handleBusRouteSelected} />
          </CardContent>
        </Card>
      </div>
      <MapViewer activeRouteId={activeRouteId} nodeSet={nodes}/>
    </div>
  </>;
}
