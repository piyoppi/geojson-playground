import { it, describe } from 'node:test'
import {
  normalize,
  distance,
  center,
  innerProduction,
  add,
  subtract,
  length
} from './index.ts'

describe('normalize', () => {
  it('should return a unit vector for a given vector', (t) => {
    t.assert.deepEqual(normalize([3, 4]), [0.6, 0.8])
  })

  it('should return [0, 0] for a zero vector', (t) => {
    t.assert.deepEqual(normalize([0, 0]), [0, 0])
  })

  it('should handle negative values correctly', (t) => {
    t.assert.deepEqual(normalize([-3, -4]), [-0.6, -0.8])
  })
})

describe('distance', () => {
  it('should return 0 for the same points', (t) => {
    t.assert.equal(distance([0, 0], [0, 0]), 0)
  })

  it('should return the correct squared distance for distanceerent points', (t) => {
    t.assert.equal(distance([1, 2], [4, 6]), 25)
  })

  it('should handle negative coordinates correctly', (t) => {
    t.assert.equal(distance([-1, -2], [-4, -6]), 25)
  })
})

describe('center', () => {
  it('should return the center point between two positions', (t) => {
    t.assert.deepEqual(center([[0, 0], [4, 4]]), [2, 2])
  })

  it('should handle negative coordinates', (t) => {
    t.assert.deepEqual(center([[-2, -2], [2, 2]]), [0, 0])
  })

  it('should handle mixed coordinates', (t) => {
    t.assert.deepEqual(center([[-3, 3], [3, -3]]), [0, 0])
  })
})

describe('innerProduction', () => {
  it('should return the correct inner product of two 2D vectors', (t) => {
    t.assert.equal(innerProduction([1, 2], [3, 4]), 11)
  })

  it('should return 0 for orthogonal vectors', (t) => {
    t.assert.equal(innerProduction([1, 0], [0, 1]), 0)
  })

  it('should handle negative values correctly', (t) => {
    t.assert.equal(innerProduction([-1, -2], [3, 4]), -11)
  })
})

describe('add', () => {
  it('should add two Position2D arrays correctly', (t) => {
    t.assert.deepEqual(add([1, 2], [3, 4]), [4, 6])
  })

  it('should handle negative numbers correctly', (t) => {
    t.assert.deepEqual(add([-1, -2], [3, 4]), [2, 2])
  })

  it('should handle zero correctly', (t) => {
    t.assert.deepEqual(add([0, 0], [0, 0]), [0, 0])
  })
})

describe('subtract', () => {
  it('should subtract two Position2D correctly', (t) => {
    t.assert.deepEqual(subtract([5, 7], [3, 2]), [2, 5])
  })

  it('should handle negative results correctly', (t) => {
    t.assert.deepEqual(subtract([2, 3], [5, 7]), [-3, -4])
  })

  it('should handle zero correctly', (t) => {
    t.assert.deepEqual(subtract([0, 0], [0, 0]), [0, 0])
  })
})

describe('length', () => {
  it('should calculate the length of a 2D position vector', (t) => {
    t.assert.equal(length([3, 4]), 5)
  })

  it('should calculate the length of a zero vector', (t) => {
    t.assert.equal(length([0, 0]), 0)
  })

  it('should calculate the length of a negative vector', (t) => {
    t.assert.equal(length([-3, -4]), 5)
  })
})
