import { useEffect, useRef, useMemo, useState } from 'react'
import Sigma from "sigma"
import Graph from "graphology"
import { isBusStopNode, isJunctionNode, isRailroadStationNode, type TrafficNode } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph'
import type { RouteId, Station } from '@piyoppi/sansaku-pilot/traffic/transportation'
import type { BusStop, BusRoute } from '@piyoppi/sansaku-pilot/traffic/busroute'
import type { RailroadRoute } from '@piyoppi/sansaku-pilot/traffic/railroad'
import { createRouteNameResolver } from '~/utils/routeNameResolver'

type PropTypes = {
  nodeSet: TrafficNode[][],
  stations: Station[],
  busStops: BusStop[],
  railroads: RailroadRoute[],
  busRoutes: BusRoute[],
  activeRouteId?: RouteId,
  nodeSize?: number,
}

export function MapViewer({ nodeSet, stations, busStops, railroads, busRoutes, activeRouteId, nodeSize = 0.45 }: PropTypes) {
  const entry = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)

  const [renderedNodeSet, setRenderedNodeSet] = useState<TrafficNode[][]>([])
  const graph = useMemo(() => new Graph({ multi: true }), [])

  const stationMap = useMemo(() => new Map(stations.map(s => [s.id, s])), [stations])
  const busStopMap = useMemo(() => new Map(busStops.map(s => [s.id, s])), [busStops])
  const routeMap = useMemo(() => {
    const map = new Map<string, string>()
    railroads.forEach(r => map.set(r.id, r.name))
    busRoutes.forEach(r => map.set(r.id, r.name))
    return map
  }, [railroads, busRoutes])
  const getRouteNameFromNode = useMemo(() =>
    createRouteNameResolver(routeMap, stationMap),
    [routeMap, stationMap]
  )

  useEffect(() => {
    const nodes = nodeSet.filter(rendered => !renderedNodeSet.some(nodes => rendered === nodes)).flat()

    nodes.forEach(node => {
      if (isRailroadStationNode(node)) {
        const station = stationMap.get(node.item.stationId)
        if (station) {
          graph.addNode(
            node.id,
            {
              label: `${station.name}(${station.routeId})`,
              routeId: station.routeId,
              size: nodeSize,
              x: station.position[0],
              y: station.position[1],
              color: "blue"
            }
          )
        }
      } else if (isBusStopNode(node)) {
        const busStop = busStopMap.get(node.item.busStopIds[0])
        if (busStop) {
          graph.addNode(
            node.id,
            {
              label: `${busStop.name}(${busStop.routeId})`,
              routeId: busStop.routeId,
              size: nodeSize,
              x: busStop.position[0],
              y: busStop.position[1],
              color: "yellow"
            }
          )
        }
      } else if (isJunctionNode(node)) {
        graph.addNode(
          node.id,
          {
            label: `Junction(${node.id})`,
            routeId: node.item.routeId,
            size: 0.45,
            x: node.item.position[0],
            y: node.item.position[1],
            color: "green"
          }
        )
      }
    })

    for (const node of nodes) {
      for (const arc of node.arcs) {
        Promise.all([arc.a(), arc.b()]).then((([aNode, bNode]) => {
          if (!aNode || !bNode) return

          const routeName = getRouteNameFromNode(aNode)

          try {
            graph.addEdge(aNode.id, bNode.id, {
              label: routeName,
              labelColor: "black",
              size: 0.2,
              color: "darkgray"
            })
          } catch(e) {
            console.log("err", aNode, bNode)
          }
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
          size: nodeSize * 2,
        }
      }

      return {
        ...data,
        size: nodeSize,
      }
    })
  }, [activeRouteId, nodeSize])

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
