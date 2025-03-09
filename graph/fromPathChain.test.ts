import { describe, it, type TestContext } from 'node:test'
import { fromPathChain } from './fromPathChain.ts'
import { to } from './graph.ts'
import { toPathchain } from '../pathchain.ts'
import type { Position2D } from '../geojson.ts'
import type { Path } from '../path.ts'

describe('fromPathChain', () => {
  it('Should return nodes', (t: TestContext) => {
    const nodes: { position: Position2D, id: string }[] = [
      { position: [1, 0], id: 'A' },
      { position: [5, 0], id: 'B' },
      { position: [2, 2], id: 'C' }
    ]

    //  A --- + --- + -- B -- ]
    //        |
    //        C
    const paths: Path[] = [
      [[0, 0], [1, 0], [2, 0]],
      [[2, 0], [2, 2]],
      [[2, 0], [6, 0]]
    ]
    const pathChain = toPathchain(paths).ends()[0]

    const graph = fromPathChain(nodes, (s) => ({...s}))(pathChain)

    if (graph === null) t.assert.fail('Graph should not be null')

    t.assert.strictEqual(graph.arcs.length, 2)

    const next1 = to(graph, graph.arcs[0])
    const next2 = to(graph, graph.arcs[1])

    if (next1 === null || next2 === null) t.assert.fail('Next should not be null')

    t.assert.ok(['B', 'C'].includes(next1?.id ?? ''))
    t.assert.ok(['B', 'C'].includes(next2?.id ?? ''))

    t.assert.strictEqual(next1.arcs.length, 1)
    t.assert.strictEqual(next2.arcs.length, 1)

    t.assert.ok(to(next1, next1?.arcs[0])?.id === 'A')
    t.assert.ok(to(next2, next2?.arcs[0])?.id === 'A')
  })
})
