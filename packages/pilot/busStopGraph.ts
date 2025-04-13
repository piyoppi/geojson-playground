import { fromPathChain, MappingOption } from "./graph/fromPathChain"
import { type GraphNode } from "./graph/graph"
import { ends, buildPathchain } from './pathchain'
import { BusStop, findFarthestNeighboringBusStop } from "./busstop"
import { BusRoute } from "./busroute"
import { RouteName } from "./graph"

export type BusStopNode = BusStop & GraphNode

type ToBusStopGraphOptions = MappingOption & {
  nodeCreated?: (busStop: BusStop) => Promise<void>
}

export const toBusStopGraph = async (
  busRoutes: BusRoute[],
  busStops: BusStop[],
  options?: ToBusStopGraphOptions
): Promise<Map<RouteName, BusStopNode[]>> => {
  const busRoute = (await Promise.all(busRoutes.map(busRoute => buildPathchain(busRoute.routes)))).flat()

  return (await Promise.all(
    Map.groupBy(busStops, b => b.route)
      .values()
      .toArray()
      .flatMap(busStops => {
        if (busStops.length < 2) return []

        const farthestBusStop = findFarthestNeighboringBusStop(busStops)

        return busRoute.map(isolatedPathChain => {
          const end = ends(isolatedPathChain)[0]

          return fromPathChain(
            busStops,
            async busStop => {
              if (options?.nodeCreated) {
                await options.nodeCreated(busStop)
              }
              return { ...busStop }
            },
            busStop => busStop.route,
            {
              ...options,
              maxDistance: farthestBusStop.distance * 15
            }
          )(isolatedPathChain, end.from())
        })
      })
  )).flat().reduce((acc, map) => {
    map.entries().forEach(([k, v]) => acc.set(k, v))
    return acc
  }, new Map<RouteName, BusStopNode[]>())
}
