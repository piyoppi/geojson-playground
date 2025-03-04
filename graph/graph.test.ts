import { describe, it, type TestContext } from 'node:test'
import { fromPathChain, to } from './graph.ts'
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

    t.assert.equal(to(graph, graph.arcs[0])?.id, 'C')
    t.assert.equal(to(graph, graph.arcs[1])?.id, 'B')
  })
})
