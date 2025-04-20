import { JsonFileSelector } from "~/components/filereader";
import type { Route } from "./+types/home";
import { MapViewer } from "~/components/mapviewer";
import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/trafficGraph";
import { useCallback, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [nodes, setNodes] = useState<TrafficGraphNode[][]>([]);

  const handleFileLoaded = useCallback((data: TrafficGraphNode[]) => {
    console.log('loaded', data)
    setNodes([...nodes, data])
  }, [])

  return <>
    <JsonFileSelector onFileLoaded={handleFileLoaded} />
    <MapViewer nodeSet={nodes}/>
  </>;
}
