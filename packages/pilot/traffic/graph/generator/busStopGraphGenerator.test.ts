import { describe, it, type TestContext } from 'node:test'
import { buildBusStopGraphGenerator } from './busStopGraphGenerator.js'
import { buildWeakRefArc } from '../../../graph/arc/weakRefArc.js'
import { filterStationNodes } from '../trafficGraph.js'
import { toId } from '../../../utils/Id.js'
import { RouteId, StationId, CompanyId } from '../../transportation.js'
import type { BusRoute, BusStop } from '../../busroute.js'
import { Position2D } from '../../../geometry/index.js'

const createDefaultBusStopGraphGenerator = () => {
  const arcGenerator = buildWeakRefArc
  
  return buildBusStopGraphGenerator(arcGenerator)
}

const findConnectingArc = async (nodeA: any, nodeB: any) => {
  const arcsWithNodes = await Promise.all(
    nodeA.arcs.map(async (arc: any) => {
      const arcNodeA = await arc.a()
      const arcNodeB = await arc.b()
      return {
        arc,
        connects: (arcNodeA?.id === nodeA.id && arcNodeB?.id === nodeB.id) || 
                  (arcNodeA?.id === nodeB.id && arcNodeB?.id === nodeA.id)
      }
    })
  )
  return arcsWithNodes.find(item => item.connects)?.arc
}

const createTestBusStop = async (name: string, routeId: RouteId, position: Position2D, groupId?: string): Promise<BusStop> => ({
  id: StationId(await toId(`bus-stop-${name}`)),
  name: `Bus Stop ${name}`,
  routeIds: [routeId],
  position,
  groupId: groupId || `group-${name}`
})

describe('buildBusStopGraphGenerator', () => {
  it('should generate graph with 4 bus stops across multiple routes', async (t: TestContext) => {
    // Test scenario:
    // Route 1: Bus Stop A -> Bus Stop B
    // Route 2: Bus Stop C -> Bus Stop D
    
    const companyId = CompanyId(await toId('test-bus-company'))
    
    const routeId1 = RouteId(await toId('route-1'))
    const routeId2 = RouteId(await toId('route-2'))
    
    const busStopA = await createTestBusStop('A', routeId1, [0, 0])
    const busStopB = await createTestBusStop('B', routeId1, [10, 0])
    const busStopC = await createTestBusStop('C', routeId2, [20, 0])
    const busStopD = await createTestBusStop('D', routeId2, [20, 10])
    
    const busRoute1: BusRoute = {
      id: routeId1,
      name: 'Test Bus Route 1',
      companyId,
      kind: 'bus' as const,
      stations: [busStopA, busStopB]
    }
    const busRoute2: BusRoute = {
      id: routeId2,
      name: 'Test Bus Route 2',
      companyId,
      kind: 'bus' as const,
      stations: [busStopC, busStopD]
    }
    
    const busStopGraphGenerator = createDefaultBusStopGraphGenerator()
    
    const result = await busStopGraphGenerator([busRoute1, busRoute2])
    t.assert.equal(result.size, 2, 'Should have 2 routes in the result')
    
    const route1Nodes = result.get(routeId1)
    const route2Nodes = result.get(routeId2)
    
    t.assert.ok(route1Nodes, 'Route 1 should exist in result')
    t.assert.ok(route2Nodes, 'Route 2 should exist in result')
    t.assert.equal(route1Nodes.length, 2, 'Route 1 should have 2 nodes')
    t.assert.equal(route2Nodes.length, 2, 'Route 2 should have 2 nodes')
    
    const allNodes = [...route1Nodes, ...route2Nodes]
    const stationNodes = filterStationNodes(allNodes)
    
    t.assert.equal(stationNodes.length, 4, 'Should have 4 station nodes total')
    
    const stationNodeNames = stationNodes.map(n => n.item.station.name).sort()
    t.assert.deepEqual(stationNodeNames, ['Bus Stop A', 'Bus Stop B', 'Bus Stop C', 'Bus Stop D'])
    
    const nodeA = route1Nodes[0]
    const nodeB = route1Nodes[1]
    t.assert.ok(nodeA.arcs.length > 0, 'Route 1 nodes should have arcs')
    
    const connectingArc = await findConnectingArc(nodeA, nodeB)
    t.assert.ok(connectingArc, 'Should have connecting arc between nodes')
    
    const expectedCostForRoute1 = Math.sqrt(Math.pow(10 - 0, 2) + Math.pow(0 - 0, 2))
    t.assert.equal(connectingArc.cost, expectedCostForRoute1, `Arc cost should be ${expectedCostForRoute1} for route 1`)

    const expectedCostForRoute2 = Math.sqrt(Math.pow(20 - 20, 2) + Math.pow(10 - 0, 2))
    t.assert.equal(connectingArc.cost, expectedCostForRoute2, `Arc cost should be ${expectedCostForRoute2} for route 1`)
  })
})
