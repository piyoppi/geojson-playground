import { describe, it, type TestContext } from 'node:test'
import { partitionByCompany } from './partitionByCompany.js'
import { buildPartitionedRepository } from '../../../graph/arc/partitionedRepositoryArc.js'
import {
  createRailroadStationNode,
  createBusStopNode,
  createJunctionNode,
  type TrafficNode,
  type TrafficNodeItem
} from '../trafficGraph.js'
import {
  CompanyId,
  StationId,
  RouteId,
  JunctionId,
  companyIdToString,
  type Station,
  type Junction
} from '../../transportation.js'
import { toId } from '../../../utils/Id.js'
import type { RailroadRoute } from '../../railroad.js'
import type { BusRoute } from '../../busroute.js'

const buildTestRepository = async () => {
  const nodes = new Map<string, TrafficNode[]>()

  return buildPartitionedRepository<TrafficNodeItem>(
    (pk) => Promise.resolve(nodes.get(pk) ?? []),
    (pk, partitionedNodes) => {
      nodes.set(pk, partitionedNodes)
      return Promise.resolve()
    }
  )
}

const createMockStation = async (stationIdStr: string, routeIdStr: string): Promise<Station> => ({
  id: StationId(await toId(stationIdStr)),
  name: `Station ${stationIdStr}`,
  routeId: RouteId(await toId(routeIdStr)),
  position: [0, 0]
})

const createMockJunction = async (junctionIdStr: string): Promise<Junction> => ({
  id: JunctionId(await toId(junctionIdStr)),
  position: [0, 0]
})

const createMockRailroad = async (companyIdStr: string, stationIds: string[]): Promise<RailroadRoute> => {
  const stations = await Promise.all(stationIds.map(id => createMockStation(id, 'route1')))

  return {
    id: RouteId(await toId('route1')),
    name: 'Test Railroad',
    companyId: CompanyId(await toId(companyIdStr)),
    kind: 'railroad',
    stations,
    rails: []
  }
}

const createMockBusRoute = async (companyIdStr: string, stationIds: string[]): Promise<BusRoute> => {
  const stations = await Promise.all(stationIds.map(id => createMockStation(id, 'busroute1')))

  return {
    id: RouteId(await toId('busroute1')),
    name: 'Test Bus Route',
    companyId: CompanyId(await toId(companyIdStr)),
    kind: 'bus',
    stations
  }
}

describe('partitionByCompany', () => {
  it('should partition railroad station nodes by company', async (t: TestContext) => {
    const repository = await buildTestRepository()

    const railroad = await createMockRailroad('company1', ['station1', 'station2'])
    const node1 = createRailroadStationNode(railroad.stations[0])
    const node2 = createRailroadStationNode(railroad.stations[1])

    await partitionByCompany(repository, [node1, node2], [railroad], [], new Map())

    const company1Key = companyIdToString(railroad.companyId)
    t.assert.equal(await repository.get(node1.id, company1Key), node1)
    t.assert.equal(await repository.get(node2.id, company1Key), node2)
  })

  it('should partition bus stop nodes by company', async (t: TestContext) => {
    const repository = await buildTestRepository()

    const busRoute = await createMockBusRoute('company2', ['busstop1', 'busstop2'])

    const node1 = createBusStopNode([busRoute.stations[0]])
    const node2 = createBusStopNode([busRoute.stations[1]])

    await partitionByCompany(repository, [node1, node2], [], [busRoute], new Map())

    const company2Key = companyIdToString(busRoute.companyId)
    t.assert.equal(await repository.get(node1.id, company2Key), node1)
    t.assert.equal(await repository.get(node2.id, company2Key), node2)
  })

  it('should partition junction nodes by company', async (t: TestContext) => {
    const repository = await buildTestRepository()

    const companyId = CompanyId(await toId('company1'))
    const junction = await createMockJunction('junction1')
    const node1 = createJunctionNode(junction)
    const junctionMap = new Map([[companyId, junction]])

    await partitionByCompany(repository, [node1], [], [], junctionMap)

    const company1Key = companyIdToString(companyId)
    t.assert.equal(await repository.get(node1.id, company1Key), node1)
  })

  it('should partition nodes from multiple companies correctly', async (t: TestContext) => {
    const repository = await buildTestRepository()

    const railroad = await createMockRailroad('company1', ['station1'])
    const busRoute = await createMockBusRoute('company2', ['busstop1'])

    const railNode = createRailroadStationNode(railroad.stations[0])
    const busNode = createBusStopNode([busRoute.stations[0]])

    await partitionByCompany(repository, [railNode, busNode], [railroad], [busRoute], new Map())

    const company1Key = companyIdToString(railroad.companyId)
    const company2Key = companyIdToString(busRoute.companyId)
    t.assert.equal(await repository.get(railNode.id, company1Key), railNode)
    t.assert.equal(await repository.get(busNode.id, company2Key), busNode)
  })

  it('should throw error when company ID is not found for station', async (t: TestContext) => {
    const repository = await buildTestRepository()

    const orphanStation = await createMockStation('orphan_station', 'route1')
    const orphanNode = createRailroadStationNode(orphanStation)

    await t.assert.rejects(async () => {
      await partitionByCompany(repository, [orphanNode], [], [], new Map())
    }, { message: 'CompanyId is not found.' })
  })

  it('should throw error when company ID is not found for junction', async (t: TestContext) => {
    const repository = await buildTestRepository()

    const orphanJunction = await createMockJunction('orphan_junction')
    const orphanNode = createJunctionNode(orphanJunction)

    await t.assert.rejects(async () => {
      await partitionByCompany(repository, [orphanNode], [], [], new Map())
    }, { message: 'CompanyId is not found.' })
  })

  it('should handle bus stop nodes with multiple bus stop IDs from same company', async (t: TestContext) => {
    const repository = await buildTestRepository()

    const busRoute = await createMockBusRoute('company1', ['busstop1', 'busstop2'])
    const combinedNode = createBusStopNode([busRoute.stations[0], busRoute.stations[1]])

    await partitionByCompany(repository, [combinedNode], [], [busRoute], new Map())

    const company1Key = companyIdToString(busRoute.companyId)
    t.assert.equal(await repository.get(combinedNode.id, company1Key), combinedNode)
  })
})
