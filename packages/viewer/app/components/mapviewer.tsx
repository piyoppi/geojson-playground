import { useEffect, useRef, useMemo, useState } from 'react'
import Sigma from "sigma"
import Graph from "graphology"
import type { TrafficNode } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph'
import type { RouteId, Station } from '@piyoppi/sansaku-pilot/traffic/transportation'

type PropTypes = {
  nodeSet: TrafficNode[][],
  stations: Station[],
  activeRouteId?: RouteId,
}

export function MapViewer({ nodeSet, stations, activeRouteId }: PropTypes) {
  const entry = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)

  const [renderedNodeSet, setRenderedNodeSet] = useState<TrafficNode[][]>([])
  const graph = useMemo(() => new Graph({ multi: true }), [])

  const stationMap = useMemo(() => new Map(stations.map(s => [s.id, s])), stations)

  useEffect(() => {
    const nodes = nodeSet.filter(rendered => !renderedNodeSet.some(nodes => rendered === nodes)).flat()

    nodes.forEach(node => {
      if (node.item.type !== 'RailroadStation' && node.item.type !== 'Junction') return

      const { label, routeId, position } = node.item.type === 'RailroadStation'
        ? {
            label: `${node.item.station.name}(${node.item.station.routeId})`,
            routeId: node.item.station.routeId,
            position: node.item.station.position
          }
        : node.item.tyle === 'BusRoute' ? {
            label: `${node.item.station.name}(${node.item.station.routeId})`,
            routeId: node.item.station.routeId,
            position: node.item.station.position
        } : {
            label: `Junction(${node.item.junction.id})`,
            routeId: node.item.junction.id,
            position: node.item.junction.position
        }

      graph.addNode(
        node.id,
        {
          label,
          routeId,
          size: 0.45,
          x: position[0],
          y: position[1],
          color: "blue"
        }
      )
    })

    for (const node of nodes) {
      for (const arc of node.arcs) {
        Promise.all([arc.a(), arc.b()]).then((([aNode, bNode]) => {
          if (!aNode || !bNode) return
          graph.addEdge(aNode.id, bNode.id, { label: Math.ceil(arc.cost * 1000000000.0), labelColor: "black", size: 0.2, color: "darkgray" })
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
    const sigma = new Sigma(graph, entry.current, {renderEdgeLabels: true})
    sigmaRef.current = sigma

    return () => {
      sigma.kill()
    }
  }, [entry])

  return (
    <div ref={entry} className="w-full h-full"></div>
  )
}
