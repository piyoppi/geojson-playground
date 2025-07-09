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

describe('buildGraphBuilder (fromNeighborsNode)', () => {
  it('should connect nodes to their nearest neighbors in a line', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' },
      { position: [1, 0], id: 'B' },
      { position: [2, 0], id: 'C' },
      { position: [3, 0], id: 'D' }
    ]

    // Layout:
    //     0     1     2     3     x
    //   0 A --- B --- C --- D
    //
    // Each node tries to connect to its 2 nearest neighbors:
    // A → B, C (distances: 1, 2)
    // B → A, C (distances: 1, 1)
    // C → B, D (distances: 1, 1)
    // D → C, B (distances: 1, 2)
    //
    // Since connections are bidirectional, each node accumulates arcs:
    // A: connected by A→B, A→C, B→A, D→B (but D→B doesn't connect to A)
    // Expected: A connects to B and C, receiving connections from B

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    const nodeById = new Map(nodes.map(n => [n.id, n]))

    // Verify basic structure
    t.assert.equal(nodes.length, 4, 'Should have 4 nodes')

    // Test that adjacent nodes are connected
    const nodeA = nodeById.get('A')
    const nodeB = nodeById.get('B')
    const nodeC = nodeById.get('C')
    const nodeD = nodeById.get('D')

    t.assert.ok(nodeA, 'Node A should exist')
    t.assert.ok(nodeB, 'Node B should exist')
    t.assert.ok(nodeC, 'Node C should exist')
    t.assert.ok(nodeD, 'Node D should exist')

    // Verify key connections exist
    t.assert.equal(await arcExists(nodeA, nodeB), true, 'A should be connected to B')
    t.assert.equal(await arcExists(nodeB, nodeC), true, 'B should be connected to C')
    t.assert.equal(await arcExists(nodeC, nodeD), true, 'C should be connected to D')

    // Verify arc costs match expected squared distances
    // A-B: distance = 1
    // B-C: distance = 1
    // C-D: distance = 1
    // A-C: distance = 2

    const arcAB = await findConnectingArc(nodeA, nodeB)
    const arcBC = await findConnectingArc(nodeB, nodeC)
    const arcCD = await findConnectingArc(nodeC, nodeD)
    const arcAC = await findConnectingArc(nodeA, nodeC)

    t.assert.ok(arcAB, 'Arc A-B should exist')
    t.assert.ok(arcBC, 'Arc B-C should exist')
    t.assert.ok(arcCD, 'Arc C-D should exist')
    t.assert.ok(arcAC, 'Arc A-C should exist')

    t.assert.equal(arcAB!.cost, 1, 'A-B arc cost should be 1')
    t.assert.equal(arcBC!.cost, 1, 'B-C arc cost should be 1')
    t.assert.equal(arcCD!.cost, 1, 'C-D arc cost should be 1')
    t.assert.equal(arcAC!.cost, 2, 'A-C arc cost should be 2')
  })

  it('should handle two points correctly', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' },
      { position: [1, 0], id: 'B' }
    ]

    // Layout:
    //   0 A --- B
    //
    // Each node connects to the other (only 1 neighbor available)
    // A → B, B → A (bidirectional connection)

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const nodeA = nodeById.get('A')
    const nodeB = nodeById.get('B')

    t.assert.ok(nodeA, 'Node A should exist')
    t.assert.ok(nodeB, 'Node B should exist')

    // Both nodes should have connections (bidirectional)
    t.assert.ok(nodeA.arcs.length > 0, 'Node A should have connections')
    t.assert.ok(nodeB.arcs.length > 0, 'Node B should have connections')

    // They should be connected to each other
    t.assert.equal(await arcExists(nodeA, nodeB), true, 'A and B should be connected')

    // Verify arc cost: A-B distance = 1, squared = 1² = 1
    const arcAB = await findConnectingArc(nodeA, nodeB)
    t.assert.ok(arcAB, 'Arc A-B should exist')
    t.assert.equal(arcAB!.cost, 1, 'A-B arc cost should be 1')
  })

  it('should handle single point with no connections', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' }
    ]

    // Layout:
    //   0 A (isolated)
    //
    // Expected: A has no connections (no neighbors available)

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    t.assert.equal(nodes.length, 1)
    t.assert.equal(nodes[0].id, 'A')
    t.assert.equal(nodes[0].arcs.length, 0, 'Single node should have no connections')
  })

  it('should form triangle connections with three points', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' },
      { position: [2, 0], id: 'B' },
      { position: [1, 2], id: 'C' }
    ]

    // Layout:
    //     0     1     2     x
    //   0 A ----------- B
    //   1       |     /
    //   2       |   /
    //          C
    //
    // Distances:
    // A-B: 2, A-C: √5 ≈ 2.24, B-C: √5 ≈ 2.24
    //
    // Each node connects to the other 2 (only 2 neighbors available):
    // A → B, C
    // B → A, C
    // C → A, B
    // Result: Complete triangle with all nodes connected

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    t.assert.equal(nodes.length, 3, 'Should have 3 nodes')

    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const nodeA = nodeById.get('A')
    const nodeB = nodeById.get('B')
    const nodeC = nodeById.get('C')

    t.assert.ok(nodeA, 'Node A should exist')
    t.assert.ok(nodeB, 'Node B should exist')
    t.assert.ok(nodeC, 'Node C should exist')

    // All nodes should be connected to each other (complete triangle)
    t.assert.equal(await arcExists(nodeA, nodeB), true, 'A should be connected to B')
    t.assert.equal(await arcExists(nodeA, nodeC), true, 'A should be connected to C')
    t.assert.equal(await arcExists(nodeB, nodeC), true, 'B should be connected to C')

    // Verify arc costs match expected squared distances
    // A-B: distance = 2, squared = 2² = 4
    // A-C: distance = √5 ≈ 2.24
    // B-C: distance = √5 ≈ 2.24
    const arcAB = await findConnectingArc(nodeA, nodeB)
    const arcAC = await findConnectingArc(nodeA, nodeC)
    const arcBC = await findConnectingArc(nodeB, nodeC)

    t.assert.ok(arcAB, 'Arc A-B should exist')
    t.assert.ok(arcAC, 'Arc A-C should exist')
    t.assert.ok(arcBC, 'Arc B-C should exist')

    t.assert.equal(arcAB!.cost, 2, 'A-B arc cost should be 2')
    t.assert.equal(Math.round(arcAC!.cost * 100), 224, 'A-C arc cost should be ~2.24')
    t.assert.equal(Math.round(arcBC!.cost * 100), 224, 'B-C arc cost should be ~2.24')
  })

  it('should connect based on distance calculation', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' },
      { position: [3, 4], id: 'B' }  // Distance = 5 (3-4-5 triangle)
    ]

    // Layout:
    //     0     1     2     3     x
    //   0 A
    //   1
    //   2
    //   3
    //   4                   B
    //

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    const nodeA = nodes.find(n => n.id === 'A')
    t.assert.ok(nodeA, 'Node A should exist')

    // Should have connection to B
    t.assert.ok(nodeA.arcs.length > 0, 'Node A should have connections')

    // Verify arc cost: A-B distance = √(3² + 4²) = √25 = 5
    const nodeB = nodes.find(n => n.id === 'B')
    t.assert.ok(nodeB, 'Node B should exist')

    const arcAB = await findConnectingArc(nodeA, nodeB!)
    t.assert.ok(arcAB, 'Arc A-B should exist')
    t.assert.equal(arcAB!.cost, 5, 'A-B arc cost should be 5')
  })

  it('should handle grid layout with nearest neighbor selection', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [0, 0], id: 'A' },
      { position: [1, 0], id: 'B' },
      { position: [0, 1], id: 'C' },
      { position: [1, 1], id: 'D' }
    ]

    // Layout:
    //     0     1     x
    //   0 A --- B
    //     |     |
    //   1 C --- D
    //
    // Distances from each point:
    // A: B(1), C(1), D(√2≈1.41) → connects to B, C
    // B: A(1), D(1), C(√2≈1.41) → connects to A, D
    // C: A(1), D(1), B(√2≈1.41) → connects to A, D
    // D: B(1), C(1), A(√2≈1.41) → connects to B, C

    const graphBuilder = buildGraphBuilder(arcGenerator)
    const nodes = await graphBuilder(
      points,
      point => [point.id, { ...point, type: 'Node' }],
      point => point.position
    )

    t.assert.equal(nodes.length, 4, 'Should have 4 nodes')

    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const nodeA = nodeById.get('A')
    const nodeB = nodeById.get('B')
    const nodeC = nodeById.get('C')
    const nodeD = nodeById.get('D')

    if (!nodeA || !nodeB || !nodeC || !nodeD) {
      t.assert.fail('All nodes should exist')
    }

    // Test the nearest neighbor connections
    t.assert.equal(await arcExists(nodeA, nodeB), true, 'A should connect to B (distance 1)')
    t.assert.equal(await arcExists(nodeA, nodeC), true, 'A should connect to C (distance 1)')
    t.assert.equal(await arcExists(nodeB, nodeD), true, 'B should connect to D (distance 1)')
    t.assert.equal(await arcExists(nodeC, nodeD), true, 'C should connect to D (distance 1)')

    // Verify arc costs match expected squared distances
    // A-B, A-C, B-D, C-D: distance = 1, squared = 1² = 1
    const arcAB = await findConnectingArc(nodeA, nodeB)
    const arcAC = await findConnectingArc(nodeA, nodeC)
    const arcBD = await findConnectingArc(nodeB, nodeD)
    const arcCD = await findConnectingArc(nodeC, nodeD)

    t.assert.ok(arcAB, 'Arc A-B should exist')
    t.assert.ok(arcAC, 'Arc A-C should exist')
    t.assert.ok(arcBD, 'Arc B-D should exist')
    t.assert.ok(arcCD, 'Arc C-D should exist')

    t.assert.equal(arcAB!.cost, 1, 'A-B arc cost should be 1')
    t.assert.equal(arcAC!.cost, 1, 'A-C arc cost should be 1')
    t.assert.equal(arcBD!.cost, 1, 'B-D arc cost should be 1')
    t.assert.equal(arcCD!.cost, 1, 'C-D arc cost should be 1')
  })
})
