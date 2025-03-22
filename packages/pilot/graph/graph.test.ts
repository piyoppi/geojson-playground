import { describe, it, type TestContext } from 'node:test'
import { 
  generateNode, 
  generateArc, 
  to, 
  arcExists, 
  mergeNodes,
  connect,
  disconnect
} from './graph.ts'

describe('generateNode', () => {
  it('should create a node with empty arcs array', (t: TestContext) => {
    const node = generateNode()
    t.assert.deepStrictEqual(node, { arcs: [] })
  })
})

describe('generateArc', () => {
  it('should create an arc between two nodes with given cost', (t: TestContext) => {
    const nodeA = generateNode()
    const nodeB = generateNode()
    const cost = 10
    const arc = generateArc(nodeA, nodeB, cost)

    t.assert.strictEqual(arc.cost, cost)
    t.assert.strictEqual(arc.a.deref(), nodeA)
    t.assert.strictEqual(arc.b.deref(), nodeB)
  })
})

describe('to', () => {
  it('should return the other node in the arc', (t: TestContext) => {
    const nodeA = generateNode()
    const nodeB = generateNode()
    const arc = generateArc(nodeA, nodeB, 5)

    t.assert.strictEqual(to(nodeA, arc), nodeB)
    t.assert.strictEqual(to(nodeB, arc), nodeA)
  })

  it('should return null if the node is not part of the arc', (t: TestContext) => {
    const nodeA = generateNode()
    const nodeB = generateNode()
    const nodeC = generateNode()
    const arc = generateArc(nodeA, nodeB, 5)

    t.assert.strictEqual(to(nodeC, arc), null)
  })
})

describe('arcExists', () => {
  it('should return true if an arc exists between nodes', (t: TestContext) => {
    const nodeA = generateNode()
    const nodeB = generateNode()
    const arc = generateArc(nodeA, nodeB, 5)
    nodeA.arcs.push(arc)

    t.assert.strictEqual(arcExists(nodeA, nodeB), true)
  })

  it('should return false if no arc exists between nodes', (t: TestContext) => {
    const nodeA = generateNode()
    const nodeB = generateNode()
    const nodeC = generateNode()
    const arc = generateArc(nodeA, nodeB, 5)
    nodeA.arcs.push(arc)

    t.assert.strictEqual(arcExists(nodeA, nodeC), false)
  })
})

describe('mergeNodes', () => {
  it('should merge nodes and connect arcs properly', (t: TestContext) => {
    // Create test nodes
    const node1 = generateNode()
    const node2 = generateNode()
    const node3 = generateNode()

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
    console.log(mergedNode.arcs)
    t.assert.equal(mergedNode.arcs.length, 1)
    t.assert.equal(node3.arcs.length, 3)
    t.assert.deepEqual(mergedNode.arcs[0].cost, 15)
  })

  it('should merge nodes and connect an arc when merged node has an arc that has same cost', (t: TestContext) => {
    // Create test nodes
    const node1 = generateNode()
    const node2 = generateNode()
    const node3 = generateNode()

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
    const nodeA = generateNode()
    const nodeB = generateNode()
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
    const nodeA = generateNode()
    const nodeB = generateNode()
    const nodeC = generateNode()
    
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
    const nodeA = generateNode()
    const nodeB = generateNode()
    
    t.assert.strictEqual(nodeA.arcs.length, 0)
    t.assert.strictEqual(nodeB.arcs.length, 0)
  })
})
