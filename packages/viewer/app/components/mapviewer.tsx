import { useEffect, useRef, useMemo, useState } from 'react'
import Sigma from "sigma"
import Graph from "graphology"
import type { TrafficGraphNode } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph'
import type { RouteId, Station } from '@piyoppi/sansaku-pilot/traffic/transportation'

type PropTypes = {
  nodeSet: TrafficGraphNode[][],
  activeRouteId?: RouteId,
}

export function MapViewer({ nodeSet, activeRouteId }: PropTypes) {
  const entry = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)

  const [renderedNodeSet, setRenderedNodeSet] = useState<TrafficGraphNode[][]>([])
  const graph = useMemo(() => new Graph({ multi: true }), [])

  useEffect(() => {
    const nodes = nodeSet.filter(rendered => !renderedNodeSet.some(nodes => rendered === nodes)).flat()

    nodes.map(node => {
      graph.addNode(
        node.id,
        {
          label: `${node.item.station.name}(${node.item.station.id})`,
          routeId: node.item.station.routeId,
          size: 0.55,
          x: node.item.station.position[0],
          y: node.item.station.position[1],
          color: "blue"
        })
    })

    for (const node of nodes) {
      for (const arc of node.arcs) {
        Promise.all([arc.a(), arc.b()]).then((([aNode, bNode]) => {
          if (!aNode || !bNode) return
          graph.addEdge(aNode.id, bNode.id, { color: "darkgray" })
        }))
      }
    }

    setRenderedNodeSet([...nodeSet])
  }, [nodeSet])

  useEffect(() => {
    sigmaRef.current?.scheduleRefresh()
    sigmaRef.current?.setSetting('nodeReducer', (_node, data) => {
      if (data.routeId === activeRouteId) {
        return {
          ...data,
          color: 'red',
          size: 1,
        }
      }

      return data
    })
  }, [activeRouteId])

  useEffect(() => {
    if (!entry.current) return
    const sigma = new Sigma(graph, entry.current)
    sigmaRef.current = sigma

    return () => {
      sigma.kill()
    }
  }, [entry])

  return (
    <div ref={entry} className="w-full h-full"></div>
  )
}
