import { describe, it, TestContext } from 'node:test'
import { buildFromInternal, buildPathchain, distanceBetweenVisitedPointOnPathChain, mergeTIntersection, PathChainVisited, PathInternal, PointOnPathchain } from './pathchain'
import { type Path } from './index'
import { pathChainWalk } from './walk'
import path from 'path'

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

describe('distanceBetweenVisitedPointOnPathChain', () => {
  [
    {
      name: 'should calculate distance between two points on the same path',
      paths: [
        [[0, 0], [10, 0]]
      ] satisfies Path[],
      fromDistance: 2,
      toDistance: 8,
      fromPathIndex: 0,
      toPathIndex: 0,
      expected: 6
    },
    {
      name: 'should calculate distance between two points on 2 paths',
      paths: [
        [[0, 0], [10, 0]], [[10, 0], [20, 0]]
      ] satisfies Path[],
      fromDistance: 4,
      toDistance: 8,
      fromPathIndex: 0,
      toPathIndex: 1,
      expected: 14
    },
    {
      name: 'should calculate distance between two points on 3 paths',
      paths: [
        [[0, 0], [10, 0]], [[10, 0], [20, 0]], [[20, 0], [30, 0]]
      ] satisfies Path[],
      fromDistance: 4,
      toDistance: 8,
      fromPathIndex: 0,
      toPathIndex: 2,
      expected: 24
    }
  ].forEach(({ name, paths, fromDistance, toDistance, fromPathIndex, toPathIndex, expected }) => {
    it(name, async (t: TestContext) => {
      const pathChains = await buildPathchain(paths)
      const pathChainList = pathChains[0]

      const fromPathChain = pathChainList.find(p => p.path === paths[fromPathIndex])
      const toPathChain = pathChainList.find(p => p.path === paths[toPathIndex])

      if (!fromPathChain || !toPathChain) return t.assert.fail('')

      const fromPoint: PointOnPathchain = {
        pointOnPath: {
          startIndex: 0,
          path: new WeakRef(paths[fromPathIndex]),
          distance: () => fromDistance
        },
        targetPathChain: new WeakRef(fromPathChain)
      }

      const toPoint: PointOnPathchain = {
        pointOnPath: {
          startIndex: 0,
          path: new WeakRef(paths[toPathIndex]),
          distance: () => toDistance
        },
        targetPathChain: new WeakRef(toPathChain)
      }

      const visitedPathChains: PathChainVisited[] = pathChainList.map(pathChain => ({
        pathChain,
        pathDirection: 'forward' as const
      }))

      const distance = distanceBetweenVisitedPointOnPathChain(visitedPathChains, fromPoint, toPoint)
      t.assert.equal(distance, expected)
    })
  })

  it('Should calculate distance when includes backward paths', async(t: TestContext) => {
    const paths: Path[] = [
      [[10, 0], [0, 0]], [[10, 0], [20, 0]], [[30, 0], [20, 0]]
    ]
    const pathChains = await buildPathchain(paths)
    const pathChainList = pathChains[0]

    const fromPathChain = pathChainList[0]
    const toPathChain = pathChainList[2]

    if (!fromPathChain || !toPathChain) return t.assert.fail('')

    const fromPoint: PointOnPathchain = {
      pointOnPath: {
        startIndex: 0,
        path: new WeakRef(paths[0]),
        distance: () => 7
      },
      targetPathChain: new WeakRef(fromPathChain)
    }

    const toPoint: PointOnPathchain = {
      pointOnPath: {
        startIndex: 0,
        path: new WeakRef(paths[2]),
        distance: () => 4
      },
      targetPathChain: new WeakRef(toPathChain)
    }

    const visitedPathChains: PathChainVisited[] = [
      {
        pathChain: pathChainList[0],
        pathDirection: 'backward'
      },
      {
        pathChain: pathChainList[1],
        pathDirection: 'forward'
      },
      {
        pathChain: pathChainList[2],
        pathDirection: 'backward'
      },
    ]

    const distance = distanceBetweenVisitedPointOnPathChain(visitedPathChains, fromPoint, toPoint)
    t.assert.equal(distance, 23)
  })
})
