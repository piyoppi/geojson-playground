import { fromPathChain } from "./graph/fromPathChain"
import { type GraphNode } from "./graph/graph"
import { ends, buildPathchain } from './pathchain'
import { BusStop } from "./busstop"
import { BusRoute } from "./busroute"

export type BusStopNode = BusStop & GraphNode

export const toBusStopGraph = (busRoutes: BusRoute[], busStops: BusStop[]): BusStopNode[] => {
  const busNodes = busRoutes.flatMap(busRoute => {
    const pathchainGroups = buildPathchain(busRoute.routes)

    return pathchainGroups.flatMap((pathchains) => {
      const end = ends(pathchains)[0]

      return fromPathChain(
        busStops.map(s => ({...s})),
        busStop => ({...busStop})
      )(pathchains, end.from())
    })
  })

  return busNodes
}
