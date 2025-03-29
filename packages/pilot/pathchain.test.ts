import { describe, it, TestContext } from 'node:test'
import { buildFromInternal, buildPathchain, mergeTIntersection, PathInternal } from './pathchain'
import { type Path } from './path'
import { pathChainWalk } from './walk'

describe('buildPathchain tests', () => {
  it('should return empty array when paths is empty', (t) => {
    const result = buildPathchain([])
    t.assert.equal(result.length, 0)
  })

  it('should correctly identify chain relationships for multiple paths', (t) => {
    const p1: Path = [[0, 0], [1, 1]]
    const p2: Path = [[1, 1], [2, 2]]
    const p3: Path = [[2, 2], [3, 3]]
    const p4: Path = [[2, 2], [3, 2]]

    const results = buildPathchain([p1, p2, p3, p4])
    t.assert.equal(results.length, 1)

    const result = results[0]
    t.assert.equal(result.length, 4)

    const p1Chain = result[0]
    t.assert.equal(p1Chain.isEnded, true)

    const p1Next = p1Chain.from()().next()[0]()
    t.assert.equal(p1Next.pathChain.path, p2)

    const p2Chain = result[1]
    t.assert.equal(p2Chain.isEnded, false)
    const p2Nexts = p1Next.next()
    t.assert.equal(p2Nexts[0]().pathChain.path, p3)
    t.assert.equal(p2Nexts[1]().pathChain.path, p4)
  })
})

describe('mergeTIntersection', () => {
  it('Should correctly merge T intersections', (t: TestContext) => {
    const pathInternals: PathInternal[] = [
      {
        path: [
          [0, 0],
          [10, 0],
        ] as Path,
        index: 0,
        neighbors: [[], []],
      },
      {
        path: [
          [5, 0],
          [5, 5],
        ] as Path,
        index: 1,
        neighbors: [[], []],
      }
    ];

    mergeTIntersection(pathInternals);

    t.assert.equal(pathInternals.length, 3)

    const paths = pathInternals.map(p => p.path.flat().join(','))
    t.assert.ok(paths.find(p => p === '0,0,5,0'))
    t.assert.ok(paths.find(p => p === '5,0,10,0'))
    t.assert.ok(paths.find(p => p === '5,0,5,5'))

    console.log(pathInternals.map(p => p.neighbors))
    const pathchains = buildFromInternal(pathInternals)
    
    const visitedPaths: string[] = []
    pathChainWalk(pathchains[0].from(), p => visitedPaths.push(p.path.flat().join(',')))
    console.log(visitedPaths)
    t.assert.equal(visitedPaths.length, 3)
    t.assert.ok(visitedPaths.find(p => p === '0,0,5,0'))
    t.assert.ok(visitedPaths.find(p => p === '5,0,10,0'))
    t.assert.ok(visitedPaths.find(p => p === '5,0,5,5'))
  })
})
