import { describe, it, type TestContext } from 'node:test'
import { walk } from './graphwalk'
import type { GraphNode, Arc } from './graph'

describe('walk function', () => {
  const createNode = (id: string): GraphNode & { id: string } => ({ id, arcs: [] })

  const connect = (a: GraphNode & { id: string }, b: GraphNode & { id: string }, cost = 1): void => {
    const arcAB: Arc = {
      cost,
      a: new WeakRef(a),
      b: new WeakRef(b)
    }
    
    a.arcs.push(arcAB)
    b.arcs.push(arcAB)
  }

  it('visits all nodes in a simple graph', (t: TestContext) => {
    //    A
    //   /
    //  B---C
    //  |   |
    //  D   E
    const nodeA = createNode('A')
    const nodeB = createNode('B')
    const nodeC = createNode('C')
    const nodeD = createNode('D')
    const nodeE = createNode('E')
    
    connect(nodeA, nodeB)
    connect(nodeB, nodeC)
    connect(nodeB, nodeD)
    connect(nodeC, nodeE)
    
    const visited: string[] = []
    const paths: Array<{from: string, to: string}> = []
    
    walk(nodeA, (current, from) => {
      visited.push(current.id)
      paths.push({from: from.id, to: current.id})
    })

    t.assert.equal(visited.length, 4)
    t.assert.ok(visited.includes('B'))
    t.assert.ok(visited.includes('C'))
    t.assert.ok(visited.includes('D'))
    t.assert.ok(visited.includes('E'))
  })

  it('handles cycles properly', (t: TestContext) => {
    //  A -- B
    //  |    |
    //  C -- D
    const nodeA = createNode('A')
    const nodeB = createNode('B')
    const nodeC = createNode('C')
    const nodeD = createNode('D')
    
    connect(nodeA, nodeB)
    connect(nodeA, nodeC)
    connect(nodeB, nodeD)
    connect(nodeC, nodeD)
    
    const visited: string[] = []
    
    walk(nodeA, (current) => visited.push(current.id))
    
    t.assert.ok(visited.includes('B'))
    t.assert.ok(visited.includes('C'))
    t.assert.ok(visited.includes('D'))
    t.assert.ok(visited.includes('A'))
    
    const counts = visited.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    t.assert.equal(counts['B'], 1)
    t.assert.equal(counts['C'], 1)
    t.assert.equal(counts['D'], 1)
  })

  it('handles empty graph', (t) => {
    const singleNode: GraphNode & { id: string } = { id: 'alone', arcs: [] }
    let callCount = 0
    
    walk(singleNode, () => {
      callCount++
    })
    
    t.assert.equal(callCount, 0)
  })
})
