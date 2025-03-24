import { type Position2D, diff } from "./geometry"
import { type Path, type PointInPath, pointInPath } from "./path"
import { pathChainWalk } from "./walk"

export type VisitFn = () => Visited
export type NextFn = () => VisitFn[]
export type PathChainState = {
  path: Path,
  isEnded: boolean
}
export type PathChain = {
  path: Path,
  isEnded: boolean,
  from: () => VisitFn,
  findPointInPathChain: () => (p: Position2D) => PointInPathchain | null
}
type PathInternal = { path: Path, neighbors: [number[], number[]] }
type Visited = { pathChain: PathChain, next: NextFn }

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

const buildPathInternal = (paths: Readonly<Path[]>) => {
  return paths.map((path, index): PathInternal => {
    const [p1, p2] = [path.at(0), path.at(-1)]

    const neighbors: [number[], number[]] =
      (p1 !== undefined && p2 !== undefined) ?
        paths.reduce((current: [number[], number[]], pair, pairIndex) => {
          if (index === pairIndex) return current

          const [pp1, pp2] = [pair.at(0), pair.at(-1)]

          if (pp1 === undefined || pp2 === undefined) return current

          if (Math.min(diff(p1, pp1), diff(p1, pp2)) === 0) current[0].push(pairIndex)
          if (Math.min(diff(p2, pp1), diff(p2, pp2)) === 0) current[1].push(pairIndex)

          return current
          }, [[], []])
        : [[], []]

    return {
      path,
      neighbors
    }
  })
}

const generateStep = (pathInternals: Readonly<PathInternal[]>, pathChains: (index: number) => Readonly<PathChain>) => {
  const generateVisit = (visitedIndexes: Set<number>, current: number): VisitFn => (): Visited => {
    const pathChain = pathChains(current)
    const pathInternal = pathInternals[current]
    visitedIndexes.add(current)

    return {
      pathChain,
      next: generateNext(current, visitedIndexes, pathInternal.neighbors)
    }
  }

  const generateNext = (current: number, visitedIndexes: Set<number>, neighborsIndexes: [number[], number[]]) => () => {
    return neighborsIndexes
      .filter(neighborIndexes => !neighborIndexes.find(i => i === current))
      .flat()
      .filter(i => !visitedIndexes.has(i))
      .map(i => generateVisit(visitedIndexes, i))
  }

  return { generateVisit, generateNext }
}

export const buildPathchain = (paths: Readonly<Path[]>) => {
  const pathInternals = buildPathInternal(paths)
  const step = generateStep(pathInternals, index => pathchains[index])

  const pathchains = pathInternals.map((r, index) => ({
    path: r.path,
    isEnded: r.neighbors.some(n => n.length === 0),
    from: () => step.generateVisit(new Set<number>([index]), index),
    findPointInPathChain: () => findPointInPathChain(pathchains)
  }))

  return pathchains
}

export const ends = (pathchains: Readonly<PathChain[]>) => pathchains.filter(r => r.isEnded)

export const groupByIsolated = (pathchains: Readonly<PathChain[]>) => {
  const groups: Set<PathChain>[] = []
  for (const end of ends(pathchains)) {
    if (groups.some(g => g.has(end))) continue

    const group = new Set<PathChain>()
    pathChainWalk(end.from(), pathchain => group.add(pathchain))
    groups.push(group)
  }

  return groups.map(g => Array.from(g))
}
