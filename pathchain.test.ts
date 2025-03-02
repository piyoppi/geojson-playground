import { describe, it, type TestContext } from 'node:test'
import { toPathchain } from './pathchain.ts'
import { type Path } from './path.ts'

describe('toPathchain tests', () => {
  it('should return empty array when paths is empty', (t) => {
    const result = toPathchain([])
    t.assert.equal(result.pathchains.length, 0)
    t.assert.equal(result.ends().length, 0)
  })

  it('should correctly identify chain relationships for multiple paths', (t) => {
    const p1: Path = [[0, 0], [1, 1]]
    const p2: Path = [[1, 1], [2, 2]]
    const p3: Path = [[2, 2], [3, 3]]

    const result = toPathchain([p1, p2, p3])

    t.assert.equal(result.pathchains.length, 3)

    const ends = result.ends()
    t.assert.equal(ends.length, 2)

    const p1Chain = result.pathchains[0]
    t.assert.equal(p1Chain.isEnded, true)
    const p1Next = p1Chain.from()()
    t.assert.equal(p1Next.length, 1)
    t.assert.equal(p1Next[0]().path.path, p2)

    const p2Chain = result.pathchains[1]
    t.assert.equal(p2Chain.isEnded, false)
    const p2Next = p2Chain.from()()
    t.assert.equal(p2Next.length, 2)

    const p3Chain = result.pathchains[2]
    t.assert.equal(p3Chain.isEnded, true)
  })

  it('should navigate h', (t: TestContext) => {
    // p1 → p2 → p3
    //      ↓
    //      p4
    const p1: Path = [[0, 0], [1, 0]]
    const p2: Path = [[1, 0], [2, 0]]
    const p3: Path = [[2, 0], [3, 0]]
    const p4: Path = [[1, 0], [1, -1]]

    const result = toPathchain([p1, p2, p3, p4])
    const ends = result.ends()

    const startPath = ends[0]
    t.assert.equal(startPath.isEnded, true)

    const nextPaths = startPath.from()()
    t.assert.equal(nextPaths.length, 2, 'Should have at least one next path')
  })
})
