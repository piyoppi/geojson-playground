import { describe, it, type TestContext } from 'node:test'
import { partition, getTrafficGraphPartitionKey } from './partition.js'
import { buildPartitionedRepository } from '../../graph/arc/partitionedRepositoryArc.js'
import type { TrafficGraphNode, TrafficItem } from './trafficGraph.js'
import { CompanyId, StationId, RouteId, JunctionId, type Route, type Station } from '../transportation.js'
import { toId } from '../../utils/Id.js'

const createMockTrafficItem = async (type: 'Station' | 'Junction', companyIdStr: string): Promise<TrafficItem> => {
  const companyId = CompanyId(await toId(companyIdStr))
  
  if (type === 'Station') {
    return {
      type: 'Station',
      companyId,
      position: () => [0, 0],
      station: {
        id: StationId(await toId('station1')),
        name: 'Test Station',
        routeId: RouteId(await toId('route1')),
        position: [0, 0]
      }
    }
  } else {
    return {
      type: 'Junction',
      companyId,
      position: () => [0, 0],
      junction: {
        id: JunctionId(await toId('junction1')),
        position: [0, 0]
      }
    }
  }
}

const createTestTrafficNode = async (id: string, companyIdStr: string, type: 'Station' | 'Junction' = 'Station'): Promise<TrafficGraphNode> => {
  const item = await createMockTrafficItem(type, companyIdStr)
  return {
    id,
    item,
    arcs: []
  }
}

const createMockRoute = async (companyIdStr: string): Promise<Route<Station>> => {
  return {
    id: RouteId(await toId('route1')),
    name: 'Test Route',
    companyId: CompanyId(await toId(companyIdStr)),
    kind: 'railroad',
    stations: []
  }
}

const buildTestRepository = async () => {
  const nodes = new Map<string, TrafficGraphNode[]>()

  return buildPartitionedRepository<TrafficItem>(
    (pk) => Promise.resolve(nodes.get(pk) ?? []),
    (pk, partitionedNodes) => {
      nodes.set(pk, partitionedNodes)
      return Promise.resolve()
    }
  )
}

describe('getTrafficGraphPartitionKey', () => {
  it('should return companyId for TrafficItem', async (t: TestContext) => {
    const item = await createMockTrafficItem('Station', 'company1')
    const key = getTrafficGraphPartitionKey(item)
    t.assert.equal(key, item.companyId)
  })

  it('should return companyId for Route', async (t: TestContext) => {
    const route = await createMockRoute('company2')
    const key = getTrafficGraphPartitionKey(route)
    t.assert.equal(key, route.companyId)
  })
})

describe('partition', () => {
  it('should group nodes by company correctly', async (t: TestContext) => {
    const repository = await buildTestRepository()

    const node1 = await createTestTrafficNode('node1', 'company1')
    const node2 = await createTestTrafficNode('node2', 'company1')
    const node3 = await createTestTrafficNode('node3', 'company2')
    
    const stationNodes = [node1, node2, node3]

    await partition(repository, stationNodes)

    t.assert.equal(await repository.get('node1', node1.item.companyId), node1)
    t.assert.equal(await repository.get('node2', node2.item.companyId), node2)
    t.assert.equal(await repository.get('node3', node3.item.companyId), node3)
  })

  it('should handle nodes with no arcs', async (t: TestContext) => {
    const mockRepository = await buildTestRepository()

    const node1 = await createTestTrafficNode('node1', 'company1')
    const stationNodes = [node1]

    // Should not throw any errors
    await partition(mockRepository, stationNodes)

    const retrievedNode = await mockRepository.get('node1', node1.item.companyId)
    t.assert.equal(retrievedNode?.id, 'node1')
    t.assert.equal(retrievedNode?.arcs.length, 0)
  })

  it('should handle arcs with undefined nodes', async (t: TestContext) => {
    const mockRepository = await buildTestRepository()

    const node1 = await createTestTrafficNode('node1', 'company1')
    
    // Create a mock arc with undefined nodes
    const mockArc = {
      a: () => Promise.resolve(undefined),
      b: () => Promise.resolve(undefined),
      cost: 10
    }
    
    node1.arcs = [mockArc]
    const stationNodes = [node1]

    // Should not throw any errors and should keep the original arc
    await partition(mockRepository, stationNodes)

    t.assert.equal(node1.arcs.length, 1)
    t.assert.equal(node1.arcs[0], mockArc)
  })
})
