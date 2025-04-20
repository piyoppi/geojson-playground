import { TrafficFileReader } from "../components/trafficFileReader"
import type { Route } from "./+types/home"
import { MapViewer } from "~/components/mapviewer"
import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/trafficGraph"
import { useCallback, useState } from "react"
import type { Railroad } from "@piyoppi/sansaku-pilot/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/busroute"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [nodes, setNodes] = useState<TrafficGraphNode[][]>([]);

  const handleRailroadFileLoaded = useCallback((data: TrafficGraphNode[], railroads: Railroad[]) => {
    setNodes([...nodes, data])
  }, [])

  const handleBusRouteFileLoaded = useCallback((data: TrafficGraphNode[], busRoutes: BusRoute[]) => {
    setNodes([...nodes, data])
  }, [])

  return <>
    <TrafficFileReader
      onRailroadFileLoaded={handleRailroadFileLoaded}
      onBusRouteFileLoaded={handleBusRouteFileLoaded}
    />
    <MapViewer activeRouteId="中央線-東日本旅客鉄道" nodeSet={nodes}/>
  </>;
}
