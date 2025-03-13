import { describe, it, type TestContext } from 'node:test'
import { 
  generateNode, 
  generateArc, 
  to, 
  arcExists 
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
