import { fromPathChain, MappingOption } from "./graph/fromPathChain"
import { mergeDuplicateNodes, type GraphNode } from "./graph/graph"
import { ends, buildPathchain } from './pathchain'
import { BusStop } from "./busstop"
import { BusRoute } from "./busroute"
import { warn } from "console"

export type BusStopNode = BusStop & GraphNode

type ToBusStopGraphOptions = MappingOption

export const toBusStopGraph = async (
  busRoutes: BusRoute[],
  busStops: BusStop[],
  options?: ToBusStopGraphOptions
): Promise<BusStopNode[]> => {
  const busStopsByRoute = Map.groupBy(busStops, b => b.route)

  const busNodes = (
    await Promise.all(busRoutes.map(busRoute => buildPathchain(busRoute.routes)))
      .then(pathchainGroups => Promise.all(
        pathchainGroups.flat().flatMap(pathchains => {
          // TODO: ここで終点を取得しているが、終点が複数ある場合はどうするか？
          const end = ends(pathchains)[0]

          return busStopsByRoute.values().map(stops =>
            fromPathChain(
              stops,
              busStop => ({...busStop}),
              options
            )(pathchains, end.from())
          ).toArray()
        })
      ))
  ).flat()
 
  return mergeDuplicateNodes(busNodes)
}
