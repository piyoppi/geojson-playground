import { describe, it, type TestContext } from 'node:test'
import { serialize } from './serialize'
import { createJunctionNodeItem, createStationNodeItem, TrafficNodeItem } from './trafficGraph'
import { CompanyId, Junction, JunctionId, RouteId, Station, StationId } from '../transportation'
import { buildWeakRefArc } from '../../graph/arc/weakRefArc'
import { buildConnector, createNode } from '../../graph/graph'

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
