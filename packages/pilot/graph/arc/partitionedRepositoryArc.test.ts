import { describe, it, type TestContext } from 'node:test'
import { 
  buildPartitionedRepositoryArcGenerator,
  buildPartitionedRepositoryArcDeserializer,
  type PartitionedRepositoryGetter,
  buildPartitionedRepository
} from './partitionedRepositoryArc.js'
import type { GraphNode, NodeId } from '../graph.js'

type TestItem = { value: string }

const createTestNode = (id: NodeId, value: string): GraphNode<TestItem> => ({
  id,
  item: { value },
  arcs: []
})

describe('buildPartitionedRepositoryArcGenerator', () => {
  it('should generate arc', async (t: TestContext) => {
    const nodeAId = 'A'
    const nodeBId = 'B'
    const cost = 5
    const nodeA = createTestNode(nodeAId, 'valueA')
    const nodeB = createTestNode(nodeBId, 'valueB')
    
    const repository: PartitionedRepositoryGetter<GraphNode<TestItem>> = async (id, pk) => {
      if (id === nodeAId && pk === 'partitionA') return nodeA
      if (id === nodeBId && pk === 'partitionB') return nodeB
      return undefined
    }
    
    const partitionKeyGetter = (node: GraphNode<TestItem>) => 
      node.id === nodeAId ? 'partitionA' : 'partitionB'
    
    const arcGenerator = buildPartitionedRepositoryArcGenerator(repository, partitionKeyGetter)
    const arc = arcGenerator(nodeA, nodeB, cost)
    
    t.assert.equal(arc.cost, cost)
    
    const resolvedA = await arc.a()
    const resolvedB = await arc.b()
    
    t.assert.equal(resolvedA?.id, nodeAId)
    t.assert.equal(resolvedB?.id, nodeBId)
    t.assert.equal(resolvedA?.item.value, 'valueA')
    t.assert.equal(resolvedB?.item.value, 'valueB')
  })

  it('should throw error when node is not found in repository', async (t: TestContext) => {
    const nodeA = createTestNode('A', 'valueA')
    const nodeB = createTestNode('B', 'valueB')
    
    const mockRepository: PartitionedRepositoryGetter<GraphNode<TestItem>> = async () => undefined
    const partitionKeyGetter = () => 'test-partition'
    
    const arcGenerator = buildPartitionedRepositoryArcGenerator(mockRepository, partitionKeyGetter)
    const arc = arcGenerator(nodeA, nodeB, 10)
    
    await t.assert.rejects(
      arc.a(),
      /Node is not found \(id: A\)/
    )
  })
})

describe('buildPartitionedRepositoryArcDeserializer', () => {
  it('should return undefined for invalid serialized arc without partition keys', (t: TestContext) => {
    const getNode: PartitionedRepositoryGetter<GraphNode<TestItem>> = async () => undefined
    
    const deserializer = buildPartitionedRepositoryArcDeserializer(getNode)
    const result = deserializer({ aNodeId: 'A', bNodeId: 'B', arcCost: '10' }, () => {})
    
    t.assert.equal(result, undefined)
  })

  const invalidPartitionKeyCases = [
    { name: 'non-string aPk', serializedArc: { aNodeId: 'A', bNodeId: 'B', arcCost: '10', aPk: 123, bPk: 'validB' } },
    { name: 'non-string bPk', serializedArc: { aNodeId: 'A', bNodeId: 'B', arcCost: '10', aPk: 'validA', bPk: 456 } },
    { name: 'both non-string', serializedArc: { aNodeId: 'A', bNodeId: 'B', arcCost: '10', aPk: 123, bPk: 456 } }
  ]

  for (const { name, serializedArc } of invalidPartitionKeyCases) {
    it(`should return undefined for ${name}`, (t: TestContext) => {
      const getNode: PartitionedRepositoryGetter<GraphNode<TestItem>> = async () => undefined
      
      const deserializer = buildPartitionedRepositoryArcDeserializer(getNode)
      const result = deserializer(serializedArc, () => {})
      
      t.assert.equal(result, undefined)
    })
  }

  it('should deserialize arc with lazy resolution from getNode', async (t: TestContext) => {
    const nodeA = createTestNode('A', 'valueA')
    const nodeB = createTestNode('B', 'valueB')
    
    let resolvedCallbackCount = 0
    const resolvedCallback = () => resolvedCallbackCount++
    
    const getNode: PartitionedRepositoryGetter<GraphNode<TestItem>> = async (id, pk) => {
      if (id === 'A' && pk === 'partitionA') return nodeA
      if (id === 'B' && pk === 'partitionB') return nodeB
      return undefined
    }
    
    const deserializer = buildPartitionedRepositoryArcDeserializer(getNode)
    const arc = deserializer({
      aNodeId: 'A',
      bNodeId: 'B',
      arcCost: '15',
      aPk: 'partitionA',
      bPk: 'partitionB'
    }, resolvedCallback)
    
    t.assert.ok(arc !== undefined)
    t.assert.equal(arc!.cost, 15)
    t.assert.equal(resolvedCallbackCount, 0) // Not called initially
    
    const resolvedA = await arc!.a()
    const resolvedB = await arc!.b()
    
    t.assert.equal(resolvedA?.id, 'A')
    t.assert.equal(resolvedB?.id, 'B')
    t.assert.equal(resolvedCallbackCount, 2) // Called after resolution
  })

  it('should handle undefined nodes from getNode', async (t: TestContext) => {
    let resolvedCallbackCount = 0
    const resolvedCallback = () => {
      resolvedCallbackCount++
    }
    
    const getNode: PartitionedRepositoryGetter<GraphNode<TestItem>> = async () => undefined
    
    const deserializer = buildPartitionedRepositoryArcDeserializer(getNode)
    const arc = deserializer({
      aNodeId: 'A',
      bNodeId: 'B',
      arcCost: '20',
      aPk: 'partitionA',
      bPk: 'partitionB'
    }, resolvedCallback)
    
    const resolvedA = await arc!.a()
    const resolvedB = await arc!.b()
    
    t.assert.equal(resolvedA, undefined)
    t.assert.equal(resolvedB, undefined)
    t.assert.equal(resolvedCallbackCount, 0) // Still not called since nodes were undefined
  })

  it('should cache resolved nodes on subsequent calls', async (t: TestContext) => {
    const nodeA = createTestNode('A', 'valueA')
    let getNodeCallCount = 0
    let resolvedCallbackCount = 0
    
    const getNode: PartitionedRepositoryGetter<GraphNode<TestItem>> = async (id, pk) => {
      getNodeCallCount++
      if (id === 'A' && pk === 'partitionA') return nodeA
      return undefined
    }
    
    const resolvedCallback = () => {
      resolvedCallbackCount++
    }
    
    const deserializer = buildPartitionedRepositoryArcDeserializer(getNode)
    const arc = deserializer({
      aNodeId: 'A',
      bNodeId: 'B',
      arcCost: '25',
      aPk: 'partitionA',
      bPk: 'partitionB'
    }, resolvedCallback)
    
    // First resolution
    const resolvedA1 = await arc!.a()
    t.assert.equal(resolvedA1?.id, 'A')
    t.assert.equal(getNodeCallCount, 1)
    t.assert.equal(resolvedCallbackCount, 1)
    
    // Second resolution should use cached value
    const resolvedA2 = await arc!.a()
    t.assert.equal(resolvedA2?.id, 'A')
    t.assert.equal(getNodeCallCount, 1) // Should not increase
    t.assert.equal(resolvedCallbackCount, 1) // Should not increase
  })
})

describe('buildPartitionedRepository', () => {
  it('should register and get nodes from in-memory partition', async (t: TestContext) => {
    let fetchCallCount = 0
    const fetchNodes = async () => {
      fetchCallCount++
      return []
    }
    const storeNodes = async () => {}
    
    const repository = buildPartitionedRepository<{value: string}>(fetchNodes, storeNodes)
    
    const nodeA = createTestNode('A', 'valueA')
    const partitionKey = 'partition1'
    
    await repository.register(nodeA, partitionKey)
    const retrieved = await repository.get('A', partitionKey)
    
    t.assert.equal(fetchCallCount, 0)
    t.assert.equal(retrieved?.id, 'A')
    t.assert.equal(retrieved?.item.value, 'valueA')
  })

  it('should return undefined for non-existent node in empty partition', async (t: TestContext) => {
    const fetchNodes = async () => []
    const storeNodes = async () => {}
    
    const repository = buildPartitionedRepository(fetchNodes, storeNodes)
    
    const result = await repository.get('nonexistent', 'partition1')
    
    t.assert.equal(result, undefined)
  })

  it('should fetch nodes from external source when not in memory', async (t: TestContext) => {
    const nodeA = createTestNode('A', 'valueA')
    const nodeB = createTestNode('B', 'valueB')
    
    let fetchCallCount = 0
    const fetchNodes = async (partitionKey: string) => {
      fetchCallCount++
      if (partitionKey === 'partition1') {
        return [nodeA, nodeB]
      }
      return []
    }
    
    const storeNodes = async () => {}
    
    const repository = buildPartitionedRepository(fetchNodes, storeNodes)
    
    const retrieved = await repository.get('A', 'partition1')
    
    t.assert.equal(retrieved?.id, 'A')
    t.assert.equal(retrieved?.item.value, 'valueA')
    t.assert.equal(fetchCallCount, 1)
  })

  it('should cache fetched nodes and not fetch again', async (t: TestContext) => {
    const nodeA = createTestNode('A', 'valueA')
    const nodeB = createTestNode('B', 'valueB')
    
    let fetchCallCount = 0
    const fetchNodes = async (_partitionKey: string) => {
      fetchCallCount++
      return [nodeA, nodeB]
    }
    
    const storeNodes = async () => {}
    
    const repository = buildPartitionedRepository(fetchNodes, storeNodes)
    
    // First call should fetch
    const retrieved1 = await repository.get('A', 'partition1')
    t.assert.equal(retrieved1?.id, 'A')
    t.assert.equal(fetchCallCount, 1)
    
    // Second call should use cache
    const retrieved2 = await repository.get('B', 'partition1')
    t.assert.equal(retrieved2?.id, 'B')
    t.assert.equal(fetchCallCount, 1) // Should not increase
  })

  it('should handle multiple partitions independently', async (t: TestContext) => {
    const nodeA = createTestNode('A', 'valueA')
    const nodeC = createTestNode('C', 'valueC')
    
    const fetchNodes = async (partitionKey: string) => {
      if (partitionKey === 'partition1') return [nodeA]
      if (partitionKey === 'partition2') return [nodeC]
      return []
    }
    
    const storeNodes = async () => {}
    
    const repository = buildPartitionedRepository(fetchNodes, storeNodes)
    
    await repository.register(createTestNode('B', 'valueB'), 'partition1')
    
    const retrievedA = await repository.get('A', 'partition1')
    const retrievedB = await repository.get('B', 'partition1')
    const retrievedC = await repository.get('C', 'partition2')
    
    t.assert.equal(retrievedA?.id, 'A')
    t.assert.equal(retrievedB?.id, 'B')
    t.assert.equal(retrievedC?.id, 'C')
    
    // Node A should not be in partition2
    const retrievedAFromPartition2 = await repository.get('A', 'partition2')
    t.assert.equal(retrievedAFromPartition2, undefined)
  })

  it('should store all partitions when store is called', async (t: TestContext) => {
    const storedData = new Map<string, GraphNode<TestItem>[]>()
    
    const fetchNodes = async () => []
    const storeNodes = async (partitionKey: string, nodes: GraphNode<TestItem>[]) => {
      storedData.set(partitionKey, nodes)
    }
    
    const repository = buildPartitionedRepository(fetchNodes, storeNodes)
    
    const nodeA = createTestNode('A', 'valueA')
    const nodeB = createTestNode('B', 'valueB')
    const nodeC = createTestNode('C', 'valueC')
    
    await repository.register(nodeA, 'partition1')
    await repository.register(nodeB, 'partition1')
    await repository.register(nodeC, 'partition2')
    
    await repository.store()
    
    const partition1Data = storedData.get('partition1')
    const partition2Data = storedData.get('partition2')
    
    t.assert.equal(partition1Data?.length, 2)
    t.assert.ok(partition1Data?.some(n => n.id === 'A'))
    t.assert.ok(partition1Data?.some(n => n.id === 'B'))
    
    t.assert.equal(partition2Data?.length, 1)
    t.assert.equal(partition2Data?.[0].id, 'C')
  })

  it('should prefer in-memory nodes over fetched nodes', async (t: TestContext) => {
    const fetchedNode = createTestNode('A', 'fetchedValue')
    const registeredNode = createTestNode('A', 'registeredValue')
    
    const fetchNodes = async () => [fetchedNode]
    const storeNodes = async () => {}
    
    const repository = buildPartitionedRepository(fetchNodes, storeNodes)
    
    // Register node first
    await repository.register(registeredNode, 'partition1')
    
    // Get should return registered node, not fetched
    const retrieved = await repository.get('A', 'partition1')
    
    t.assert.equal(retrieved?.item.value, 'registeredValue')
  })
})
