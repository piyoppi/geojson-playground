import { describe, it, type TestContext } from 'node:test'
import { buildBusStopGraphGenerator } from './busStopGraphGenerator.js'
import { buildWeakRefArc } from '../../../graph/arc/weakRefArc.js'
import { filterBusStopNodes } from '../trafficGraph.js'
import { toId } from '../../../utils/Id.js'
import { RouteId, StationId, CompanyId } from '../../transportation.js'
import type { BusRoute, BusStop } from '../../busroute.js'
import type { Position2D } from '../../../geometry/index.js'
import { arcExists, findConnectingArc } from '../../../graph/graph.js'

const createDefaultBusStopGraphGenerator = () => {
  const arcGenerator = buildWeakRefArc

  return buildBusStopGraphGenerator(arcGenerator)
}


const createTestBusStop = async (name: string, routeId: RouteId, position: Position2D, groupId?: string): Promise<BusStop> => ({
  id: StationId(await toId(`bus-stop-${name}`)),
  name: `Bus Stop ${name}`,
  routeId,
  position,
  groupId: groupId ? await toId(groupId) : await toId(`group-${name}`)
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
    const busStopNodes = filterBusStopNodes(result)

    // Filter nodes by route - check if node contains bus stop IDs from specific routes
    const route1Nodes = busStopNodes.filter(node =>
      node.item.busStopIds.some(stopId => stopId === busStopA.id || stopId === busStopB.id)
    )
    const route2Nodes = busStopNodes.filter(node =>
      node.item.busStopIds.some(stopId => stopId === busStopC.id || stopId === busStopD.id)
    )

    t.assert.ok(route1Nodes.length > 0, 'Route 1 should have nodes')
    t.assert.ok(route2Nodes.length > 0, 'Route 2 should have nodes')
    t.assert.equal(route1Nodes.length, 2, 'Route 1 should have 2 nodes')
    t.assert.equal(route2Nodes.length, 2, 'Route 2 should have 2 nodes')

    t.assert.equal(busStopNodes.length, 4, 'Should have 4 bus stop nodes total')

    // Verify that all expected bus stop IDs are present in the nodes
    const allBusStopIds = busStopNodes.flatMap(n => n.item.busStopIds).sort()
    const expectedIds = [busStopA.id, busStopB.id, busStopC.id, busStopD.id].sort() // Bus Stop A, B, C, D
    t.assert.deepEqual(allBusStopIds, expectedIds, 'Should contain all expected bus stop IDs')

    // Check connections between nodes
    if (route1Nodes.length >= 2) {
      const nodeA = route1Nodes[0]
      const nodeB = route1Nodes[1]
      if (nodeA.arcs && nodeA.arcs.length > 0) {
        const connectingArc = await findConnectingArc(nodeA, nodeB)
        if (connectingArc) {
          const expectedCostForRoute1 = Math.sqrt(Math.pow(10 - 0, 2) + Math.pow(0 - 0, 2))
          t.assert.equal(connectingArc.cost, expectedCostForRoute1, `Arc cost should be ${expectedCostForRoute1} for route 1`)
        }
      }
    }
  })

  it('should merge bus stops with the same groupId into a single node', async (t: TestContext) => {
    /*
     * Input: Bus Stops
     * ================
     * Route 1: [Central Station (groupId: shared)] --> [North Station]
     *              position: [0,0]                      position: [1,0]
     *
     * Route 2: [Central Station (groupId: shared)] --> [South Station]
     *              position: [0,0]                      position: [-1,0]
     *
     * Output: Graph Nodes & Connections
     * ===================================
     * Route 1:
     *   Node1 (Central Station) -----> Node2 (North Station)
     *          ↑                         ↑
     *          └── Contains: [busStop1Route1, busStop1Route2]
     *              (Shared instance between routes)
     *                                   Arc cost: √((1-0)² + (0-0)²) = 1
     *
     * Route 2:
     *   Node1 (Central Station) -----> Node3 (South Station)
     *          ↑                         ↑
     *          └── Same instance as Route 1's Node1
     *                                   Arc cost: √((-1-0)² + (0-0)²) = 1
     *
     * NOT connected: Node2 (North) ↔ Node3 (South)
     */
    const arcGenerator = buildWeakRefArc
    const generator = buildBusStopGraphGenerator(arcGenerator)

    const sharedGroupId = await toId('shared-bus-stop-1')
    const companyId1 = CompanyId(await toId('bus-company-1'))
    const companyId2 = CompanyId(await toId('bus-company-2'))

    const busStop1Route1: BusStop = {
      id: StationId(await toId('stop-1-route-1')),
      routeId: RouteId(await toId('route-1')),
      name: 'Central Station',
      position: [0, 0] as Position2D,
      groupId: sharedGroupId
    }

    const busStop1Route2: BusStop = {
      id: StationId(await toId('stop-1-route-2')),
      routeId: RouteId(await toId('route-2')),
      name: 'Central Station',
      position: [0, 0] as Position2D,
      groupId: sharedGroupId
    }

    const busStop2Route1: BusStop = {
      id: StationId(await toId('stop-2-route-1')),
      routeId: RouteId(await toId('route-1')),
      name: 'North Station',
      position: [1, 0] as Position2D,
      groupId: await toId('north-station')
    }

    const busStop3Route2: BusStop = {
      id: StationId(await toId('stop-3-route-2')),
      routeId: RouteId(await toId('route-2')),
      name: 'South Station',
      position: [-1, 0] as Position2D,
      groupId: await toId('south-station')
    }

    const routes: BusRoute[] = [
      {
        id: RouteId(await toId('route-1')),
        name: 'Route 1',
        companyId: companyId1,
        kind: 'bus',
        stations: [busStop1Route1, busStop2Route1]
      },
      {
        id: RouteId(await toId('route-2')),
        name: 'Route 2',
        companyId: companyId2,
        kind: 'bus',
        stations: [busStop1Route2, busStop3Route2]
      }
    ]

    const result = await generator(routes)
    const busStopNodes = filterBusStopNodes(result)

    // Filter nodes by route - check if node contains bus stop IDs from specific routes
    const route1Nodes = busStopNodes.filter(node =>
      node.item.busStopIds.some(stopId => stopId === busStop1Route1.id || stopId === busStop2Route1.id)
    )
    const route2Nodes = busStopNodes.filter(node =>
      node.item.busStopIds.some(stopId => stopId === busStop1Route2.id || stopId === busStop3Route2.id)
    )

    t.assert.equal(route1Nodes.length, 2, 'Route 1 should have 2 nodes')
    t.assert.equal(route2Nodes.length, 2, 'Route 2 should have 2 nodes')

    // Find central station nodes (should be shared between routes due to same groupId)
    const centralNode1 = route1Nodes.find(n => n.item.busStopIds.includes(busStop1Route1.id)) // Central Station from Route 1
    const centralNode2 = route2Nodes.find(n => n.item.busStopIds.includes(busStop1Route2.id)) // Central Station from Route 2
    t.assert.ok(centralNode1, 'Central Station node should exist in route 1')
    t.assert.ok(centralNode2, 'Central Station node should exist in route 2')
    t.assert.equal(centralNode1, centralNode2, 'Central Station should be the same node instance in both routes')
    t.assert.equal(centralNode1.item.busStopIds.length, 2, 'Shared node should contain 2 bus stop IDs')

    const busStopIds = centralNode1.item.busStopIds.sort()
    t.assert.deepEqual(
      busStopIds,
      [busStop1Route1.id, busStop1Route2.id].sort(), // Central Station from both routes
      'Shared node should contain bus stop IDs from both routes'
    )

    const northNode = route1Nodes.find(n => n.item.busStopIds.includes(busStop2Route1.id)) // North Station from Route 1
    t.assert.ok(northNode, 'North Station node should exist in route 1')

    const centralToNorthArc = await findConnectingArc(centralNode1, northNode)
    t.assert.ok(centralToNorthArc, 'Central Station should be connected to North Station in Route 1')
    t.assert.equal(centralToNorthArc.cost, Math.sqrt(Math.pow(1 - 0, 2) + Math.pow(0 - 0, 2)), 'Arc cost should match distance')

    const southNode = route2Nodes.find(n => n.item.busStopIds.includes(busStop3Route2.id)) // South Station from Route 2
    t.assert.ok(southNode, 'South Station node should exist in route 2')

    const centralToSouthArc = await findConnectingArc(centralNode2, southNode)
    t.assert.ok(centralToSouthArc, 'Central Station should be connected to South Station in Route 2')
    t.assert.equal(centralToSouthArc.cost, Math.sqrt(Math.pow(-1 - 0, 2) + Math.pow(0 - 0, 2)), 'Arc cost should match distance')

    const northToSouthConnected = await arcExists(northNode, southNode)
    t.assert.equal(northToSouthConnected, false, 'North Station and South Station should not be directly connected')
  })


  it('should handle multiple bus stops sharing the same groupId across multiple routes', async (t: TestContext) => {
    /*
     * Input: Bus Stops across 3 routes
     * =================================
     * Route 1: [Major Terminal (groupId: shared)] --> [Route 1 Stop]
     *              position: [0,0]                     position: [1,0]
     *
     * Route 2: [Major Terminal (groupId: shared)] --> [Route 2 Stop]
     *              position: [0,0]                     position: [2,0]
     *
     * Route 3: [Major Terminal (groupId: shared)] --> [Route 3 Stop]
     *              position: [0,0]                     position: [3,0]
     *
     * Output: Graph Nodes
     * ===================
     *                    ┌─────────────────────┐
     *                    │   Major Terminal    │
     *                    │ (Single shared node)│
     *                    │                     │
     *                    │ Contains bus stops: │
     *                    │ - terminal-route-1  │
     *                    │ - terminal-route-2  │
     *                    │ - terminal-route-3  │
     *                    └──────────┬──────────┘
     *                               │
     *              ┌────────────────┼────────────────┐
     *              │                │                │
     *              ▼                ▼                ▼
     *        [Route 1 Stop]   [Route 2 Stop]   [Route 3 Stop]
     *         position:[1,0]   position:[2,0]   position:[3,0]
     *
     * All three routes share the same Major Terminal node instance
     */
    const arcGenerator = buildWeakRefArc
    const generator = buildBusStopGraphGenerator(arcGenerator)

    const sharedGroupId = await toId('major-terminal')
    const companyId = CompanyId(await toId('bus-company'))

    const stops: BusStop[] = []
    const routes: BusRoute[] = []

    for (let routeNum = 1; routeNum <= 3; routeNum++) {
      const routeId = RouteId(await toId(`route-${routeNum}`))
      const routeStops: BusStop[] = []

      routeStops.push({
        id: StationId(await toId(`terminal-route-${routeNum}`)),
        routeId,
        name: 'Major Terminal',
        position: [0, 0] as Position2D,
        groupId: sharedGroupId
      })

      routeStops.push({
        id: StationId(await toId(`unique-stop-route-${routeNum}`)),
        routeId,
        name: `Route ${routeNum} Stop`,
        position: [routeNum, 0] as Position2D,
        groupId: await toId(`unique-${routeNum}`)
      })

      routes.push({
        id: routeId,
        name: `Route ${routeNum}`,
        companyId,
        kind: 'bus',
        stations: routeStops
      })

      stops.push(...routeStops)
    }

    const result = await generator(routes)
    const busStopNodes = filterBusStopNodes(result)

    // Check that each route has nodes containing its bus stop IDs
    for (const route of routes) {
      const routeStopIds = route.stations.map(s => s.id)
      const nodes = busStopNodes.filter(node =>
        node.item.busStopIds.some(stopId => routeStopIds.includes(stopId))
      )
      t.assert.ok(nodes.length > 0, `${route.name} should have nodes`)
      t.assert.equal(nodes.length, 2, `${route.name} should have 2 nodes`)
    }

    // Find terminal nodes for each route (should be the same shared node)
    const terminalNodes = routes.map(route => {
      const terminalStopId = route.stations.find(s => s.name === 'Major Terminal')?.id
      return busStopNodes.find(n =>
        n.item.busStopIds.includes(terminalStopId!) // Major Terminal stop from this route
      )
    })

    t.assert.ok(terminalNodes[0], 'Terminal node should exist')
    t.assert.equal(terminalNodes[0], terminalNodes[1], 'Routes 1 and 2 should share terminal node')
    t.assert.equal(terminalNodes[1], terminalNodes[2], 'Routes 2 and 3 should share terminal node')

    t.assert.equal(
      terminalNodes[0]!.item.busStopIds.length,
      3,
      'Shared terminal node should contain 3 bus stop IDs (one from each route)'
    )

    // Verify all terminal stop IDs are included
    const expectedTerminalIds = routes.map(r => r.stations.find(s => s.name === 'Major Terminal')!.id).sort()
    const actualTerminalIds = terminalNodes[0]!.item.busStopIds.sort()
    t.assert.deepEqual(actualTerminalIds, expectedTerminalIds, 'Should contain terminal stop IDs from all 3 routes')
  })
})
