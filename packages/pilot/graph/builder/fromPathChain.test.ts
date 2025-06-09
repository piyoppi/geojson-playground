import { describe, it, type TestContext } from 'node:test'
import { buildGraphBuilder } from './fromPathChain'
import { to, type GraphNode } from '../graph'
import { buildPathchain, ends } from '../../geometry/path/pathchain'
import type { Position2D } from '../../geometry/index'
import type { Path } from '../../geometry/path/index'
import { ArcGenerator } from '../arc/index'

type TestDataPoint = {position: Position2D, id: string }
type TestDataNode = TestDataPoint & { type: 'Node' }
type TestDataJunctionNode = {}

const arcGenerator: ArcGenerator<TestDataNode | TestDataJunctionNode> = (a, b, cost) => ({
  a: () => Promise.resolve(a),
  b: () => Promise.resolve(b),
  cost
})

// Helper function to find arc between two specific nodes
const findArcBetween = async (fromNode: GraphNode<TestDataNode | TestDataJunctionNode>, toNodeId: string) => {
  for (const arc of fromNode.arcs) {
    const targetNode = await arc.b()
    if (targetNode?.id === toNodeId) {
      return arc
    }
    const sourceNode = await arc.a()
    if (sourceNode?.id === toNodeId) {
      return arc
    }
  }
  throw new Error(`No arc found between ${fromNode.id} and ${toNodeId}`)
}

describe('buildGraphBuilder', () => {
  it('Should return nodes', async (t: TestContext) => {
    const points: TestDataPoint[] = [
      { position: [1, 0], id: 'A' },
      { position: [5, 0], id: 'B' },
      { position: [2, 2], id: 'C' }
    ]
    //                 1        3 
    //              |<--->|<-- ... -->|
    //        0     1     2    ...    5     6
    //                            
    //     0  * --- A --- * -- ... -- B --- *
    //                    |
    //     1              |
    //                    |
    //     2              C
    //
    const paths: Path[] = [
      [[0, 0], [1, 0], [2, 0]],
      [[2, 0], [2, 2]],
      [[2, 0], [6, 0]]
    ]
    const pathChains = (await buildPathchain(paths))[0]
    const fromPathChain = buildGraphBuilder(arcGenerator)
    const end = ends(pathChains)[0]

    const nodeByGroup = await fromPathChain(
      points,
      pathChains,
      end.from,
      s => Promise.resolve([s.id, {...s, type: 'Node' }]),
      j => Promise.resolve([`${j[0]}-${j[1]}`, {type: 'Junction'}]),
      _ => 'group'
    )

    // expected:
    //
    //  X : Junction
    //
    //  A --- X --- B
    //        |
    //        C

    const nodeById = new Map(nodeByGroup.get('group')?.map(n => [n.id, n]))

    const nodeA = nodeById.get('A')
    t.assert.ok(nodeA, 'nodeA should exist')

    t.assert.strictEqual(nodeA.arcs.length, 1)
    t.assert.strictEqual(1, nodeA.arcs[0].cost)

    const junction = await to(nodeA, nodeA.arcs[0])
    t.assert.ok(junction, 'junction should exist')

    t.assert.strictEqual(3, junction.arcs.length)

    const [a, b, c] = [
      await to(junction, junction.arcs[0]),
      await to(junction, junction.arcs[1]),
      await to(junction, junction.arcs[2])
    ].sort((a, b) => (a?.id.charCodeAt(0) || 0) - (b?.id.charCodeAt(0) || 0))

    t.assert.ok(a, 'Node a should exist')
    t.assert.ok(b, 'Node b should exist')
    t.assert.ok(c, 'Node c should exist')

    t.assert.equal('A', a.id)
    t.assert.equal('B', b.id)
    t.assert.equal('C', c.id)

    t.assert.strictEqual(a.arcs.length, 1)
    t.assert.strictEqual(b.arcs.length, 1)
    t.assert.strictEqual(c.arcs.length, 1)

    // A at [1, 0] → Junction at [2, 0]: distance = 1
    // Junction at [2, 0] → B at [5, 0]: distance = 3
    // Junction at [2, 0] → C at [2, 2]: distance = 2
    
    const junctionId = junction.id
    const arcAToJunction = await findArcBetween(a, junctionId)
    const arcJunctionToB = await findArcBetween(junction, b.id)
    const arcJunctionToC = await findArcBetween(junction, c.id)

    t.assert.equal(arcAToJunction.cost, 1, 'A to Junction arc cost should be 1')
    t.assert.equal(arcJunctionToB.cost, 3, 'Junction to B arc cost should be 3') 
    t.assert.equal(arcJunctionToC.cost, 2, 'Junction to C arc cost should be 2')
  })
})
