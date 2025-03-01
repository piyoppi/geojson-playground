import { describe, it } from 'node:test'
import { toPathchain } from './pathchain.ts'
import { type Path } from './path.ts'

describe('toPathchain', () => {
  it('should create pathchains from paths', (t) => {
    const paths: Path[] = [
      [[0, 0], [1, 1]],
      [[1, 1], [2, 2]],
      [[2, 2], [3, 3]]
    ]

    const { pathchains, ends } = toPathchain(paths)

    t.assert.equal(pathchains.length, 3)
    t.assert.equal(ends().length, 2)

    const firstPathChain = pathchains[0]
    t.assert.equal(firstPathChain.isEnded, true)
    t.assert.equal(firstPathChain.path, paths[0])

    const lastPathChain = pathchains[2]
    t.assert.equal(lastPathChain.isEnded, true)
    t.assert.equal(lastPathChain.path, paths[2])
  })

  const testCases = [
    {
      point: [1, 1],
      expectedPathchainIndex: 0,
      expectedOrder: 0,
      expectedDistance: '1.41421'
    },
    {
      point: [1.5, 1.5],
      expectedPathchainIndex: 1,
      expectedOrder: 0,
      expectedDistance: '0.70711'
    }
  ] as const

  testCases.forEach(({ point, expectedPathchainIndex, expectedOrder, expectedDistance }) => {
    it(`should find point ${point} in pathchains`, (t) => {
      const paths: Path[] = [
        [[0, 0], [1, 1]],
        [[1, 1], [2, 2]],
        [[2, 2], [3, 3]]
      ];

      const { pathchains } = toPathchain(paths);
      const findPoint = pathchains[0].findPointInPathChain();

      const pointInPathchain = findPoint(point);
      t.assert.equal(pointInPathchain?.pathchain.deref(), pathchains[expectedPathchainIndex]);
      t.assert.equal(pointInPathchain?.pointInPath.order, expectedOrder);
      t.assert.equal(pointInPathchain?.pointInPath.distance.toFixed(5), expectedDistance);
    });
  });
})
