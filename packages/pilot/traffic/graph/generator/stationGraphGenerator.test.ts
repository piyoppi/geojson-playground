import { describe, it, type TestContext } from 'node:test'
import { buildStationGraphGenerator } from './stationGraphGenerator.js'
import { buildWeakRefArc } from '../../../graph/arc/weakRefArc.js'
import { buildDuplicateNodesMarger, buildNodeMerger, arcExists } from '../../../graph/graph.js'
import { filterStationNodes, filterJunctionNodes, type TrafficNodeItem } from '../trafficGraph.js'
import { toId } from '../../../utils/Id.js'
import { RouteId, StationId, CompanyId, type Station } from '../../transportation.js'
import type { Railroad } from '../../railroad.js'
import type { Path } from '../../../geometry/path/index.js'
import { Position2D } from '../../../geometry/index.js'

const createDefaultStationGraphGenerator = () => {
  const arcGenerator = buildWeakRefArc
  const transferCostGenerator = () => 1
  const nodeMerger = buildDuplicateNodesMarger<TrafficNodeItem>(buildNodeMerger(arcGenerator))
  
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

  it('should connect transit stations with same groupId but different routeId', async (t: TestContext) => {
    const sharedGroupId = 'transfer-station-shibuya'

    const companyId1 = CompanyId(await toId('test-company-a'))
    const routeId1 = RouteId(await toId('test-route-a'))
    const path1: Path = [[100, 200], [200, 200]]  // Line 1: horizontal
    const station1 = await createTestStation('Next1', routeId1, [200, 200])
    const transferStation1 = await createTestStation('Shibuya-Line1', routeId1, [100, 200], sharedGroupId)
    const railroad1 = await createTestRailroad('Line1', companyId1, [transferStation1, station1], [path1])

    const companyId2 = CompanyId(await toId('test-company-b'))
    const routeId2 = RouteId(await toId('test-route-b'))
    const path2: Path = [[100, 200], [100, 300]]  // Line 2: vertical
    const station2 = await createTestStation('Next2', routeId2, [100, 300])
    const transferStation2 = await createTestStation('Shibuya-Line2', routeId2, [100, 200], sharedGroupId)
    const railroad2 = await createTestRailroad('Line2', companyId2, [transferStation2, station2], [path2])

    const stationGraphGenerator = createDefaultStationGraphGenerator()

    const result = await stationGraphGenerator([railroad1, railroad2])
    const stationNodes = filterStationNodes(result)

    t.assert.equal(stationNodes.length, 4, 'Should have 4 station nodes')

    const resultTransferStation1 = stationNodes.find(n => n.item.station.name === 'Station Shibuya-Line1')
    const resultTransferStation2 = stationNodes.find(n => n.item.station.name === 'Station Shibuya-Line2')

    t.assert.ok(resultTransferStation1, 'Should have transfer station 1')
    t.assert.ok(resultTransferStation2, 'Should have transfer station 2')

    t.assert.equal(resultTransferStation1!.item.station.groupId, sharedGroupId, 'Transfer station 1 should have shared group ID')
    t.assert.equal(resultTransferStation2!.item.station.groupId, sharedGroupId, 'Transfer station 2 should have shared group ID')

    t.assert.notEqual(resultTransferStation1!.item.station.routeId, resultTransferStation2!.item.station.routeId, 'Transfer stations should have different route IDs')

    const hasTransferConnection = await arcExists(resultTransferStation1!, resultTransferStation2!)
    t.assert.ok(hasTransferConnection, 'Should have transfer arc between stations with same groupId but different routeId')
  })

  it('should not connect stations with same groupId and same routeId', async (t: TestContext) => {
    const companyId = CompanyId(await toId('test-company-4'))
    const routeId = RouteId(await toId('test-route-4'))
    const sharedGroupId = 'same-route-group'
    const stationA = await createTestStation('SameRoute1', routeId, [0, 0], sharedGroupId)
    const stationB = await createTestStation('SameRoute2', routeId, [1, 0], sharedGroupId)

    const path: Path = [[0, 0], [1, 0]]
    const railroad = await createTestRailroad('4', companyId, [stationA, stationB], [path])

    const stationGraphGenerator = createDefaultStationGraphGenerator()

    const result = await stationGraphGenerator([railroad])
    const stationNodes = filterStationNodes(result)

    t.assert.equal(stationNodes.length, 2, 'Should have 2 station nodes')

    const station1 = stationNodes.find(n => n.item.station.name === 'Station SameRoute1')
    const station2 = stationNodes.find(n => n.item.station.name === 'Station SameRoute2')

    t.assert.ok(station1, 'Should have station 1')
    t.assert.ok(station2, 'Should have station 2')

    t.assert.equal(station1!.item.station.groupId, sharedGroupId, 'Both stations should have the same group ID')
    t.assert.equal(station2!.item.station.groupId, sharedGroupId, 'Both stations should have the same group ID')
    t.assert.equal(station1!.item.station.routeId, station2!.item.station.routeId, 'Both stations should have the same route ID')

    // Use arcExists function for cleaner connection verification
    const hasTransferConnection = await arcExists(station1!, station2!)
    t.assert.equal(hasTransferConnection, false, 'Should not have transfer connection (same routeId)')
  })
})
