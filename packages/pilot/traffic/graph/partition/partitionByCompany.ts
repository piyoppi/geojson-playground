import { PartitionedRepository } from "../../../graph/arc/partitionedRepositoryArc.js"
import { BusRoute } from "../../busroute.js"
import { RailroadRoute } from "../../railroad.js"
import { companyIdToString } from "../../transportation.js"
import { filterJunctionNodes, isBusStopNode, isJunctionNode, isRailroadStationNode, TrafficNode, TrafficNodeItem } from "../trafficGraph.js"
import { partition } from "./partition.js"

export const partitionByCompany = async (
  repository: PartitionedRepository<TrafficNodeItem>,
  trafficNodes: TrafficNode[],
  railroads: RailroadRoute[],
  busRoutes: BusRoute[],
) => {
  const companyIdByRailroadStationId = new Map(railroads.flatMap(r => r.stations.map(s => [s.id, r.companyId])))
  const companyIdByBusStopId = new Map(busRoutes.flatMap(r => r.stations.map(b => [b.id, r.companyId])))
  const companyIdByJunctionId = new Map(filterJunctionNodes(trafficNodes).map(n => [n.item.junctionId, n.item.companyId]))

  await partition(
    repository,
    trafficNodes,
    node => {
      if (isRailroadStationNode(node)) {
        const companyId = companyIdByRailroadStationId.get(node.item.stationId)
        if (!companyId) throw new Error('CompanyId is not found in RailroadStationNode.')
        return companyIdToString(companyId)
      } else if (isBusStopNode(node)) {
        const companyIds = node.item.busStopIds.map(id => companyIdByBusStopId.get(id))
        const companyId = companyIds[0]
        // Expected: All companyIds is same
        const isValid = companyId && companyIds.every(c => c === companyIds[0])
        if (!isValid) {
          throw new Error(`CompanyId is not found in BusStopNode. companyIds: ${companyIds.join(',')} | busStopIds: ${node.item.busStopIds}`)
        }
        return companyIdToString(companyId)
      } else if (isJunctionNode(node)) {
        const companyId = companyIdByJunctionId.get(node.item.junctionId)
        if (!companyId) throw new Error('CompanyId is not found in JunctionNode.')
        return companyIdToString(companyId)
      }

      throw new Error('CompanyId is not found.')
    }
  )
}
