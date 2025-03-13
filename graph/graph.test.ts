import { describe, it, type TestContext } from 'node:test'
import { 
  generateNode, 
  generateArc, 
  to, 
  arcExists, 
  mergeNodes
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

    const mergedNode = mergeNodes(node1, node2)
    t.assert.equal(mergedNode.arcs.length, 2)

    t.assert.equal(node3.arcs.length, 4)

    const arcsToNode3 = mergedNode.arcs.filter(arc =>
      (arc.a.deref() === mergedNode && arc.b.deref() === node3) ||
      (arc.a.deref() === node3 && arc.b.deref() === mergedNode)
    )
    t.assert.equal(arcsToNode3.length, 2)
    t.assert.deepEqual(arcsToNode3.map(arc => arc.cost).sort(), [10, 20])
  })

  it('should return an empty node when merging no nodes', (t: TestContext) => {
    const mergedNode = mergeNodes()
    t.assert.equal(mergedNode.arcs.length, 0)
  })
})
