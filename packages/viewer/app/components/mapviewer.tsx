import { useEffect, useRef, useMemo } from 'react'
import Sigma from "sigma"
import Graph from "graphology"
import type { TrafficGraphNode } from '@piyoppi/sansaku-pilot/traffic/trafficGraph'

type PropTypes = {
  nodes: TrafficGraphNode[]
}

export function MapViewer({ nodes }: PropTypes) {
  const entry = useRef<HTMLDivElement>(null)

  const graph = useMemo(() => new Graph({ multi: true }), [])

  useMemo(() => {
    graph.clear()

    nodes.forEach(node => graph.addNode(node.id, { label: node.name, size: 0.55, x: node.position[0], y: node.position[1], color: "blue" }))
  }, [nodes])

  useEffect(() => {
    if (!entry.current) return
    new Sigma(graph, entry.current)
  }, [entry])

  return (
    <div ref={entry}></div>
  )
}
