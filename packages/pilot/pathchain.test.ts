import { describe, it } from 'node:test'
import { toPathchain } from './pathchain'
import { type Path } from './path'

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
    const p4: Path = [[2, 2], [3, 2]]

    const result = toPathchain([p1, p2, p3, p4])

    t.assert.equal(result.pathchains.length, 4)

    const ends = result.ends()
    t.assert.equal(ends.length, 3)

    const p1Chain = result.pathchains[0]
    t.assert.equal(p1Chain.isEnded, true)

    const p1Next = p1Chain.from()().next()[0]()
    t.assert.equal(p1Next.path.path, p2)

    const p2Chain = result.pathchains[1]
    t.assert.equal(p2Chain.isEnded, false)
    const p2Nexts = p1Next.next()
    t.assert.equal(p2Nexts[0]().path.path, p3)
    t.assert.equal(p2Nexts[1]().path.path, p4)
  })
})
