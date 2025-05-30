import { describe, it, type TestContext } from 'node:test'
import { buildGraphBuilder } from './fromPathChain'
import { to } from './graph'
import { buildPathchain, ends } from '../geometry/path/pathchain'
import type { Position2D } from '../geojson'
import type { Path } from '../geometry/path'
import { ArcGenerator } from './arc'

type TestDataNode = { position: Position2D, id: string }

const arcGenerator: ArcGenerator<TestDataNode> = (a, b, cost) => ({
  a: () => Promise.resolve(a),
  b: () => Promise.resolve(b),
  cost
})

describe('buildGraphBuilder', () => {
  it('Should return nodes', async (t: TestContext) => {
    const nodes: TestDataNode[] = [
      { position: [1, 0], id: 'A' },
      { position: [5, 0], id: 'B' },
      { position: [2, 2], id: 'C' }
    ]
    //        0    1    2    ..    5    6
    //
    //     0  * -- A -- * -- .. -- B -- *
    //                  |
    //     1            |
    //                  |
    //     2            C
    //
    const paths: Path[] = [
      [[0, 0], [1, 0], [2, 0]],
      [[2, 0], [2, 2]],
      [[2, 0], [6, 0]]
    ]
    const pathChains = (await buildPathchain(paths))[0]
    const fromPathChain = buildGraphBuilder(arcGenerator)
    const end = ends(pathChains)[0]

    const nodeMap = await fromPathChain(
      nodes,
      pathChains,
      end.from,
      s => Promise.resolve([s.id, {...s}]),
      _ => 'group'
    )

    // expected:
    //
    //  A ------- B
    //  |         |
    //  |         |
    //  *--- C ---*

    const node = nodeMap.get('group')?.at(0)
    if (!node) t.assert.fail('Graph should not be null')

    t.assert.strictEqual(node.arcs.length, 2)
    t.assert.ok([3, 4].includes(node.arcs[0].cost))
    t.assert.ok([3, 4].includes(node.arcs[1].cost))

    const [b, c] = [
      await to(node, node.arcs[0]),
      await to(node, node.arcs[1])
    ].sort((a, b) => (a?.id.charCodeAt(0) || 0) - (b?.id.charCodeAt(0) || 0))

    if (b === null || c === null) t.assert.fail('Next should not be null')

    t.assert.equal('B', b.id)
    t.assert.equal('C', c.id)

    t.assert.strictEqual(b.arcs.length, 2)
    t.assert.ok([4, 5].includes(b.arcs[0].cost))
    t.assert.ok([4, 5].includes(b.arcs[1].cost))

    t.assert.strictEqual(c.arcs.length, 2)
    t.assert.ok([3, 5].includes(c.arcs[0].cost))
    t.assert.ok([3, 5].includes(c.arcs[1].cost))
  })
})
