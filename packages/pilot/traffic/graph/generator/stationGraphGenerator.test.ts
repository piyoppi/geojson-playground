import { describe, it, type TestContext } from 'node:test'
import { buildStationGraphGenerator } from './stationGraphGenerator.js'
import { buildWeakRefArc } from '../../../graph/arc/weakRefArc.js'
import { buildDuplicateNodesMarger, buildNodeMerger } from '../../../graph/graph.js'
import { filterStationNodes, filterJunctionNodes } from '../trafficGraph.js'
import { toId } from '../../../utils/Id.js'
import { RouteId, StationId, CompanyId, type Station } from '../../transportation.js'
import type { Railroad } from '../../railroad.js'
import type { Path } from '../../../geometry/path/index.js'
import { Position2D } from '../../../geometry/index.js'

const createDefaultStationGraphGenerator = () => {
  const arcGenerator = buildWeakRefArc
  const transferCostGenerator = () => 1
  const nodeMerger = buildDuplicateNodesMarger(buildNodeMerger(arcGenerator))
  
  return buildStationGraphGenerator(
    arcGenerator,
    transferCostGenerator,
    nodeMerger
  )
}

const createTestStation = async (name: string, routeId: RouteId, position: Position2D, groupId?: string): Promise<Station> => ({
  id: StationId(await toId(`station-${name}`)),
  name: `Station ${name}`,
  routeId,
  position,
  groupId: groupId || `group-${name}`
})

const createTestRailroad = async (name: string, companyId: CompanyId, stations: Station[], rails: Path[]): Promise<Railroad> => {
  const routeId = RouteId(await toId(`route-${name}`))
  return {
    id: routeId,
    name: `Test Railroad ${name}`,
    companyId,
    kind: 'railroad' as const,
    stations,
    rails
  }
}

describe('buildStationGraphGenerator', () => {
  it('should generate graph with 4 stations connected through paths', async (t: TestContext) => {
    // Test scenario:
    // Station A connects to Station B
    // Station B connects to Station C, D (via Junction)
    
    const companyId = CompanyId(await toId('test-company'))
    const routeId = RouteId(await toId('test-route'))
    
    // Create stations
    const stationA = await createTestStation('A', routeId, [0, 0])
    const stationB = await createTestStation('B', routeId, [1, 0])
    const stationC = await createTestStation('C', routeId, [2, 0])
    const stationD = await createTestStation('D', routeId, [2, 1])
    
    // Create T-shaped path network
    // Path from A to B to C (horizontal line)
    const pathABC: Path = [[0, 0], [1, 0], [2, 0], [3, 0]]
    // Path from B to D (vertical branch)
    const pathBD: Path = [[2, 0], [2, 1]]
    
    const railroad = await createTestRailroad('1', companyId, [stationA, stationB, stationC, stationD], [pathABC, pathBD])
    
    const stationGraphGenerator = createDefaultStationGraphGenerator()
    
    const result = await stationGraphGenerator([railroad])
    
    const stationNodes = filterStationNodes(result)
    const junctionNodes = filterJunctionNodes(result)
    
    t.assert.equal(stationNodes.length, 4, 'Should have 4 station nodes')
    
    const stationNodeIds = stationNodes.map(n => n.item.station.name).sort()
    t.assert.deepEqual(stationNodeIds, ['Station A', 'Station B', 'Station C', 'Station D'])
    
    t.assert.equal(junctionNodes.length, 1, 'Should have 1 junction node at path intersection')
    
    t.assert.equal(result.length, 5, 'Should have 5 total nodes (4 stations + 1 junction)')
    
    result.forEach(node => {
      t.assert.equal(node.item.companyId, companyId, 'All nodes should have the correct company ID')
    })
    
    stationNodes.forEach(node => {
      t.assert.equal(node.item.type, 'Station', 'Station nodes should have type Station')
    })
    
    junctionNodes.forEach(node => {
      t.assert.equal(node.item.type, 'Junction', 'Junction nodes should have type Junction')
    })
  })
  
  it('should verify station connections', async (t: TestContext) => {
    // Create simple linear railroad: A --- B
    const companyId = CompanyId(await toId('test-company-2'))
    const routeId = RouteId(await toId('test-route-2'))
    
    const stationA = await createTestStation('A2', routeId, [0, 0])
    const stationB = await createTestStation('B2', routeId, [1, 0])
    
    const path: Path = [[0, 0], [1, 0]]
    const railroad = await createTestRailroad('2', companyId, [stationA, stationB], [path])
    
    const stationGraphGenerator = createDefaultStationGraphGenerator()
    
    const result = await stationGraphGenerator([railroad])
    const stationNodes = filterStationNodes(result)
    const junctionNodes = filterJunctionNodes(result)
    
    t.assert.equal(stationNodes.length, 2, 'Should have 2 station nodes')
    
    const totalNodes = stationNodes.length + junctionNodes.length
    t.assert.equal(result.length, totalNodes, 'Total nodes should match station + junction count')
  })
})
