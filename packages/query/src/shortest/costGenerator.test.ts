import { describe, it, type TestContext } from 'node:test'
import { buildCostGenerator } from './costGenerator.js'
import { toId } from '@piyoppi/sansaku-pilot/utils/Id.js'
import { CompanyId, StationId, RouteId } from '@piyoppi/sansaku-pilot/traffic/transportation.js'
import { createStationNodeItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'
import type { Arc } from '@piyoppi/sansaku-pilot/graph/arc/index.js'
import type { TrafficNode, TrafficNodeItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'

describe('costGenerator', () => {
  it('should return 0 for same-group station transfers involving start node', async (t: TestContext) => {
    const companyId = CompanyId(await toId('test-company'))
    const routeId = RouteId(await toId('test-route'))
    
    const startStationItem = createStationNodeItem({
      id: StationId(await toId('start-station')),
      name: 'Start Station',
      routeId,
      position: [0, 0],
      groupId: 'group-a'
    }, companyId)
    
    const startNode: TrafficNode = {
      id: await toId('start-node'),
      item: startStationItem,
      arcs: []
    }
    
    const sameGroupStationItem = createStationNodeItem({
      id: StationId(await toId('same-group-station')),
      name: 'Same Group Station',
      routeId,
      position: [10, 10],
      groupId: 'group-a'
    }, companyId)
    
    const sameGroupNode: TrafficNode = {
      id: await toId('same-group-node'),
      item: sameGroupStationItem,
      arcs: []
    }
    
    const mockArc: Arc<TrafficNodeItem> = {
      cost: 100,
      a: () => Promise.resolve(startNode),
      b: () => Promise.resolve(sameGroupNode)
    }
    
    const generator = buildCostGenerator(() => undefined, startNode)
    const cost = generator(mockArc, startNode, sameGroupNode)
    
    t.assert.strictEqual(cost, 0, 'Cost should be 0 for same-group transfer involving start node')
  })

  it('should return 0 for same-group station transfers from other node to start node', async (t: TestContext) => {
    const companyId = CompanyId(await toId('test-company'))
    const routeId = RouteId(await toId('test-route'))
    
    const startStationItem = createStationNodeItem({
      id: StationId(await toId('start-station')),
      name: 'Start Station',
      routeId,
      position: [0, 0],
      groupId: 'group-b'
    }, companyId)
    
    const startNode: TrafficNode = {
      id: await toId('start-node'),
      item: startStationItem,
      arcs: []
    }
    
    const sameGroupStationItem = createStationNodeItem({
      id: StationId(await toId('same-group-station')),
      name: 'Same Group Station',
      routeId,
      position: [10, 10],
      groupId: 'group-b'
    }, companyId)
    
    const sameGroupNode: TrafficNode = {
      id: await toId('same-group-node'),
      item: sameGroupStationItem,
      arcs: []
    }
    
    const mockArc: Arc<TrafficNodeItem> = {
      cost: 200,
      a: () => Promise.resolve(sameGroupNode),
      b: () => Promise.resolve(startNode)
    }
    
    const generator = buildCostGenerator(() => undefined, startNode)
    const cost = generator(mockArc, sameGroupNode, startNode)
    
    t.assert.strictEqual(cost, 0, 'Cost should be 0 for same-group transfer to start node')
  })

  it('should return arc cost for same-group stations not involving start node', async (t: TestContext) => {
    const companyId = CompanyId(await toId('test-company'))
    const routeId = RouteId(await toId('test-route'))
    
    const startStationItem = createStationNodeItem({
      id: StationId(await toId('start-station')),
      name: 'Start Station',
      routeId,
      position: [0, 0],
      groupId: 'group-start'
    }, companyId)
    
    const startNode: TrafficNode = {
      id: await toId('start-node'),
      item: startStationItem,
      arcs: []
    }
    
    const station1Item = createStationNodeItem({
      id: StationId(await toId('station-1')),
      name: 'Station 1',
      routeId,
      position: [10, 10],
      groupId: 'group-other'
    }, companyId)
    
    const station1Node: TrafficNode = {
      id: await toId('station-1-node'),
      item: station1Item,
      arcs: []
    }
    
    const station2Item = createStationNodeItem({
      id: StationId(await toId('station-2')),
      name: 'Station 2',
      routeId,
      position: [20, 20],
      groupId: 'group-other'
    }, companyId)
    
    const station2Node: TrafficNode = {
      id: await toId('station-2-node'),
      item: station2Item,
      arcs: []
    }
    
    const expectedCost = 150
    const mockArc: Arc<TrafficNodeItem> = {
      cost: expectedCost,
      a: () => Promise.resolve(station1Node),
      b: () => Promise.resolve(station2Node)
    }
    
    const generator = buildCostGenerator(() => undefined, startNode)
    const cost = generator(mockArc, station1Node, station2Node)
    
    t.assert.strictEqual(cost, expectedCost, 'Cost should be arc cost for same-group stations not involving start node')
  })

  it('should return arc cost for different-group stations', async (t: TestContext) => {
    const companyId = CompanyId(await toId('test-company'))
    const routeId = RouteId(await toId('test-route'))
    
    const startStationItem = createStationNodeItem({
      id: StationId(await toId('start-station')),
      name: 'Start Station',
      routeId,
      position: [0, 0],
      groupId: 'group-start'
    }, companyId)
    
    const startNode: TrafficNode = {
      id: await toId('start-node'),
      item: startStationItem,
      arcs: []
    }
    
    const differentGroupStationItem = createStationNodeItem({
      id: StationId(await toId('different-group-station')),
      name: 'Different Group Station',
      routeId,
      position: [10, 10],
      groupId: 'group-different'
    }, companyId)
    
    const differentGroupNode: TrafficNode = {
      id: await toId('different-group-node'),
      item: differentGroupStationItem,
      arcs: []
    }
    
    const expectedCost = 300
    const mockArc: Arc<TrafficNodeItem> = {
      cost: expectedCost,
      a: () => Promise.resolve(startNode),
      b: () => Promise.resolve(differentGroupNode)
    }
    
    const generator = buildCostGenerator(() => undefined, startNode)
    const cost = generator(mockArc, startNode, differentGroupNode)
    
    t.assert.strictEqual(cost, expectedCost, 'Cost should be arc cost for different-group stations')
  })

  it('should return arc cost for stations without groupId', async (t: TestContext) => {
    const companyId = CompanyId(await toId('test-company'))
    const routeId = RouteId(await toId('test-route'))
    
    const startStationItem = createStationNodeItem({
      id: StationId(await toId('start-station')),
      name: 'Start Station',
      routeId,
      position: [0, 0],
      groupId: 'group-start'
    }, companyId)
    
    const startNode: TrafficNode = {
      id: await toId('start-node'),
      item: startStationItem,
      arcs: []
    }
    
    const noGroupStationItem = createStationNodeItem({
      id: StationId(await toId('no-group-station')),
      name: 'No Group Station',
      routeId,
      position: [10, 10]
    }, companyId)
    
    const noGroupNode: TrafficNode = {
      id: await toId('no-group-node'),
      item: noGroupStationItem,
      arcs: []
    }
    
    const expectedCost = 400
    const mockArc: Arc<TrafficNodeItem> = {
      cost: expectedCost,
      a: () => Promise.resolve(startNode),
      b: () => Promise.resolve(noGroupNode)
    }
    
    const generator = buildCostGenerator(() => undefined, startNode)
    const cost = generator(mockArc, startNode, noGroupNode)
    
    t.assert.strictEqual(cost, expectedCost, 'Cost should be arc cost for stations without groupId')
  })
})
