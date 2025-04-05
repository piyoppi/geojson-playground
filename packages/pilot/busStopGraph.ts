import { fromPathChain, MappingOption } from "./graph/fromPathChain"
import { type GraphNode } from "./graph/graph"
import { ends, buildPathchain } from './pathchain'
import { BusStop } from "./busstop"
import { BusRoute } from "./busroute"

export type BusStopNode = BusStop & GraphNode

type ToBusStopGraphOptions = MappingOption & {
  nodeCreated?: (busStop: BusStop) => Promise<void>
}

export const toBusStopGraph = async (
  busRoutes: BusRoute[],
  busStops: BusStop[],
  options?: ToBusStopGraphOptions
): Promise<Map<string, BusStopNode[]>> => {
  return (
    await Promise.all(
      busRoutes.map(busRoute => buildPathchain(busRoute.routes))
    ).then(pathchainGroups => Promise.all(
      pathchainGroups.flat().flatMap(pathchains => {
        const end = ends(pathchains)[0]

        return fromPathChain(
          busStops,
          async busStop => {
            if (options?.nodeCreated) {
              await options.nodeCreated(busStop)
            }
            return [busStop.route, { ...busStop }]
          },
          options
        )(pathchains, end.from())
      })
    ))
  ).flat().reduce((acc, map) => {
    map.entries().forEach(([k, v]) => acc.set(k, v))
    return acc
  }, new Map<string, BusStopNode[]>())
}
