import { JsonFileSelector } from "~/components/filereader";
import type { Route } from "./+types/home";
import { MapViewer } from "~/components/mapviewer";
import type { TrafficGraphNode } from "@piyoppi/sansaku-pilot/traffic/trafficGraph";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [nodes, setNodes] = useState<TrafficGraphNode[]>([]);

  const handleFileLoaded = (data: TrafficGraphNode[]) => {
    setNodes(data)
  }

  return <>
    <JsonFileSelector onFileLoaded={handleFileLoaded} />
    <MapViewer nodes={nodes}/>
  </>;
}
