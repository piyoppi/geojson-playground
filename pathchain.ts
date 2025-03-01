import { type Position2D, diff } from "./geometry.ts"
import { type Path, type PointInPath, pointInPath } from "./path.ts"

export type NextFn = () => VisitFn[]
export type PathChainState = {
  path: Path,
  isEnded: boolean
}
export type PathChain = {
  path: Path,
  isEnded: boolean,
  from: () => NextFn,
  findPointInPathChain: () => (p: Position2D) => PointInPathchain | null
}

type VisitFn = () => Visited
type PathInternal = { path: Path, neighbors: [number[], number[]] }
type Visited = { path: PathChain, next: NextFn }

export type PointInPathchain = {
  pointInPath: PointInPath,
  pathchain: WeakRef<PathChain>
}

const findPointInPathChain = (pathchains: Readonly<PathChain[]>) => (p: Readonly<Position2D>) => {
  return pathchains.reduce((acc, pathchain) => {
    if (acc) return acc

    const found = pointInPath(p, pathchain.path)
    if (!found) return acc

    return {
      pointInPath: found,
      pathchain: new WeakRef(pathchain)
    }
  }, null as null | PointInPathchain)
}

export const toPathchain = (paths: Readonly<Path[]>) => {
  const pathInternals = paths.map((r, index): PathInternal => {
    const [p1, p2] = [r.at(0), r.at(-1)]

    const [i1, i2] = (p1 !== undefined && p2 !== undefined) ? paths.reduce((current: [number[], number[]], pair, pairIndex) => {
      if (index === pairIndex) return current

      const [pp1, pp2] = [pair.at(0), pair.at(-1)]

      if (pp1 === undefined || pp2 === undefined) return current

      if (Math.min(diff(p1, pp1), diff(p1, pp2)) === 0) current[0].push(pairIndex)
      if (Math.min(diff(p2, pp1), diff(p2, pp2)) === 0) current[1].push(pairIndex)

      return current
    }, [[], []]) : [[], []]

    return {
      path: r,
      neighbors: [i1, i2]
    }
  })

  const generateVisit = (visited: Set<number>, current: number): VisitFn => (): Visited => {
    const path = pathchains[current]
    const pathInternal = pathInternals[current]
    visited.add(current)

    return {
      path,
      next: generateNext(visited, pathInternal.neighbors)
    }
  }

  const generateNext = (visited: Set<number>, neighbors: [number[], number[]]) => () => {
    const notVisitedNeighborByPoints = neighbors.flat().filter(i => !visited.has(i))

    return notVisitedNeighborByPoints.map(i => generateVisit(visited, i))
  }

  const pathchains = pathInternals.map((r, index) => ({
    path: r.path,
    isEnded: r.neighbors.some(n => n.length === 0),
    from() {
      const visited = new Set<number>()
      visited.add(index)

      return generateNext(visited, r.neighbors)
    },
    findPointInPathChain: () => findPointInPathChain(pathchains)
  }))

  return {
    pathchains,
    ends: () => pathchains.filter(r => r.isEnded)
  }
}
