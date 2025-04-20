import { useEffect, useRef, useMemo, useState } from 'react'
import Sigma from "sigma"
import Graph from "graphology"
import type { TrafficGraphNode } from '@piyoppi/sansaku-pilot/traffic/trafficGraph'

type PropTypes = {
  nodeSet: TrafficGraphNode[][],
  activeRouteId?: string,
}

export function MapViewer({ nodeSet, activeRouteId }: PropTypes) {
  const entry = useRef<HTMLDivElement>(null)

  const [renderedNodeSet, setRenderedNodeSet] = useState<TrafficGraphNode[][]>([])
  const graph = useMemo(() => new Graph({ multi: true }), [])

  useEffect(() => {
    const nodes = nodeSet.filter(rendered => !renderedNodeSet.some(nodes => rendered === nodes)).flat()

    nodes.map(node => {
      graph.addNode(node.id, { label: node.name, routeId: node.routeId, size: 0.55, x: node.position[0], y: node.position[1], color: "blue" })
    })

    nodes.forEach(node => {
      node.arcs.forEach(arc => {
        const aNode = arc.a.deref()
        const bNode = arc.b.deref()

        if (!aNode || !bNode) return

        graph.addEdge(aNode.id, bNode.id, { color: "darkgray" })
      })
    })

    setRenderedNodeSet([...nodeSet])
  }, [nodeSet])

  useEffect(() => {
    if (!entry.current) return
    const sigma = new Sigma(graph, entry.current)

    sigma.setSetting('nodeReducer', (_node, data) => {
      if (data.routeId === activeRouteId) {
        return {
          ...data,
          color: 'red',
          size: 2,
        }
      }
      return data
    })

    return () => {
      sigma.kill()
    }
  }, [entry])

  return (
    <div ref={entry} className="w-screen h-screen"></div>
  )
}
