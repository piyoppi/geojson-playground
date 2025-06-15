import { describe, it, type TestContext } from 'node:test'
import { serialize, buildTrafficGraphDeserializer } from './serialize'
import { createJunctionNode, createJunctionNodeItem, createStationNode, createStationNodeItem, TrafficGraphNode, TrafficNodeItem } from './trafficGraph'
import { CompanyId, Junction, JunctionId, RouteId, Station, StationId, Route } from '../transportation'
import { buildWeakRefArc } from '../../graph/arc/weakRefArc'
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
    const nodeA = createNode('A', createStationNodeItem(stationA, companyId))
    const nodeB = createNode('B', createStationNodeItem(stationB, companyId))
    const nodeC = createNode('C', createStationNodeItem(stationC, companyId))
    const nodeABC = createNode('ABC', createJunctionNodeItem(junctionABC, companyId))
    connect(nodeA, nodeABC, 1)
    connect(nodeABC, nodeB, 1)
    connect(nodeABC, nodeC, 1)

    const serialized = await serialize([nodeA, nodeB, nodeC, nodeABC])

    t.assert.equal(serialized.arcs.length, 3)
    t.assert.ok(serialized.arcs.find(a => a.aNodeId === 'A' && a.bNodeId === 'ABC' && a.cost === 1))
    t.assert.ok(serialized.arcs.find(a => a.aNodeId === 'ABC' && a.bNodeId === 'B' && a.cost === 1))
    t.assert.ok(serialized.arcs.find(a => a.aNodeId === 'ABC' && a.bNodeId === 'C' && a.cost === 1))
    t.assert.equal(serialized.junctions.length, 1)
    t.assert.ok(serialized.junctions.find(j => j.id === 'ABC'))
  })
})

describe('buildTrafficGraphDeserializer', () => {
  it('Should deserialize traffic graph with stations and junctions', (t: TestContext) => {
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
    const nodeIdMap = new Map<NodeId, TrafficGraphNode>([
      [stationA.id, createStationNode(stationA, companyId)],
      [stationB.id, createStationNode(stationB, companyId)],
      [junctionAB.id, createJunctionNode(junctionAB, companyId)]
    ])
    const route: Route<Station> = {
      id: routeId,
      name: 'Test Route',
      companyId,
      kind: 'railroad',
      stations: [stationA, stationB]
    }
    
    const deserializer = buildTrafficGraphDeserializer(buildGraphDeserializer(resolver => {

    }))
    
    const serialized = {
      arcs: [
        { aNodeId: 'A', bNodeId: 'AB', arcCost: '1' },
        { aNodeId: 'AB', bNodeId: 'B', arcCost: '2' }
      ],
      junctions: [junctionAB]
    }
    
    const nodes = deserializer(serialized, [route])
    
    t.assert.equal(nodes.length, 3)
    
    const stationNodes = nodes.filter(n => n.item.type === 'Station')
    const junctionNodes = nodes.filter(n => n.item.type === 'Junction')
    
    t.assert.equal(stationNodes.length, 2)
    t.assert.equal(junctionNodes.length, 1)
    
    const nodeA = stationNodes.find(n => n.id === 'A')
    const nodeB = stationNodes.find(n => n.id === 'B')
    const nodeAB = junctionNodes.find(n => n.id === 'AB')
    
    t.assert.ok(nodeA)
    t.assert.ok(nodeB)
    t.assert.ok(nodeAB)
    
    t.assert.equal(nodeA!.item.station.name, 'Station A')
    t.assert.equal(nodeB!.item.station.name, 'Station B')
    t.assert.equal(nodeAB!.item.junction.id, 'AB')
  })
})
