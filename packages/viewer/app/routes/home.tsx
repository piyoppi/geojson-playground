import { TrafficFileReader } from "../components/trafficFileReader"
import type { Route } from "./+types/home"
import { MapViewer } from "~/components/mapviewer"
import { NodeSizeControl } from "~/components/nodeSizeControl"
import type { TrafficNode } from "@piyoppi/sansaku-pilot/traffic/graph/trafficGraph"
import { useCallback, useMemo, useState } from "react"
import type { RailroadRoute } from "@piyoppi/sansaku-pilot/traffic/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/traffic/busroute"

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
  const [nodeSize, setNodeSize] = useState<number>(0.45)

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

  return <>
    <div className="relative w-screen h-screen">
      <div className="fixed top-4 left-4 z-10 flex flex-col gap-4">
        <TrafficFileReader onFileLoaded={handleFileLoaded} />
        <NodeSizeControl nodeSize={nodeSize} onNodeSizeChange={setNodeSize} />
      </div>
      <MapViewer nodeSet={nodes} stations={stations} busStops={busStops} nodeSize={nodeSize} />
    </div>
  </>;
}
