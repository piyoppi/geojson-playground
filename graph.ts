import type { Position2D } from "./geometry.ts"
import type { PathChain, PointInPathchain } from "./pathchain.ts"
import { walk } from "./walk.ts"
import { pathLength } from "./path.ts"

export type GraphNode = {
  arcs: Arc[]
}

export type Arc = {
  cost: number,
  from: WeakRef<GraphNode> | null
  to: WeakRef<GraphNode>
}

const generateNode = (): GraphNode => ({
  arcs: []
})

const generateArc = (from: GraphNode | null, to: GraphNode): Arc => ({
  cost: 0,
  from: from ? new WeakRef(from) : null,
  to: new WeakRef(to)
})

type NodeOnPath = {
  position: Position2D,
}
export const fromPathChain = <T extends NodeOnPath, U>(nodes: T[], callback: (node: T, found: PointInPathchain) => U) => (pathchain: PathChain): (U & GraphNode) | null => {
  const pointInPathchains = nodes.map(n => ({node: n, pointInPathChain: pathchain.findPointInPathChain()(n.position)})).flatMap(p => p ? [p] : [])

  let startNode: U | null = null

  walk<[GraphNode | null, number]>(pathchain.from(), (pathchain, [currentNode, distance]) => {
    const newDistance = distance + pathLength(pathchain.path)

    for (const pp of pointInPathchains) {
      const pointInPathchain = pp.pointInPathChain
      if (!pointInPathchain) continue

      const currentPointPathChain = pp.pointInPathChain?.pathchain.deref()
      if (!currentPointPathChain) continue

      if (currentPointPathChain === pathchain) {
        const newNode = {...generateNode(), ...callback(pp.node, pointInPathchain)}

        if (!startNode) startNode = newNode

        const arc = generateArc(currentNode, newNode)

        currentNode?.arcs.push(arc)
        newNode.arcs.push(arc)

        return [newNode, 0]
      }
    }

    return [currentNode, newDistance]
  }, [null, 0])

  return startNode
}
