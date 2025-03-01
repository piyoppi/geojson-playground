import { describe, it } from 'node:test'
import { type Path, pointInPath, pathLength } from './path.ts'

describe('pointInPath', () => {
  const testCases = [
    { point: [3, 4], expectedOrder: 1, expectedDistance: 0 },
    { point: [0, 0], expectedOrder: 0, expectedDistance: 0 },
    { point: [6, 8], expectedOrder: 1, expectedDistance: 5 },
    { point: [1, 1], expectedOrder: null, expectedDistance: null }
  ] as const
  
  testCases.forEach(({ point, expectedOrder, expectedDistance }) => {
    it(`should find the correct point ${point} in path`, (t) => {
      const path: Path = [
        [0, 0],
        [3, 4],
        [6, 8]
      ]
  
      const result = pointInPath(point, path)
      t.assert.equal(result?.order, expectedOrder)
      t.assert.equal(result?.distance, expectedDistance)
    })
  })
})

describe('pathLength', () => {
  it('should calculate the correct path length', (t) => {
    const path: Path = [
      [0, 0],
      [3, 4],
      [6, 8]
    ]

    const length = pathLength(path)
    t.assert.equal(length, 10)
  })
})

