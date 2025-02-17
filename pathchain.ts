import { Position2D } from "./geojson"

type PathInternal = { positions: Position2D[], neighbors: [number[], number[]] }

const diffPosition = (p1: Position2D, p2: Position2D) => (p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1])

export const toPathchain = (pos: Position2D[][]) => {
  const pathInternals = pos.map((r, index): PathInternal => {
    const [p1, p2] = [r.at(0), r.at(-1)]

    const [i1, i2] = (p1 !== undefined && p2 !== undefined) ? pos.reduce((current: [number[], number[]], pair, pairIndex) => {
      if (index === pairIndex) return current

      const [pp1, pp2] = [pair.at(0), pair.at(-1)]

      if (pp1 === undefined || pp2 === undefined) return current

      if (Math.min(diffPosition(p1, pp1), diffPosition(p1, pp2)) === 0) current[0].push(pairIndex)
      if (Math.min(diffPosition(p2, pp1), diffPosition(p2, pp2)) === 0) current[1].push(pairIndex)

      return current
    }, [[], []]) : [[], []]

    return {
      positions: r,
      neighbors: [i1, i2]
    }
  })
  
  const generateVisit = (visited: Set<number>, current: number) => () => {
    const path = pathchain[current]
    const pathInternal = pathInternals[current]
    console.log("visit!: ", current)
    visited.add(current)

    return {
      path,
      next: generateNext(visited, pathInternal.neighbors)
    }
  }

  const generateNext = (visited: Set<number>, neighbors: [number[], number[]]) => () => {
    console.log("neighbors: ", neighbors)
    console.log("visited: ", visited)
    const notVisitedNeighborByPoints = neighbors.filter(n => n.every(i => !visited.has(i))).flat()
    console.log("notVisited: ", notVisitedNeighborByPoints)

    return notVisitedNeighborByPoints.map(i => generateVisit(visited, i))
  }

  const pathchain = pathInternals.map((r, index) => {
    return {
      positions: r.positions,
      isEnded: r.neighbors.some(n => n.length === 0),
      from() {
        const visited = new Set<number>()
        visited.add(index)

        return generateNext(visited, r.neighbors)
      }
    }
  })

  return {
    pathchain,
    ends: () => pathchain.filter(r => r.isEnded)
  }
}
