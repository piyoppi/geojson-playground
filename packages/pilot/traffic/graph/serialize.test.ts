import { describe, it, type TestContext } from 'node:test'
import { serialize, buildTrafficGraphDeserializer } from './serialize'
import { createJunctionNode, createJunctionNodeItem, createRailroadStationNode, createStationNodeItem, filterJunctionNodes, filterStationNodes, TrafficNode, TrafficNodeItem } from './trafficGraph'
import { CompanyId, Junction, JunctionId, RouteId, Station, StationId, Route } from '../transportation'
import { buildWeakRefArc, buildWeakRefArcDeserializer } from '../../graph/arc/weakRefArc'
import { buildConnector, createNode, NodeId } from '../../graph/graph'
import { buildGraphDeserializer } from '../../graph/serialize'

describe('serialize', () => {
  it('Should serlialize traffic graph', async (t: TestContext) => {
    const companyId = CompanyId('companyA')
    const stationA: Station = {
      id: StationId('A'),
      name: 'Station A',
      routeId: RouteId('Route1'),
      position: [0, 0]
    }
    const stationB: Station = {
      id: StationId('B'),
      name: 'Station B',
      routeId: RouteId('Route1'),
      position: [2, 0]
    }
    const stationC: Station = {
      id: StationId('C'),
      name: 'Station C',
      routeId: RouteId('Route1'),
      position: [1, 1]
    }
    const junctionABC: Junction = {
      id: JunctionId('ABC'),
      position: [1, 0]
    }
    const connect = buildConnector<TrafficNodeItem>(buildWeakRefArc)
    const nodeA = createNode('A', createStationNodeItem(stationA))
    const nodeB = createNode('B', createStationNodeItem(stationB))
    const nodeC = createNode('C', createStationNodeItem(stationC))
    const nodeABC = createNode('ABC', createJunctionNodeItem(junctionABC))
    connect(nodeA, nodeABC, 1)
    connect(nodeABC, nodeB, 1)
    connect(nodeABC, nodeC, 1)

    const serialized = await serialize([nodeA, nodeB, nodeC, nodeABC])

    t.assert.equal(serialized.arcs.length, 3)
    t.assert.ok(serialized.arcs.find(a => a.aNodeId === 'A' && a.bNodeId === 'ABC' && a.cost === 1))
    t.assert.ok(serialized.arcs.find(a => a.aNodeId === 'ABC' && a.bNodeId === 'B' && a.cost === 1))
    t.assert.ok(serialized.arcs.find(a => a.aNodeId === 'ABC' && a.bNodeId === 'C' && a.cost === 1))
    t.assert.equal(serialized.nodes.length, 4)
    t.assert.ok(serialized.nodes.find(n => n.id === 'ABC' && n.item.t === 'J'))
  })
})

describe('buildTrafficGraphDeserializer', () => {
  it('Should deserialize traffic graph with stations and junctions', async (t: TestContext) => {
    const companyId = CompanyId('companyA')
    const routeId = RouteId('Route1')
    
    const stationA: Station = {
      id: StationId('A'),
      name: 'Station A',
      routeId,
      position: [0, 0]
    }
    const stationB: Station = {
      id: StationId('B'),
      name: 'Station B',
      routeId,
      position: [2, 0]
    }
    const junctionAB: Junction = {
      id: JunctionId('AB'),
      position: [1, 0]
    }
    const route: Route<Station> = {
      id: routeId,
      name: 'Test Route',
      companyId,
      kind: 'railroad',
      stations: [stationA, stationB]
    }
    
    const deserializer = buildTrafficGraphDeserializer(
      buildGraphDeserializer(
        ctx => buildWeakRefArcDeserializer(ctx.getResolvedNode)
      )
    )
    
    const serialized = {
      arcs: [
        { aNodeId: 'A', bNodeId: 'AB', arcCost: '1' },
        { aNodeId: 'AB', bNodeId: 'B', arcCost: '2' }
      ],
      nodes: [
        { id: 'A', item: { t: 'RS' as const, id: 'A' } },
        { id: 'B', item: { t: 'RS' as const, id: 'B' } },
        { id: 'AB', item: { t: 'J' as const, id: 'AB' } }
      ]
    }
    
    const nodes = await deserializer(serialized)
    
    t.assert.equal(nodes.length, 3)
    
    const stationNodes = filterStationNodes(nodes)
    const junctionNodes = filterJunctionNodes(nodes)
    
    t.assert.equal(stationNodes.length, 2)
    t.assert.equal(junctionNodes.length, 1)
    
    const nodeA = stationNodes.find(n => n.id === 'A')
    const nodeB = stationNodes.find(n => n.id === 'B')
    const nodeAB = junctionNodes.find(n => n.id === 'AB')
    
    t.assert.ok(nodeA)
    t.assert.ok(nodeB)
    t.assert.ok(nodeAB)
    
    t.assert.equal(nodeA!.item.stationId, 'A')
    t.assert.equal(nodeB!.item.stationId, 'B')
    t.assert.equal(nodeAB!.item.junctionId, 'AB')
  })
})
