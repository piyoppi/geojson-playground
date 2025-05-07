import { describe, it, type TestContext } from 'node:test'
import { fromPathChain } from './fromPathChain'
import { to } from './graph'
import { buildPathchain } from '../geometry/path/pathchain'
import type { Position2D } from '../geojson'
import type { Path } from '../geometry/path'

describe('fromPathChain', () => {
  it('Should return nodes', async (t: TestContext) => {
    const nodes: { position: Position2D, id: string }[] = [
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

    const nodeMap = (await fromPathChain(
      nodes,
      s => Promise.resolve({...s}),
      _ => 'group'
    )(pathChains, pathChains[0].from))
    const node = nodeMap.get('group')?.at(0)

    if (!node) t.assert.fail('Graph should not be null')

    t.assert.strictEqual(node.arcs.length, 2)

    const next1 = to(node, node.arcs[0])
    const next2 = to(node, node.arcs[1])

    if (next1 === null || next2 === null) t.assert.fail('Next should not be null')

    t.assert.ok(['B', 'C'].includes(next1?.id ?? ''))
    t.assert.ok(['B', 'C'].includes(next2?.id ?? ''))
    t.assert.ok([3, 4].includes(next1.arcs[0].cost))
    t.assert.ok([3, 4].includes(next2.arcs[0].cost))

    t.assert.strictEqual(next1.arcs.length, 1)
    t.assert.strictEqual(next2.arcs.length, 1)

    t.assert.ok(to(next1, next1?.arcs[0])?.id === 'A')
    t.assert.ok(to(next2, next2?.arcs[0])?.id === 'A')
  })

  it('Should calculated costs', async (t: TestContext) => {
    const nodes: { position: Position2D, id: string }[] = [
      { position: [0, 0], id: 'AA' },
      { position: [3, 0], id: 'BB' },
      { position: [5, 0], id: 'CC' }
    ]
    //        0     1     2     3     4     5     6
    //
    //     0  A ----+---- * --- B --- * --- C --- *
    //
    const paths: Path[] = [
      [[0, 0], [1, 0], [2, 0]],
      [[2, 0], [4, 0]],
      [[4, 0], [6, 0]]
    ]
    const pathChains = (await buildPathchain(paths))[0]

    const nodeMap = (await fromPathChain(
      nodes,
      s => Promise.resolve({...s}),
      _ => 'group'
    )(pathChains, pathChains[0].from))
    const node = nodeMap.get('group')?.at(0)

    if (!node) t.assert.fail('Graph should not be null')

    t.assert.strictEqual(node.arcs.length, 1)

    const next1 = to(node, node.arcs[0])
    if (next1 === null) t.assert.fail('Next should not be null')

    t.assert.strictEqual(next1.arcs[0].cost, 3)

    const next2 = to(next1, next1.arcs[1])
    if (next2 === null) t.assert.fail('Next should not be null')

    t.assert.strictEqual(next2.arcs[0].cost, 2)
  })
})
