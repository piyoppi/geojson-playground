import { describe, it } from 'node:test'
import { pathLength, type Path } from './index'
import { checkPointOnPath } from './pointInPath'

describe('pointInPath', () => {
  const testCases = [
    { point: [3, 4], expectedIndex: 1, expectedDistance: Math.sqrt(3**2 + 4**2) },
    { point: [0, 0], expectedIndex: 0, expectedDistance: 0 },
    { point: [6, 8], expectedIndex: 1, expectedDistance: Math.sqrt(3**2 + 4**2) + Math.sqrt((6-3)**2 + (8-4)**2) },
    { point: [7, 8], expectedIndex: 2, expectedDistance: Math.sqrt(3**2 + 4**2) + Math.sqrt((6-3)**2 + (8-4)**2) + 1 },
    { point: [1, 1], expectedIndex: null, expectedDistance: null }
  ] as const
  
  testCases.forEach(({ point, expectedIndex: expectedIndex, expectedDistance }) => {
    it(`should find the correct point ${point} in path`, (t) => {
      const path: Path = [
        [0, 0],
        [3, 4],
        [6, 8],
        [8, 8]
      ]
  
      const result = checkPointOnPath(point, path)
      t.assert.equal(result?.startIndex, expectedIndex)
      t.assert.equal(result?.distance(), expectedDistance)
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
