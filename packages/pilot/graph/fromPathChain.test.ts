import { describe, it, type TestContext } from 'node:test'
import { buildGraphBuilder } from './fromPathChain'
import { to } from './graph'
import { buildPathchain, ends } from '../geometry/path/pathchain'
import type { Position2D } from '../geojson'
import type { Path } from '../geometry/path/index'
import { ArcGenerator } from './arc/index'

type TestDataPoint = {position: Position2D, id: string }
type TestDataNode = TestDataPoint & { type: 'Node' }
type TestDataJunctionNode = {}

const arcGenerator: ArcGenerator<TestDataNode | TestDataJunctionNode> = (a, b, cost) => ({
  a: () => Promise.resolve(a),
  b: () => Promise.resolve(b),
  cost
})

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
    if (!nodeA) t.assert.fail('nodeA should not be null')

    t.assert.strictEqual(nodeA.arcs.length, 1)
    //t.assert.strictEqual(1, nodeA.arcs[0].cost)

    const junction = await to(nodeA, nodeA.arcs[0])
    if (!junction) t.assert.fail('junction should not be null')

    t.assert.strictEqual(3, junction.arcs.length)

    const [a, b, c] = [
      await to(junction, junction.arcs[0]),
      await to(junction, junction.arcs[1]),
      await to(junction, junction.arcs[2])
    ].sort((a, b) => (a?.id.charCodeAt(0) || 0) - (b?.id.charCodeAt(0) || 0))

    if (a === null || b === null || c === null) t.assert.fail('Next should not be null')

    t.assert.equal('A', a.id)
    t.assert.equal('B', b.id)
    t.assert.equal('C', c.id)

    t.assert.strictEqual(a.arcs.length, 1)
    t.assert.strictEqual(b.arcs.length, 1)
    t.assert.strictEqual(c.arcs.length, 1)
  })
})
