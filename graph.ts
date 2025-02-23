import { argv0 } from "process"
import { Position2D } from "./geometry"
import { PathChain } from "./pathchain"
import { walk } from "./walk"
import { pathLength } from "./path"

type GraphNode = {
  arcs: Arc[]
}

type Arc = {
  cost: number,
  from: WeakRef<GraphNode>
  to: WeakRef<GraphNode>
}

const generateNode = (): GraphNode => ({
  arcs: []
})

const generateArc = (from: GraphNode, to: GraphNode): Arc => ({
  cost: 0,
  from: new WeakRef(from),
  to: new WeakRef(to)
})

export const fromPathChain = (points: Position2D[]) => (pathchain: PathChain) => {
  const pointInPathchains = points.map(p => pathchain.findPointInPathChain(p)).flatMap(p => p ? [p] : [])

  walk<[GraphNode, number]>(pathchain.from(), (pathchain, [currentNode, distance]) => {
    const newDistance = distance + pathLength(pathchain.path)

    const found = pointInPathchains.find(pp => {
      const currentPointPathChain = pp.pathChain.deref()

      if (!currentPointPathChain) return false

      return currentPointPathChain === pathchain
    })

    if (found) {
      const newNode = generateNode()
      const arc = generateArc(currentNode, newNode)

      currentNode.arcs.push(arc)
      newNode.arcs.push(arc)

      return [newNode, 0]
    }

    return [currentNode, newDistance]
  }, [generateNode(), 0])
}
