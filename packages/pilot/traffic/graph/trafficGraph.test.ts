import { describe, it, type TestContext } from 'node:test'
import { 
  filterStationNodes, 
  filterJunctionNodes, 
  createStationNodeItem, 
  createJunctionNodeItem 
} from './trafficGraph.js'
import { CompanyId, StationId, RouteId, JunctionId } from '../transportation.js'
import { toId } from '../../utils/Id.js'
import type { GraphNode } from '../../graph/graph.js'

const createTestStationNode = async (nodeId: string, stationName: string, companyIdStr: string): Promise<GraphNode<any>> => {
  const companyId = CompanyId(await toId(companyIdStr))
  const stationId = StationId(await toId(`station-${stationName}`))
  const routeId = RouteId(await toId(`route-${stationName}`))
  
  const stationItem = createStationNodeItem({
    id: stationId,
    name: stationName,
    routeIds: [routeId],
    position: [0, 0]
  }, companyId)
  
  return {
    id: nodeId,
    item: stationItem,
    arcs: []
  }
}

const createTestJunctionNode = async (nodeId: string, junctionIdStr: string, companyIdStr: string): Promise<GraphNode<any>> => {
  const companyId = CompanyId(await toId(companyIdStr))
  const junctionId = JunctionId(await toId(junctionIdStr))
  
  const junctionItem = createJunctionNodeItem({
    id: junctionId,
    position: [0, 0]
  }, companyId)
  
  return {
    id: nodeId,
    item: junctionItem,
    arcs: []
  }
}

describe('filterStationNodes', () => {
  it('should filter and return only station nodes from mixed array', async (t: TestContext) => {
    const stationNode1 = await createTestStationNode('node1', 'Station A', 'company1')
    const stationNode2 = await createTestStationNode('node2', 'Station B', 'company2')
    const junctionNode1 = await createTestJunctionNode('node3', 'junction1', 'company1')
    const junctionNode2 = await createTestJunctionNode('node4', 'junction2', 'company2')
    
    const mixedNodes = [stationNode1, junctionNode1, stationNode2, junctionNode2]
    const result = filterStationNodes(mixedNodes)
    
    t.assert.equal(result.length, 2)
    t.assert.equal(result[0].item.type, 'Station')
    t.assert.equal(result[1].item.type, 'Station')
    t.assert.equal(result[0].id, 'node1')
    t.assert.equal(result[1].id, 'node2')
  })

  it('should return empty array when no station nodes exist', async (t: TestContext) => {
    const junctionNode1 = await createTestJunctionNode('node1', 'junction1', 'company1')
    const junctionNode2 = await createTestJunctionNode('node2', 'junction2', 'company2')
    
    const junctionNodes = [junctionNode1, junctionNode2]
    const result = filterStationNodes(junctionNodes)
    
    t.assert.equal(result.length, 0)
  })

  it('should return all nodes when all are station nodes', async (t: TestContext) => {
    const stationNode1 = await createTestStationNode('node1', 'Station A', 'company1')
    const stationNode2 = await createTestStationNode('node2', 'Station B', 'company2')
    const stationNode3 = await createTestStationNode('node3', 'Station C', 'company1')
    
    const stationNodes = [stationNode1, stationNode2, stationNode3]
    const result = filterStationNodes(stationNodes)
    
    t.assert.equal(result.length, 3)
    result.forEach(node => {
      t.assert.equal(node.item.type, 'Station')
    })
  })

  it('should handle empty array input', async (t: TestContext) => {
    const result = filterStationNodes([])
    
    t.assert.equal(result.length, 0)
  })
})

describe('filterJunctionNodes', () => {
  it('should filter and return only junction nodes from mixed array', async (t: TestContext) => {
    const stationNode1 = await createTestStationNode('node1', 'Station A', 'company1')
    const stationNode2 = await createTestStationNode('node2', 'Station B', 'company2')
    const junctionNode1 = await createTestJunctionNode('node3', 'junction1', 'company1')
    const junctionNode2 = await createTestJunctionNode('node4', 'junction2', 'company2')
    
    const mixedNodes = [stationNode1, junctionNode1, stationNode2, junctionNode2]
    const result = filterJunctionNodes(mixedNodes)
    
    t.assert.equal(result.length, 2)
    t.assert.equal(result[0].item.type, 'Junction')
    t.assert.equal(result[1].item.type, 'Junction')
    t.assert.equal(result[0].id, 'node3')
    t.assert.equal(result[1].id, 'node4')
  })

  it('should return empty array when no junction nodes exist', async (t: TestContext) => {
    const stationNode1 = await createTestStationNode('node1', 'Station A', 'company1')
    const stationNode2 = await createTestStationNode('node2', 'Station B', 'company2')
    
    const stationNodes = [stationNode1, stationNode2]
    const result = filterJunctionNodes(stationNodes)
    
    t.assert.equal(result.length, 0)
  })

  it('should return all nodes when all are junction nodes', async (t: TestContext) => {
    const junctionNode1 = await createTestJunctionNode('node1', 'junction1', 'company1')
    const junctionNode2 = await createTestJunctionNode('node2', 'junction2', 'company2')
    const junctionNode3 = await createTestJunctionNode('node3', 'junction3', 'company1')
    
    const junctionNodes = [junctionNode1, junctionNode2, junctionNode3]
    const result = filterJunctionNodes(junctionNodes)
    
    t.assert.equal(result.length, 3)
    result.forEach(node => {
      t.assert.equal(node.item.type, 'Junction')
    })
  })

  it('should handle empty array input', async (t: TestContext) => {
    const result = filterJunctionNodes([])
    
    t.assert.equal(result.length, 0)
  })
})
