import { useCallback, useState } from "react"
import { TrafficFileReader } from "../components/trafficFileReader"
import { Card, CardFooter } from "~/components/ui/card"
import type { Route } from "./+types/home"
import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/graph/trafficGraph"
import type { Railroad } from "@piyoppi/sansaku-pilot/traffic/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/traffic/busroute"
import type { Station } from "@piyoppi/sansaku-pilot/traffic/transportation"
import { StationSelector } from "~/components/stationSelector"
import { Button } from "~/components/ui/button"
import { findShortestPath, isEqualNodeId } from "@piyoppi/sansaku-pilot/graph/graph"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sansaku-Viewer" },
    { name: "description", content: "Sansaku MapViewer" },
  ];
}

export default function Transfer() {
  const [nodes, setNodes] = useState<TrafficGraphNode<Station>[][]>([])
  const [railroads, setRailroads] = useState<Railroad[]>([])
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([])
  const [fromStation, setFromStation] = useState<Station | null>(null)
  const [toStation, setToStation] = useState<Station | null>(null)
  const [transferResult, setTransferResult] = useState<TrafficGraphNode<Station>[] | null>(null)

  const handleFileLoaded = useCallback(
    (
      data: TrafficGraphNode<Station>[],
      railroads: Railroad[],
      busRoutes: BusRoute[]
    ) => {
      setNodes([...nodes, data])
      setRailroads(railroads)
      setBusRoutes(busRoutes)
    },
    []
  )

  const handleFromStationSelected = useCallback((station: Station) => {
    setFromStation(station)
  }, [])

  const handleToStationSelected = useCallback((station: Station) => {
    setToStation(station)
  }, [])

  const handleSearch = useCallback(async () => {
    if (!fromStation || !toStation) return

    const startNode = nodes.flat().find(n => isEqualNodeId(n.id, fromStation?.id))
    const endNode = nodes.flat().find(n => isEqualNodeId(n.id, toStation?.id))
    console.log(`startNode: ${startNode?.item.name}(${startNode?.id}), endNode: ${endNode?.item.name}(${endNode?.item.id})`)

    if (!startNode || !endNode) return

    setTransferResult(await findShortestPath(startNode, endNode))
  }, [fromStation, toStation, nodes])

  return <article className="p-4">
    <div className="flex flex-col gap-4">
      <TrafficFileReader
        onFileLoaded={handleFileLoaded}
      />
      <div className="flex flex-row gap-4 h-screen">
        <div className="flex flex-col w-96 h-full">
          <Card className="h-1/2 p-4">
            <StationSelector railroads={railroads} busRoutes={busRoutes} onStationSelected={handleFromStationSelected} />
            <hr className="my-4" />
            <StationSelector railroads={railroads} busRoutes={busRoutes} onStationSelected={handleToStationSelected}/>
            <CardFooter className="p-0">
              <Button className="w-full" onClick={handleSearch}>検索</Button>
            </CardFooter>
          </Card>
        </div>
        <div className="flex flex-col gap-4 w-96 h-full">
          <ol>
            {transferResult?.map((node, index) => (
              <li key={index}>
                {node.item.name} ({node.id})
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  </article>;
}
