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

  it('should respect maxCost limit and not explore paths beyond it', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const nodeC = { id: 'C', item: {}, arcs: [] }
    const nodeD = { id: 'D', item: {}, arcs: [] }

    // Path structure:
    // A --5--> B --10--> D (total: 15)
    // A --20--> C --1--> D (total: 21)
    const arcAB = generateArc(nodeA, nodeB, 5)
    const arcBD = generateArc(nodeB, nodeD, 10)
    const arcAC = generateArc(nodeA, nodeC, 20)
    const arcCD = generateArc(nodeC, nodeD, 1)

    connect(nodeA, nodeB, arcAB)
    connect(nodeB, nodeD, arcBD)
    connect(nodeA, nodeC, arcAC)
    connect(nodeC, nodeD, arcCD)

    // With maxCost = 12, only A->B can be explored (cost 5)
    // B->D would be 5+10=15 (exceeds maxCost)
    // A->C would be 20      (exceeds maxCost)
    const pathWithLimit = await findShortestPath(nodeA, nodeD, { maxCost: 12 })
    t.assert.equal(pathWithLimit.length, 0)

    // Without maxCost limit, should find the shortest path A->B->D
    const pathNoLimit = await findShortestPath(nodeA, nodeD)
    t.assert.equal(pathNoLimit.length, 3)
    t.assert.equal(pathNoLimit[0].id, 'A')
    t.assert.equal(pathNoLimit[1].id, 'B')
    t.assert.equal(pathNoLimit[2].id, 'D')
  })

  it('should find alternative paths when some paths exceed maxCost', async (t: TestContext) => {
    const nodeA = { id: 'A', item: {}, arcs: [] }
    const nodeB = { id: 'B', item: {}, arcs: [] }
    const nodeC = { id: 'C', item: {}, arcs: [] }
    const nodeD = { id: 'D', item: {}, arcs: [] }

    // Path structure:
    // A --3--> B --8--> D (total: 11)
    // A --2--> C --3--> D (total: 5)
    const arcAB = generateArc(nodeA, nodeB, 3)
    const arcBD = generateArc(nodeB, nodeD, 8)
    const arcAC = generateArc(nodeA, nodeC, 2)
    const arcCD = generateArc(nodeC, nodeD, 3)

    connect(nodeA, nodeB, arcAB)
    connect(nodeB, nodeD, arcBD)
    connect(nodeA, nodeC, arcAC)
    connect(nodeC, nodeD, arcCD)

    // With maxCost = 10, path A->B->D (cost 11) (exceeds limit)
    // But path A->C->D (cost 5) (valid)
    const path = await findShortestPath(nodeA, nodeD, { maxCost: 10 })
    t.assert.equal(path.length, 3)
    t.assert.equal(path[0].id, 'A')
    t.assert.equal(path[1].id, 'C')
    t.assert.equal(path[2].id, 'D')
  })
})

describe('buildDuplicateNodesMarger', () => {
  it('should merge nodes with the same group key', async (t: TestContext) => {
    // Create nodes with same group key
    // Initial graph structure:
    // [A1] ---- [B1]
    //
    // [A2] ---- [C]
    //
    // [A3] ---- [B2]
    //
    // Expected after merge:
    //
    // ( [A1] [A2] [A3] [B1] [B2] : Removed )
    //
    // [A] ---- [B]
    //  |
    //  +------ [C]
    const nodeA1 = createNode('A', { name: 'Node A1' })
    const nodeA2 = createNode('A', { name: 'Node A2' })
    const nodeA3 = createNode('A', { name: 'Node A3' })
    const nodeB1 = createNode('B', { name: 'Node B1' })
    const nodeB2 = createNode('B', { name: 'Node B2' })
    const nodeC  = createNode('C', { name: 'Node C' })

    connect(nodeA1, nodeB1, generateArc(nodeA1, nodeB1, 10))
    connect(nodeA2, nodeC, generateArc(nodeA2, nodeC, 20))
    connect(nodeA3, nodeB2, generateArc(nodeA3, nodeB2, 10))

    const mergeDuplicatedNode = buildDuplicateNodesMarger(
      buildNodeMerger(generateArc)
    )

    const result = await mergeDuplicatedNode([nodeA1, nodeA2, nodeA3, nodeB1, nodeB2, nodeC])
    t.assert.equal(result.length, 3)

    const nodeA = result.find(n => n.id === 'A')
    const nodeB = result.find(n => n.id === 'B')
    t.assert.ok(nodeA)
    t.assert.ok(nodeB)
    t.assert.ok(nodeA !== nodeA1)
    t.assert.ok(nodeA !== nodeA2)
    t.assert.ok(nodeA !== nodeA3)

    t.assert.ok(await arcExists(nodeA, nodeB))
    t.assert.ok(await arcExists(nodeA, nodeC))

    t.assert.ok(!(await arcExists(nodeA1, nodeB)))
    t.assert.ok(!(await arcExists(nodeA2, nodeC)))
    t.assert.ok(!(await arcExists(nodeA3, nodeB)))
    t.assert.ok(!(await arcExists(nodeB1, nodeA)))
    t.assert.ok(!(await arcExists(nodeB2, nodeA)))
  })
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
