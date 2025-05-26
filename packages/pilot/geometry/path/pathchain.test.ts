import { describe, it, TestContext } from 'node:test'
import { buildFromInternal, buildPathchain, mergeTIntersection, PathInternal } from './pathchain'
import { type Path } from './index'
import { pathChainWalk } from './walk'

describe('buildPathchain tests', () => {
  it('should return empty array when paths is empty', async (t) => {
    const result = await buildPathchain([])
    t.assert.equal(result.length, 0)
  })

  it('should correctly identify chain relationships for multiple paths', async (t) => {
    const p1: Path = [[0, 0], [1, 1]]
    const p2: Path = [[1, 1], [2, 2]]
    const p3: Path = [[2, 2], [3, 3]]
    const p4: Path = [[2, 2], [3, 2]]

    const results = await buildPathchain([p1, p2, p3, p4])
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
  it('Should correctly merge T intersections', async (t: TestContext) => {
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

    const pathchains = buildFromInternal(pathInternals)
    const visitedPaths: string[] = []
    await pathChainWalk(
      pathchains[0].from(),
      p => {
        visitedPaths.push(p.pathChain.path.flat().join(','))
        return Promise.resolve()
      }
    )
    console.log(visitedPaths)
    t.assert.equal(visitedPaths.length, 3)
    t.assert.ok(visitedPaths.find(p => p === '0,0,5,0'))
    t.assert.ok(visitedPaths.find(p => p === '5,0,10,0'))
    t.assert.ok(visitedPaths.find(p => p === '5,0,5,5'))
  })

  it('Should correctly merge T intersections', async (t: TestContext) => {
    const pathInternals: PathInternal[] = [
      {
        path: [
          [0, 0],
          [2, 0],
        ] as Path,
        index: 0,
        neighbors: [[], [2]],
      },
      {
        path: [
          [5, 5],
          [5, 0],
        ] as Path,
        index: 1,
        neighbors: [[], []],
      },
      {
        path: [
          [2, 0],
          [8, 0],
        ] as Path,
        index: 0,
        neighbors: [[0], [3]],
      },
      {
        path: [
          [8, 0],
          [10, 0],
        ] as Path,
        index: 0,
        neighbors: [[2], []],
      },
    ];

    mergeTIntersection(pathInternals);

    t.assert.equal(pathInternals.length, 5)

    const paths = pathInternals.map(p => p.path.flat().join(','))
    t.assert.ok(paths.find(p => p === '0,0,2,0'))
    t.assert.ok(paths.find(p => p === '2,0,5,0'))
    t.assert.ok(paths.find(p => p === '5,5,5,0'))
    t.assert.ok(paths.find(p => p === '5,0,8,0'))
    t.assert.ok(paths.find(p => p === '8,0,10,0'))

    const pathchains = buildFromInternal(pathInternals)
    const visitedPaths: string[] = []
    await pathChainWalk(
      pathchains[0].from(),
      p => {
        visitedPaths.push(p.pathChain.path.flat().join(','))
        return Promise.resolve()
      }
    )
    t.assert.equal(visitedPaths.length, 5)
    t.assert.ok(visitedPaths.find(p => p === '0,0,2,0'))
    t.assert.ok(visitedPaths.find(p => p === '2,0,5,0'))
    t.assert.ok(visitedPaths.find(p => p === '5,5,5,0'))
    t.assert.ok(visitedPaths.find(p => p === '5,0,8,0'))
    t.assert.ok(visitedPaths.find(p => p === '8,0,10,0'))
  })
})
