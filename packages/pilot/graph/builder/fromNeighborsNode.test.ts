import { describe, it, type TestContext } from 'node:test'
import { buildGraphBuilder } from './fromNeighborsNode.js'
import { arcExists, findConnectingArc } from '../graph.js'
import type { Position2D } from '../../geometry/index.js'
import type { ArcGenerator } from '../arc/index.js'

type TestDataPoint = { position: Position2D, id: string }
type TestDataNode = TestDataPoint & { type: 'Node' }

const arcGenerator: ArcGenerator<TestDataNode> = (a, b, cost) => ({
  a: () => Promise.resolve(a),
  b: () => Promise.resolve(b),
  cost
})

describe('buildGraphBuilder (fromNeighborsNode) - Minimum Spanning Tree', () => {
  it('should create MST for line configuration', async (t: TestContext) => {

    // A -- 1 -- B -- 1 -- C -- 1 -- D
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' },
      { position: [1, 0], id: 'B' },
      { position: [2, 0], id: 'C' },
      { position: [3, 0], id: 'D' }
    ]

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const nodeA = nodeById.get('A')!
    const nodeB = nodeById.get('B')!
    const nodeC = nodeById.get('C')!
    const nodeD = nodeById.get('D')!

    t.assert.equal(await arcExists(nodeA, nodeB), true, 'A-B should be connected')
    t.assert.equal(await arcExists(nodeB, nodeC), true, 'B-C should be connected')
    t.assert.equal(await arcExists(nodeC, nodeD), true, 'C-D should be connected')

    t.assert.equal(await arcExists(nodeA, nodeC), false, 'A-C should not be connected')
    t.assert.equal(await arcExists(nodeA, nodeD), false, 'A-D should not be connected')
    t.assert.equal(await arcExists(nodeB, nodeD), false, 'B-D should not be connected')
  })

  it('should create MST for triangle', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' },
      { position: [3, 0], id: 'B' },
      { position: [0, 4], id: 'C' }
    ]

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const nodeA = nodeById.get('A')!
    const nodeB = nodeById.get('B')!
    const nodeC = nodeById.get('C')!

    t.assert.equal(await arcExists(nodeA, nodeB), true, 'A-B should be connected')
    t.assert.equal(await arcExists(nodeA, nodeC), true, 'A-C should be connected')
    t.assert.equal(await arcExists(nodeB, nodeC), false, 'B-C should not be connected (longest edge)')

    const arcAB = await findConnectingArc(nodeA, nodeB)
    const arcAC = await findConnectingArc(nodeA, nodeC)
    t.assert.equal(arcAB?.cost, 3, 'A-B cost should be 3')
    t.assert.equal(arcAC?.cost, 4, 'A-C cost should be 4')
  })

  it('should handle single node', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' }
    ]

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    t.assert.equal(nodes.length, 1, 'Should have 1 node')
    t.assert.equal(nodes[0].arcs.length, 0, 'Single node should have no arcs')
  })

  it('should handle two nodes', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' },
      { position: [5, 0], id: 'B' }
    ]

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const nodeA = nodeById.get('A')!
    const nodeB = nodeById.get('B')!

    t.assert.equal(await arcExists(nodeA, nodeB), true, 'A-B should be connected')

    const arcAB = await findConnectingArc(nodeA, nodeB)
    t.assert.equal(arcAB?.cost, 5, 'A-B cost should be 5')
  })

  it('should create MST for square configuration', async (t: TestContext) => {
    const points: TestDataPoint[] = [

    // C -- 1 -- D
    // |         |
    // 1         1
    // |         |
    // A -- 1 -- B
      { position: [0, 0], id: 'A' },
      { position: [1, 0], id: 'B' },
      { position: [0, 1], id: 'C' },
      { position: [1, 1], id: 'D' }
    ]

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    const totalEdges = nodes.reduce((sum, node) => sum + node.arcs.length, 0)
    t.assert.equal(totalEdges / 2, 3, 'MST should have exactly 3 edges')

    // All edges in MST should have cost 1 (no diagonals)
    for (const node of nodes) {
      for (const arc of node.arcs) {
        t.assert.equal(arc.cost, 1, 'All MST edges should have cost 1')
      }
    }
  })
})
