import { describe, it, TestContext } from 'node:test'
import { GraphNode, connect } from './graph'
import { serialize, deserialize } from './serialize'
import type { ArcGenerator } from './arc/index'

const graphs = () => {
  const nodeA: GraphNode = { id: 'A', arcs: [] }
  const nodeB: GraphNode = { id: 'B', arcs: [] }
  const nodeC: GraphNode = { id: 'C', arcs: [] }

  const generateArc: ArcGenerator = (a, b, cost) => ({
    a: () => Promise.resolve(a),
    b: () => Promise.resolve(b),
    cost
  })
  
  const arcAB = generateArc(nodeA, nodeB, 10)
  const arcBC = generateArc(nodeB, nodeC, 20)
  const arcCA = generateArc(nodeC, nodeA, 30)
  
  connect(nodeA, nodeB, arcAB)
  connect(nodeB, nodeC, arcBC)
  connect(nodeC, nodeA, arcCA)
  
  return [nodeA, nodeB, nodeC]
}

describe('Graph serialization and deserialization', () => {
  it('should serialize and deserialize a basic graph', (t: TestContext) => {
    const serialized = serialize(graphs())
    
    t.assert.equal(serialized.nodes.length, 3)
    t.assert.equal(serialized.arcs.length, 3)
    t.assert.deepEqual(serialized.nodes.map(n => n.nodeId).sort(), ['A', 'B', 'C'])
    
    const arcABSerialized = serialized.arcs.find(a => 
      (a.aNodeId === 'A' && a.bNodeId === 'B') || (a.aNodeId === 'B' && a.bNodeId === 'A'))
    const arcBCSerialized = serialized.arcs.find(a => 
      (a.aNodeId === 'B' && a.bNodeId === 'C') || (a.aNodeId === 'C' && a.bNodeId === 'B'))
    const arcCASerialized = serialized.arcs.find(a => 
      (a.aNodeId === 'C' && a.bNodeId === 'A') || (a.aNodeId === 'A' && a.bNodeId === 'C'))
    
    t.assert.ok(arcABSerialized)
    t.assert.ok(arcBCSerialized)
    t.assert.ok(arcCASerialized)
    t.assert.equal(arcABSerialized?.arcCost, '10')
    t.assert.equal(arcBCSerialized?.arcCost, '20')
    t.assert.equal(arcCASerialized?.arcCost, '30')

    const deserialized = deserialize(serialized)
    t.assert.equal(deserialized.length, 3)
    
    const findNodeById = (id: string) => deserialized.find(n => n.id === id)
    
    const nodeADeserialized = findNodeById('A')
    const nodeBDeserialized = findNodeById('B')
    const nodeCDeserialized = findNodeById('C')
    
    t.assert.ok(nodeADeserialized)
    t.assert.ok(nodeBDeserialized)
    t.assert.ok(nodeCDeserialized)
    
    t.assert.equal(nodeADeserialized?.arcs.length, 2)
    t.assert.equal(nodeBDeserialized?.arcs.length, 2)
    t.assert.equal(nodeCDeserialized?.arcs.length, 2)
    
    const hasArcBetween = (a: GraphNode, b: GraphNode) => {
      return a.arcs.some(async arc => {
        const [nodeA, nodeB] = await Promise.all([arc.a(), arc.b()])
        return (nodeA === a && nodeB === b) || (nodeA === b && nodeB === a)
      })
    }
    
    t.assert.ok(hasArcBetween(nodeADeserialized!, nodeBDeserialized!))
    t.assert.ok(hasArcBetween(nodeBDeserialized!, nodeCDeserialized!))
    t.assert.ok(hasArcBetween(nodeCDeserialized!, nodeADeserialized!))
  })
  
  it('should serialize and deserialize an empty graph', (t) => {
    const serialized = serialize([])
    t.assert.equal(serialized.nodes.length, 0)
    t.assert.equal(serialized.arcs.length, 0)
    
    const deserialized = deserialize(serialized)
    t.assert.equal(deserialized.length, 0)
  })
  
  it('should serialize and deserialize nodes without connections', (t) => {
    const nodeA: GraphNode = { id: 'A', arcs: [] }
    const nodeB: GraphNode = { id: 'B', arcs: [] }
    
    const serialized = serialize([nodeA, nodeB])
    t.assert.equal(serialized.nodes.length, 2)
    t.assert.equal(serialized.arcs.length, 0)
    
    const deserialized = deserialize(serialized)
    t.assert.equal(deserialized.length, 2)
    t.assert.equal(deserialized[0].arcs.length, 0)
    t.assert.equal(deserialized[1].arcs.length, 0)
  })
})
