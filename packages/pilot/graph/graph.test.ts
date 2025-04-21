import { describe, it, type TestContext } from 'node:test'
import { 
  generateNode, 
  generateArc, 
  to, 
  arcExists, 
  mergeNodes,
  connect,
  disconnect,
  findShortestPath,
  GraphNode
} from './graph.ts'

describe('generateNode', () => {
  it('should create a node with empty arcs array', (t: TestContext) => {
    const node = generateNode('node1')
    t.assert.deepStrictEqual(node, { id: 'node1', arcs: [] })
  })
})

describe('generateArc', () => {
  it('should create an arc between two nodes with given cost', (t: TestContext) => {
    const nodeA = generateNode('A')
    const nodeB = generateNode('B')
    const cost = 10
    const arc = generateArc(nodeA, nodeB, cost)

    t.assert.strictEqual(arc.cost, cost)
    t.assert.strictEqual(arc.a.deref(), nodeA)
    t.assert.strictEqual(arc.b.deref(), nodeB)
  })
})

describe('to', () => {
  it('should return the other node in the arc', (t: TestContext) => {
    const nodeA = generateNode('A')
    const nodeB = generateNode('B')
    const arc = generateArc(nodeA, nodeB, 5)

    t.assert.strictEqual(to(nodeA, arc), nodeB)
    t.assert.strictEqual(to(nodeB, arc), nodeA)
  })

  it('should return null if the node is not part of the arc', (t: TestContext) => {
    const nodeA = generateNode('A')
    const nodeB = generateNode('B')
    const nodeC = generateNode('C')
    const arc = generateArc(nodeA, nodeB, 5)

    t.assert.strictEqual(to(nodeC, arc), null)
  })
})

describe('arcExists', () => {
  it('should return true if an arc exists between nodes', (t: TestContext) => {
    const nodeA = generateNode('A')
    const nodeB = generateNode('B')
    const arc = generateArc(nodeA, nodeB, 5)
    nodeA.arcs.push(arc)

    t.assert.strictEqual(arcExists(nodeA, nodeB), true)
  })

  it('should return false if no arc exists between nodes', (t: TestContext) => {
    const nodeA = generateNode('A')
    const nodeB = generateNode('B')
    const nodeC = generateNode('C')
    const arc = generateArc(nodeA, nodeB, 5)
    nodeA.arcs.push(arc)

    t.assert.strictEqual(arcExists(nodeA, nodeC), false)
  })
})

describe('mergeNodes', () => {
  it('should merge nodes and connect arcs properly', (t: TestContext) => {
    // Create test nodes
    const node1 = generateNode('node1')
    const node2 = generateNode('node2')
    const node3 = generateNode('node3')

    // Create arcs
    //           arc1             arc2
    // [node1] ---10--- [node3] ---20--- [node2]
    //    |                                 |
    //    |              arc3               |
    //    '----------------5----------------'
    //
    const arc1 = generateArc(node1, node3, 10)
    const arc2 = generateArc(node2, node3, 20)
    const arc3 = generateArc(node1, node2, 5)
    node1.arcs.push(arc1, arc3)
    node2.arcs.push(arc2, arc3)
    node3.arcs.push(arc1, arc2)

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
    const mergedNode = mergeNodes(node1, node2)
    t.assert.equal(mergedNode.arcs.length, 1)
    t.assert.equal(node3.arcs.length, 3)
    t.assert.deepEqual(mergedNode.arcs[0].cost, 15)
  })

  it('should merge nodes and connect arcs properly', (t: TestContext) => {
    // Create test nodes
    const node1 = generateNode('node1')
    const node2 = generateNode('node2')
    const node3 = generateNode('node3')
    const node4 = generateNode('node4')

    // Create arcs
    //         arc1                arc2
    //    +-----10------[node2]-----20------+
    //    |                                 |
    // [node1]                           [node4]
    //    |                                 |
    //    +-----30------[node3]-----40------+
    //         arc3                arc4
    //
    const arc1 = generateArc(node1, node2, 10)
    const arc2 = generateArc(node2, node4, 20)
    const arc3 = generateArc(node1, node3, 30)
    const arc4 = generateArc(node3, node4, 40)
    node1.arcs.push(arc1, arc3)
    node2.arcs.push(arc2, arc4)
    node3.arcs.push(arc3, arc4)
    node4.arcs.push(arc2, arc4)

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
    const mergedNode = mergeNodes(node2, node3)
    t.assert.equal(mergedNode.arcs.length, 2)
    t.assert.ok([node1, mergedNode].includes(mergedNode.arcs[1].a.deref()))
    t.assert.ok([node1, mergedNode].includes(mergedNode.arcs[1].b.deref()))
    t.assert.ok([node4, mergedNode].includes(mergedNode.arcs[0].a.deref()))
    t.assert.ok([node4, mergedNode].includes(mergedNode.arcs[0].b.deref()))
    t.assert.equal(node1.arcs.length, 3)
    t.assert.equal(node4.arcs.length, 3)
  })

  it('should merge nodes and connect an arc when merged node has an arc that has same cost', (t: TestContext) => {
    // Create test nodes
    const node1 = generateNode('node1')
    const node2 = generateNode('node2')
    const node3 = generateNode('node3')

    // Create arcs
    //           arc1             arc2
    // [node1] ---10--- [node3] ---10--- [node2]
    //    |                                 |
    //    |              arc3               |
    //    '----------------5----------------'
    //
    const arc1 = generateArc(node1, node3, 10)
    const arc2 = generateArc(node2, node3, 10)
    const arc3 = generateArc(node1, node2, 5)
    node1.arcs.push(arc1, arc3)
    node2.arcs.push(arc2, arc3)
    node3.arcs.push(arc1, arc2)

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
    const mergedNode = mergeNodes(node1, node2)
    t.assert.equal(mergedNode.arcs.length, 1)
    t.assert.equal(mergedNode.arcs[0].cost, 10)

    t.assert.equal(node3.arcs.length, 3)
  })

  it('should return an empty node when merging no nodes', (t: TestContext) => {
    const mergedNode = mergeNodes()
    t.assert.equal(mergedNode.arcs.length, 0)
  })
})

describe('disconnect', () => {
  it('should remove arcs between two nodes', (t: TestContext) => {
    const nodeA = generateNode('A')
    const nodeB = generateNode('B')
    const arc = generateArc(nodeA, nodeB, 10)
    
    connect(nodeA, nodeB, arc)
    
    t.assert.strictEqual(nodeA.arcs.length, 1)
    t.assert.strictEqual(nodeB.arcs.length, 1)
    t.assert.strictEqual(arcExists(nodeA, nodeB), true)
    
    disconnect(nodeA, nodeB)
    
    t.assert.strictEqual(nodeA.arcs.length, 0)
    t.assert.strictEqual(nodeB.arcs.length, 0)
    t.assert.strictEqual(arcExists(nodeA, nodeB), false)
  })
  
  it('should not affect other connections when disconnecting specific nodes', (t: TestContext) => {
    const nodeA = generateNode('A')
    const nodeB = generateNode('B')
    const nodeC = generateNode('C')
    
    const arcAB = generateArc(nodeA, nodeB, 10)
    const arcAC = generateArc(nodeA, nodeC, 5)
    
    connect(nodeA, nodeB, arcAB)
    connect(nodeA, nodeC, arcAC)
    
    t.assert.strictEqual(nodeA.arcs.length, 2)
    t.assert.strictEqual(nodeB.arcs.length, 1)
    t.assert.strictEqual(nodeC.arcs.length, 1)
    
    disconnect(nodeA, nodeB)
    
    t.assert.strictEqual(nodeA.arcs.length, 1)
    t.assert.strictEqual(nodeB.arcs.length, 0)
    t.assert.strictEqual(nodeC.arcs.length, 1)
    t.assert.strictEqual(arcExists(nodeA, nodeB), false)
    t.assert.strictEqual(arcExists(nodeA, nodeC), true)
  })
  
  it('should handle case when nodes have no connection', (t: TestContext) => {
    const nodeA = generateNode('A')
    const nodeB = generateNode('B')
    
    t.assert.strictEqual(nodeA.arcs.length, 0)
    t.assert.strictEqual(nodeB.arcs.length, 0)
  })
})

describe('findShortestPath', () => {
  it('should find the shortest path between two directly connected nodes', (t: TestContext) => {
    const nodeA: GraphNode = { id: 'A', arcs: [] }
    const nodeB: GraphNode = { id: 'B', arcs: [] }

    const arc = generateArc(nodeA, nodeB, 5)
    connect(nodeA, nodeB, arc)

    const path = findShortestPath(nodeA, nodeB)
    t.assert.ok(path !== null)
    t.assert.equal(path?.length, 2)
    t.assert.equal(path?.[0].id, 'A')
    t.assert.equal(path?.[1].id, 'B')
  })

  it('should find the shortest path through multiple nodes', (t: TestContext) => {
    const nodeA: GraphNode = { id: 'A', arcs: [] }
    const nodeB: GraphNode = { id: 'B', arcs: [] }
    const nodeC: GraphNode = { id: 'C', arcs: [] }
    const nodeD: GraphNode = { id: 'D', arcs: [] }

    const arcAB = generateArc(nodeA, nodeB, 10)
    const arcAC = generateArc(nodeA, nodeC, 3)
    const arcCD = generateArc(nodeC, nodeD, 2)
    const arcBD = generateArc(nodeB, nodeD, 5)

    connect(nodeA, nodeB, arcAB)
    connect(nodeA, nodeC, arcAC)
    connect(nodeC, nodeD, arcCD)
    connect(nodeB, nodeD, arcBD)

    const path = findShortestPath(nodeA, nodeD)
    t.assert.ok(path !== null)
    t.assert.equal(path?.length, 3)
    t.assert.equal(path?.[0].id, 'A')
    t.assert.equal(path?.[1].id, 'C')
    t.assert.equal(path?.[2].id, 'D')
  })

  it('should return null when no path exists', (t: TestContext) => {
    const nodeA: GraphNode = { id: 'A', arcs: [] }
    const nodeB: GraphNode = { id: 'B', arcs: [] }

    const path = findShortestPath(nodeA, nodeB)
    t.assert.equal(path, null)
  })

  it('should handle a cycle in the graph', (t: TestContext) => {
    const nodeA: GraphNode = { id: 'A', arcs: [] }
    const nodeB: GraphNode = { id: 'B', arcs: [] }
    const nodeC: GraphNode = { id: 'C', arcs: [] }

    const arcAB = generateArc(nodeA, nodeB, 1)
    const arcBC = generateArc(nodeB, nodeC, 1)
    const arcCA = generateArc(nodeC, nodeA, 1)

    connect(nodeA, nodeB, arcAB)
    connect(nodeB, nodeC, arcBC)
    connect(nodeC, nodeA, arcCA)

    const path = findShortestPath(nodeA, nodeC)
    t.assert.ok(path !== null)
    t.assert.equal(path?.length, 2)
    t.assert.equal(path?.[0].id, 'A')
    t.assert.equal(path?.[1].id, 'C')
  })

  it('should return a single node when start and end are the same', (t: TestContext) => {
    const nodeA: GraphNode = { id: 'A', arcs: [] }

    const path = findShortestPath(nodeA, nodeA)
    t.assert.ok(path !== null)
    t.assert.equal(path?.length, 1)
    t.assert.equal(path?.[0].id, 'A')
  })
})
