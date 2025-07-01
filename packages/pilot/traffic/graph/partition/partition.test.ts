import { describe, it, type TestContext } from 'node:test'
import { partition } from './partition.js'
import { buildPartitionedRepository } from '../../../graph/arc/partitionedRepositoryArc.js'
import type { TrafficNode, TrafficNodeItem } from '../trafficGraph.js'
import { StationId, JunctionId, CompanyId, RouteId } from '../../transportation.js'
import { toId } from '../../../utils/Id.js'

const createMockTrafficItem = async (type: 'RailroadStation' | 'Junction', idStr: string): Promise<TrafficNodeItem> => {
  if (type === 'RailroadStation') {
    return {
      type: 'RailroadStation',
      stationId: StationId(await toId(idStr))
    }
  } else {
    return {
      type: 'Junction',
      junctionId: JunctionId(await toId(idStr)),
      position: [0, 0],
      companyId: CompanyId(await toId('testCompany')),
      routeId: RouteId(await toId('testRoute'))
    }
  }
}

const createTestTrafficNode = async (id: string, itemIdStr: string, type: 'RailroadStation' | 'Junction' = 'RailroadStation'): Promise<TrafficNode> => {
  const item = await createMockTrafficItem(type, itemIdStr)
  return {
    id,
    item,
    arcs: []
  }
}

const buildTestRepository = async () => {
  const nodes = new Map<string, TrafficNode[]>()

  return buildPartitionedRepository<TrafficNodeItem>(
    (pk) => Promise.resolve(nodes.get(pk) ?? []),
    (pk, partitionedNodes) => {
      nodes.set(pk, partitionedNodes)
      return Promise.resolve()
    }
  )
}


describe('partition', () => {
  it('should group nodes by company correctly', async (t: TestContext) => {
    const repository = await buildTestRepository()

    const node1 = await createTestTrafficNode('node1', 'station1')
    const node2 = await createTestTrafficNode('node2', 'station2')
    const node3 = await createTestTrafficNode('node3', 'station3')

    const stationNodes = [node1, node2, node3]

    const getPartitionKey = (node: TrafficNode): string => {
      if (node.id === 'node1' || node.id === 'node2') {
        return 'company1'
      } else if (node.id === 'node3') {
        return 'company2'
      }
      return 'default'
    }

    await partition(repository, stationNodes, getPartitionKey)

    t.assert.equal(await repository.get('node1', 'company1'), node1)
    t.assert.equal(await repository.get('node2', 'company1'), node2)
    t.assert.equal(await repository.get('node3', 'company2'), node3)
  })

  it('should handle nodes with no arcs', async (t: TestContext) => {
    const mockRepository = await buildTestRepository()

    const node1 = await createTestTrafficNode('node1', 'station1')
    const stationNodes = [node1]

    const getPartitionKey = (): string => 'company1'

    // Should not throw any errors
    await partition(mockRepository, stationNodes, getPartitionKey)

    const retrievedNode = await mockRepository.get('node1', 'company1')
    t.assert.equal(retrievedNode?.id, 'node1')
    t.assert.equal(retrievedNode?.arcs.length, 0)
  })

  it('should handle arcs with undefined nodes', async (t: TestContext) => {
    const mockRepository = await buildTestRepository()

    const node1 = await createTestTrafficNode('node1', 'station1')

    // Create a mock arc with undefined nodes
    const mockArc = {
      a: () => Promise.resolve(undefined),
      b: () => Promise.resolve(undefined),
      cost: 10
    }

    node1.arcs = [mockArc]
    const stationNodes = [node1]

    const getPartitionKey = (): string => 'company1'

    // Should not throw any errors and should keep the original arc
    await partition(mockRepository, stationNodes, getPartitionKey)

    t.assert.equal(node1.arcs.length, 1)
    t.assert.equal(node1.arcs[0], mockArc)
  })
})
