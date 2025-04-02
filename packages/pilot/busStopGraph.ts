import { fromPathChain } from "./graph/fromPathChain"
import { mergeDuplicateNodes, type GraphNode } from "./graph/graph"
import { ends, buildPathchain } from './pathchain'
import { BusStop } from "./busstop"
import { BusRoute } from "./busroute"

export type BusStopNode = BusStop & GraphNode

export const toBusStopGraph = (busRoutes: BusRoute[], busStops: BusStop[]): BusStopNode[] => {
  const busStopsByRoute = Map.groupBy(busStops, b => b.route)
  console.log(busStopsByRoute)
  const busNodes = busRoutes.flatMap(busRoute => {
    const pathchainGroups = buildPathchain(busRoute.routes)

    return pathchainGroups.flatMap((pathchains) => {
      // TODO: ここで終点を取得しているが、終点が複数ある場合はどうするか？
      const end = ends(pathchains)[0]

      return busStopsByRoute.values().flatMap(stops =>
        fromPathChain(
          stops,
          busStop => ({...busStop})
        )(pathchains, end.from())
      ).toArray()
    })
  })
 
  return mergeDuplicateNodes(busNodes)
}
