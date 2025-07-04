import { describe, it, type TestContext } from 'node:test'
import {
  to,
  arcExists,
  findConnectingArc,
  connect,
  disconnect,
  findShortestPath,
  buildNodeMerger,
  buildDuplicateNodesMarger,
  removeNode,
  createNode
} from './graph'
import { ArcGenerator } from './arc/index'

const generateArc: ArcGenerator<{}> = (a, b, cost) => ({
  a: () => Promise.resolve((new WeakRef(a)).deref()),
  b: () => Promise.resolve((new WeakRef(b)).deref()),
  cost
})

describe('to', () => {
  it('should return the other node in the arc', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const arc = { a: () => Promise.resolve(nodeA), b: () => Promise.resolve(nodeB), cost: 1 }
    connect(nodeA, nodeB, arc)

    t.assert.strictEqual(await to(nodeA, arc), nodeB)
    t.assert.strictEqual(await to(nodeB, arc), nodeA)
  })

  it('should return null if the node is not part of the arc', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const nodeC = { id: 'C', item: {}, arcs: [] }
    const arc = { a: () => Promise.resolve(nodeA), b: () => Promise.resolve(nodeB), cost: 1 }
    connect(nodeA, nodeB, arc)

    t.assert.strictEqual(await to(nodeC, arc), null)
  })
})

describe('arcExists', () => {
  it('should return true if an arc exists between nodes', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const arc = { a: () => Promise.resolve(nodeA), b: () => Promise.resolve(nodeB), cost: 1 }
    connect(nodeA, nodeB, arc)

    t.assert.strictEqual(await arcExists(nodeA, nodeB), true)
  })

  it('should return false if no arc exists between nodes', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const nodeC = { id: 'C', item: {}, arcs: [] }
    const arc = { a: () => Promise.resolve(nodeA), b: () => Promise.resolve(nodeB), cost: 1 }
    connect(nodeA, nodeB, arc)

    t.assert.strictEqual(await arcExists(nodeA, nodeC), false)
  })
})

describe('findConnectingArc', () => {
  it('should return the arc object if an arc exists between nodes', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const arc = { a: () => Promise.resolve(nodeA), b: () => Promise.resolve(nodeB), cost: 1 }
    connect(nodeA, nodeB, arc)

    const foundArc = await findConnectingArc(nodeA, nodeB)
    t.assert.strictEqual(foundArc, arc)
  })

  it('should return undefined if no arc exists between nodes', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const nodeC = { id: 'C', item: {}, arcs: [] }
    const arc = { a: () => Promise.resolve(nodeA), b: () => Promise.resolve(nodeB), cost: 1 }
    connect(nodeA, nodeB, arc)

    const foundArc = await findConnectingArc(nodeA, nodeC)
    t.assert.strictEqual(foundArc, undefined)
  })

  it('should find arc regardless of node order', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const arc = { a: () => Promise.resolve(nodeA), b: () => Promise.resolve(nodeB), cost: 5 }
    connect(nodeA, nodeB, arc)

    const foundArcAB = await findConnectingArc(nodeA, nodeB)
    const foundArcBA = await findConnectingArc(nodeB, nodeA)

    t.assert.strictEqual(foundArcAB, arc)
    t.assert.strictEqual(foundArcBA, arc)
    t.assert.strictEqual(foundArcAB, foundArcBA)
  })

  it('should return the correct arc when multiple arcs exist from a node', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const nodeC = { id: 'C', item: {}, arcs: [] }
    const arcAB = { a: () => Promise.resolve(nodeA), b: () => Promise.resolve(nodeB), cost: 10 }
    const arcAC = { a: () => Promise.resolve(nodeA), b: () => Promise.resolve(nodeC), cost: 20 }

    connect(nodeA, nodeB, arcAB)
    connect(nodeA, nodeC, arcAC)

    const foundArcAB = await findConnectingArc(nodeA, nodeB)
    const foundArcAC = await findConnectingArc(nodeA, nodeC)
    const foundArcBC = await findConnectingArc(nodeB, nodeC)

    t.assert.strictEqual(foundArcAB, arcAB)
    t.assert.strictEqual(foundArcAC, arcAC)
    t.assert.strictEqual(foundArcBC, undefined)
  })
})

describe('buildNodeMerger', () => {
  it('should merge nodes and connect arcs properly', async (t: TestContext) => {
    // Create test nodes
    const node1 = { id: 'node1', item: {}, arcs: [] }
    const node2 = { id: 'node2', item: {}, arcs: [] }
    const node3 = { id: 'node3', item: {}, arcs: [] }

    // Create arcs
    //           arc1             arc2
    // [node1] ---10--- [node3] ---20--- [node2]
    //    |                                 |
    //    |              arc3               |
    //    '----------------5----------------'
    //
    const arc13 = generateArc(node1, node3, 10)
    const arc23 = generateArc(node2, node3, 20)
    const arc12 = generateArc(node1, node2, 5)
    connect(node1, node3, arc13)
    connect(node2, node3, arc23)
    connect(node1, node2, arc12)

    // Merge node1 and node2
    //
    //                [mergedNode]
    //                     |
    //                    15
    //           arc1      |      arc2
    // [node1] ---10--- [node3] ---20--- [node2]
    //    |                                 |
    //    |              arc3               |
    //    '----------------5----------------'
    //
    const mergeNodes = buildNodeMerger(generateArc)
    const mergedNode = await mergeNodes(node1, node2)
    t.assert.equal(mergedNode.arcs.length, 1)
    t.assert.equal(node3.arcs.length, 3)
    t.assert.deepEqual(mergedNode.arcs[0].cost, 15)
  })

  it('should merge nodes and connect arcs properly with multiple connections', async (t: TestContext) => {
    const node1 = { id: 'node1', item: {}, arcs: [] }
    const node2 = { id: 'node2', item: {}, arcs: [] }
    const node3 = { id: 'node3', item: {}, arcs: [] }
    const node4 = { id: 'node4', item: {}, arcs: [] }

    // Create arcs
    //         arc1                arc2
    //    +-----10------[node2]-----20------+
    //    |                                 |
    // [node1]                           [node4]
    //    |                                 |
    //    +-----30------[node3]-----40------+
    //         arc3                arc4
    //
    const arc12 = generateArc(node1, node2, 10)
    const arc24 = generateArc(node2, node4, 20)
    const arc13 = generateArc(node1, node3, 30)
    const arc34 = generateArc(node3, node4, 40)
    connect(node1, node2, arc12)
    connect(node2, node4, arc24)
    connect(node1, node3, arc13)
    connect(node3, node4, arc34)

    // Merge node2 and node3
    //
    //         arc1                arc2
    //    +-----10------[node2]-----20------+
    //    |                                 |
    // [node1]-------[mergedNode]--------[node4]
    //    |                                 |
    //    +-----30------[node3]-----40------+
    //         arc3                arc4
    //
    const mergeNodes = buildNodeMerger(generateArc)
    const mergedNode = await mergeNodes(node2, node3)
    t.assert.equal(mergedNode.arcs.length, 2)

    // NOTE: hasNodeInArcA を ok assertion で直接利用するとハングアップする
    //       node - arc 間の参照が循環しているため？
    const mergedNodeArc1HasNode1 = [node1, node4, mergedNode].includes(await (mergedNode.arcs[1].a()) as any)
    t.assert.ok(mergedNodeArc1HasNode1)
    const mergedNodeArc1HasOwn = [node1, node4, mergedNode].includes(await (mergedNode.arcs[1].b()) as any)
    t.assert.ok(mergedNodeArc1HasOwn)
    const mergedNodeArc0HasNode4 = [node1, node4, mergedNode].includes(await (mergedNode.arcs[0].a()) as any)
    t.assert.ok(mergedNodeArc0HasNode4)
    const mergedNodeArc0HasOwn = [node1, node4, mergedNode].includes(await (mergedNode.arcs[0].b()) as any)
    t.assert.ok(mergedNodeArc0HasOwn)

    t.assert.equal(node1.arcs.length, 3)
    t.assert.equal(node4.arcs.length, 3)
  })

  it('should merge nodes and connect an arc when merged node has an arc that has same cost', async (t: TestContext) => {
    const node1 = { id: 'node1', item: {}, arcs: [] }
    const node2 = { id: 'node2', item: {}, arcs: [] }
    const node3 = { id: 'node3', item: {}, arcs: [] }

    // Create arcs
    //           arc1             arc2
    // [node1] ---10--- [node3] ---10--- [node2]
    //    |                                 |
    //    |              arc3               |
    //    '----------------5----------------'
    //
    const arc13 = generateArc(node1, node3, 10)
    const arc23 = generateArc(node2, node3, 10)
    const arc12 = generateArc(node1, node2, 5)
    connect(node1, node3, arc13)
    connect(node2, node3, arc23)
    connect(node1, node2, arc12)

    // Merge node1 and node2
    //
    //                [mergedNode]
    //                     |
    //                    10
    //           arc1      |      arc2
    // [node1] ---10--- [node3] ---10--- [node2]
    //    |                                 |
    //    |              arc3               |
    //    '----------------5----------------'
    //
    const mergeNodes = buildNodeMerger(generateArc)
    const mergedNode = await mergeNodes(node1, node2)
    t.assert.equal(mergedNode.arcs.length, 1)
    t.assert.equal(mergedNode.arcs[0].cost, 10)

    t.assert.equal(node3.arcs.length, 3)
  })

  it('should return an empty node when merging no nodes', async (t: TestContext) => {
    const mergeNodes = buildNodeMerger(generateArc)
    const mergedNode = await mergeNodes()
    t.assert.equal(mergedNode.arcs.length, 0)
  })
})

describe('disconnect', () => {
  it('should remove arcs between two nodes', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const arc = generateArc(nodeA, nodeB, 10)

    connect(nodeA, nodeB, arc)

    t.assert.strictEqual(nodeA.arcs.length, 1)
    t.assert.strictEqual(nodeB.arcs.length, 1)
    t.assert.strictEqual(await arcExists(nodeA, nodeB), true)

    await disconnect(nodeA, nodeB)

    t.assert.strictEqual(nodeA.arcs.length, 0)
    t.assert.strictEqual(nodeB.arcs.length, 0)
    t.assert.strictEqual(await arcExists(nodeA, nodeB), false)
  })

  it('should not affect other connections when disconnecting specific nodes', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const nodeC = { id: 'C', item: {}, arcs: [] }

    const arcAB = generateArc(nodeA, nodeB, 100)
    const arcAC = generateArc(nodeA, nodeC, 200)

    connect(nodeA, nodeB, arcAB)
    connect(nodeA, nodeC, arcAC)

    t.assert.strictEqual(nodeA.arcs.length, 2)
    t.assert.strictEqual(nodeB.arcs.length, 1)
    t.assert.strictEqual(nodeC.arcs.length, 1)

    await disconnect(nodeA, nodeB)

    t.assert.strictEqual(nodeA.arcs.length, 1)
    t.assert.strictEqual(nodeB.arcs.length, 0)
    t.assert.strictEqual(nodeC.arcs.length, 1)
    t.assert.strictEqual(await arcExists(nodeA, nodeB), false)
    t.assert.strictEqual(await arcExists(nodeA, nodeC), true)
  })

  it('should handle case when nodes have no connection', (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }

    t.assert.strictEqual(nodeA.arcs.length, 0)
    t.assert.strictEqual(nodeB.arcs.length, 0)
  })
})

describe('findShortestPath', () => {
  it('should find the shortest path between two directly connected nodes', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }

    const arc = generateArc(nodeA, nodeB, 5)
    connect(nodeA, nodeB, arc)

    const path = await findShortestPath(nodeA, nodeB)
    t.assert.ok(path !== null)
    t.assert.equal(path?.length, 2)
    t.assert.equal(path?.[0].id, 'A')
    t.assert.equal(path?.[1].id, 'B')
  })

  it('should find the shortest path through multiple nodes', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const nodeC = { id: 'C', item: {}, arcs: [] }
    const nodeD = { id: 'D', item: {}, arcs: [] }

    const arcAB = generateArc(nodeA, nodeB, 10)
    const arcAC = generateArc(nodeA, nodeC, 3)
    const arcCD = generateArc(nodeC, nodeD, 2)
    const arcBD = generateArc(nodeB, nodeD, 5)

    connect(nodeA, nodeB, arcAB)
    connect(nodeA, nodeC, arcAC)
    connect(nodeC, nodeD, arcCD)
    connect(nodeB, nodeD, arcBD)

    const path = await findShortestPath(nodeA, nodeD)
    t.assert.ok(path !== null)
    t.assert.equal(path?.length, 3)
    t.assert.equal(path?.[0].id, 'A')
    t.assert.equal(path?.[1].id, 'C')
    t.assert.equal(path?.[2].id, 'D')
  })

  it('should return null when no path exists', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }

    const nodes = await findShortestPath(nodeA, nodeB)
    t.assert.strictEqual(0, nodes.length)
  })

  it('should handle a cycle in the graph', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const nodeC = { id: 'C', item: {}, arcs: [] }

    const arcAB = generateArc(nodeA, nodeB, 1)
    const arcBC = generateArc(nodeB, nodeC, 1)
    const arcCA = generateArc(nodeC, nodeA, 1)

    connect(nodeA, nodeB, arcAB)
    connect(nodeB, nodeC, arcBC)
    connect(nodeC, nodeA, arcCA)

    const path = await findShortestPath(nodeA, nodeC)
    t.assert.ok(path !== null)
    t.assert.equal(path?.length, 2)
    t.assert.equal(path?.[0].id, 'A')
    t.assert.equal(path?.[1].id, 'C')
  })

  it('should return a single node when start and end are the same', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }

    const path = await findShortestPath(nodeA, nodeA)
    t.assert.ok(path !== null)
    t.assert.equal(path?.length, 1)
    t.assert.equal(path?.[0].id, 'A')
  })
})

describe('buildDuplicateNodesMarger', () => {
  it('should merge nodes with the same group key', async (t: TestContext) => {
    // Create nodes with same group key
    // Initial graph structure:
    // [A1] ---- [B]
    //
    // [A2] ---- [C]
    //
    // Expected after merge:
    //
    // ( [A1] [A2]: Removed )
    //
    // [A] ---- [B]
    //  |
    //  +------ [C]
    const nodeA1 = createNode('A', { name: 'Node A1' })
    const nodeA2 = createNode('A', { name: 'Node A2' })
    const nodeB  = createNode('B', { name: 'Node B' })
    const nodeC  = createNode('C', { name: 'Node C' })

    connect(nodeA1, nodeB, generateArc(nodeA1, nodeB, 10))
    connect(nodeA2, nodeC, generateArc(nodeA2, nodeC, 20))

    const mergeDuplicatedNode = buildDuplicateNodesMarger(
      buildNodeMerger(generateArc)
    )

    const result = await mergeDuplicatedNode([nodeA1, nodeA2])
    t.assert.equal(result.length, 1)

    const nodeA = result[0]

    t.assert.ok(await arcExists(nodeA, nodeB))
    t.assert.ok(await arcExists(nodeA, nodeC))

    t.assert.ok(!(await arcExists(nodeA1, nodeB)))
    t.assert.ok(!(await arcExists(nodeA2, nodeC)))
  })

  // it('should use custom group key function', async (t: TestContext) => {
  //   // Group by 'group' property instead of node ID
  //   // Initial: [1 (group:A)] [2 (group:A)] [3 (group:B)]
  //   // After merge: [1 (group:A)] [3 (group:B)]
  //   const node1 = createNode('1', { group: 'A', value: 10 })
  //   const node2 = createNode('2', { group: 'A', value: 20 })
  //   const node3 = createNode('3', { group: 'B', value: 30 })

  //   const mergeNodes = buildNodeMerger(generateArc)
  //   const duplicateNodesMerger = buildDuplicateNodesMarger(
  //     mergeNodes,
  //     (n) => n.item.group
  //   )

  //   const result = await duplicateNodesMerger([node1, node2, node3])

  //   // Should have 2 nodes: merged node for group 'A' and node3 for group 'B'
  //   t.assert.equal(result.length, 2)

  //   // The merged node should have id '1' (from first node in group)
  //   const mergedNode = result.find(n => n.id === '1')
  //   const nodeBGroup = result.find(n => n.id === '3')

  //   t.assert.ok(mergedNode)
  //   t.assert.ok(nodeBGroup)
  // })

  // it('should handle nodes with undefined group keys', async (t: TestContext) => {
  //   // Undefined group keys are not merged
  //   // Initial: [1 (group:A)] [2 (group:undefined)] [3 (group:A)] [4 (group:undefined)]
  //   // After merge: [1 (group:A)] [2 (group:undefined)] [4 (group:undefined)]
  //   const node1 = createNode('1', { group: 'A' })
  //   const node2 = createNode('2', { group: undefined })
  //   const node3 = createNode('3', { group: 'A' })
  //   const node4 = createNode('4', { group: undefined })

  //   const mergeNodes = buildNodeMerger(generateArc)
  //   const duplicateNodesMerger = buildDuplicateNodesMarger(
  //     mergeNodes,
  //     (n) => n.item.group
  //   )

  //   const result = await duplicateNodesMerger([node1, node2, node3, node4])

  //   // Should have 3 nodes: merged node for 'A', and individual nodes with undefined group
  //   t.assert.equal(result.length, 3)

  //   const mergedNode = result.find(n => n.id === '1')
  //   const node2Result = result.find(n => n.id === '2')
  //   const node4Result = result.find(n => n.id === '4')

  //   t.assert.ok(mergedNode)
  //   t.assert.ok(node2Result)
  //   t.assert.ok(node4Result)
  // })

  // it('should call mergedNodeHook with correct parameters', async (t: TestContext) => {
  //   // Hook is called when merging occurs
  //   // Initial: [A] [A] [B]
  //   // Merge: A + A -> hook called with merged node and [A, A]
  //   const node1 = createNode('A', { value: 1 })
  //   const node2 = createNode('A', { value: 2 })
  //   const node3 = createNode('B', { value: 3 })

  //   const mergeNodes = buildNodeMerger(generateArc)
  //   const duplicateNodesMerger = buildDuplicateNodesMarger(mergeNodes)

  //   let hookCalled = false
  //   let hookMergedNode = null
  //   let hookTargetNodes = null

  //   await duplicateNodesMerger(
  //     [node1, node2, node3],
  //     (merged, targetNodes) => {
  //       hookCalled = true
  //       hookMergedNode = merged
  //       hookTargetNodes = targetNodes
  //     }
  //   )

  //   t.assert.ok(hookCalled)
  //   t.assert.ok(hookMergedNode)
  //   t.assert.ok(hookTargetNodes)
  //   t.assert.equal(hookTargetNodes?.length, 2)
  //   t.assert.ok(hookTargetNodes?.includes(node1))
  //   t.assert.ok(hookTargetNodes?.includes(node2))
  // })

  // it('should not merge when all nodes have unique keys', async (t: TestContext) => {
  //   // No merging when all keys are unique
  //   // Initial: [A] [B] [C]
  //   // After: [A] [B] [C] (no change)
  //   const node1 = createNode('A', { value: 1 })
  //   const node2 = createNode('B', { value: 2 })
  //   const node3 = createNode('C', { value: 3 })

  //   const mergeNodes = buildNodeMerger(generateArc)
  //   const duplicateNodesMerger = buildDuplicateNodesMarger(mergeNodes)

  //   const result = await duplicateNodesMerger([node1, node2, node3])

  //   t.assert.equal(result.length, 3)
  //   t.assert.ok(result.includes(node1))
  //   t.assert.ok(result.includes(node2))
  //   t.assert.ok(result.includes(node3))
  // })

  // it('should handle empty array', async (t: TestContext) => {
  //   // Empty input should return empty output
  //   // Initial: []
  //   // After: []
  //   const mergeNodes = buildNodeMerger(generateArc)
  //   const duplicateNodesMerger = buildDuplicateNodesMarger(mergeNodes)

  //   const result = await duplicateNodesMerger([])

  //   t.assert.equal(result.length, 0)
  // })

  // it('should merge nodes with connections', async (t: TestContext) => {
  //   // Merge nodes with connections and calculate average cost
  //   // Initial graph:
  //   //    [A]--10--[X]
  //   //             /
  //   //    [A]--20--/
  //   //
  //   // After merge:
  //   //    [A]--15--[X]  (average of 10 and 20)
  //   const node1 = createNode('A', { name: 'Node 1' })
  //   const node2 = createNode('A', { name: 'Node 2' })
  //   const nodeX = createNode('X', { name: 'Node X' })

  //   // Add connections
  //   const arc1X = generateArc(node1, nodeX, 10)
  //   const arc2X = generateArc(node2, nodeX, 20)

  //   connect(node1, nodeX, arc1X)
  //   connect(node2, nodeX, arc2X)

  //   const mergeNodes = buildNodeMerger(generateArc)
  //   const duplicateNodesMerger = buildDuplicateNodesMarger(mergeNodes)

  //   const result = await duplicateNodesMerger([node1, node2, nodeX])

  //   // Should have 2 nodes: merged node for 'A' and nodeX
  //   t.assert.equal(result.length, 2)

  //   const mergedNode = result.find(n => n.id === 'A')
  //   const nodeXResult = result.find(n => n.id === 'X')

  //   t.assert.ok(mergedNode)
  //   t.assert.ok(nodeXResult)

  //   // Check that merged node has connection to X with average cost
  //   t.assert.equal(mergedNode?.arcs.length, 1)
  //   t.assert.equal(mergedNode?.arcs[0].cost, 15) // (10 + 20) / 2

  //   // Verify original nodes were disconnected
  //   t.assert.equal(node1.arcs.length, 0)
  //   t.assert.equal(node2.arcs.length, 0)
  // })
})

describe('removeNode', () => {
  it('should remove a node and its arcs', async (t: TestContext) => {
    const nodeA = createNode('A', {})
    const nodeB = createNode('B', {})
    const arc = generateArc(nodeA, nodeB, 10)
    connect(nodeA, nodeB, arc)

    t.assert.equal(nodeA.arcs.length, 1)
    t.assert.equal(nodeB.arcs.length, 1)

    await removeNode(nodeA)

    t.assert.equal(nodeA.arcs.length, 0)
    t.assert.equal(nodeB.arcs.length, 0)
  })
})
