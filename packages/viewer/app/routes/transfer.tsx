import { useCallback, useState } from "react"
import { TrafficFileReader } from "../components/trafficFileReader"
import { Card, CardContent } from "~/components/ui/card"
import { RailroadList } from "~/components/railroadList"
import { BusRouteList } from "~/components/busRouteList"
import { StationList } from "~/components/stationList"
import type { Route } from "./+types/home"
import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/graph/trafficGraph"
import type { Railroad } from "@piyoppi/sansaku-pilot/traffic/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/traffic/busroute"
import type { Station } from "@piyoppi/sansaku-pilot/traffic/transportation"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sansaku-Viewer" },
    { name: "description", content: "Sansaku MapViewer" },
  ];
}

export default function Transfer() {
  const [nodes, setNodes] = useState<TrafficGraphNode[][]>([])
  const [railroads, setRailroads] = useState<Railroad[]>([])
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([])
  const [Stations, setStations] = useState<Station[] | null>(null)

  const handleFileLoaded = useCallback(
    (
      data: TrafficGraphNode[],
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
    setStations(railroad.stations)
  }, [])

  const handleBusRouteSelected = useCallback((busRoute: BusRoute) => {
    setStations(busRoute.stations)
  }, [])

  return <>
    <TrafficFileReader
      onFileLoaded={handleFileLoaded}
    />
    <div className="flex flex-row gap-4 h-screen">
      <div className="flex flex-col gap-4 w-96 h-full">
        <Card className="h-1/2">
          <CardContent className="h-full overflow-y-scroll">
            <RailroadList railroads={railroads} onRailroadSelected={handleRailroadSelected} />
          </CardContent>
        </Card>
        <Card className="h-1/2">
          <CardContent className="h-full overflow-y-scroll">
            <BusRouteList busRoutes={busRoutes} onBusRouteSelected={handleBusRouteSelected} />
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-4 w-96 h-full">
        <Card className="h-full">
          <CardContent className="h-full overflow-y-scroll">
            { Stations && <StationList stations={Stations} /> }
          </CardContent>
        </Card>
      </div>
    </div>
  </>;
}
