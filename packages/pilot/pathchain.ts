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
  ends: [Position2D | undefined, Position2D | undefined],
  isEnded: boolean,
  from: () => VisitFn,
}
type PathInternal = {
  path: Path,
  index: number,
  neighbors: [number[], number[]],
  ends: [Position2D | undefined, Position2D | undefined]
}
type Visited = { pathChain: PathChain, next: NextFn }

export type PointInPathchain = {
  pointInPath: PointInPath,
  pathchain: WeakRef<PathChain>
}

export const buildPathchain = (paths: Readonly<Path[]>): PathChain[][] => {
  const pathInternals = buildPathInternal(paths)
  const step = generateStep(pathInternals, index => pathchains[index])

  const pathchains = pathInternals.map((r, index) => ({
    path: r.path,
    ends: r.ends,
    isEnded: r.neighbors.some(n => n.length === 0),
    from: () => step.generateVisit(new Set([index]), index),
  }))

  const grouped = groupByIsolated(pathchains)

  return grouped
}

export const ends = (pathchains: Readonly<PathChain[]>) => pathchains.filter(r => r.isEnded)

export const findPointInPathChain = (pathchains: Readonly<PathChain[]>) => (p: Readonly<Position2D>) => {
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
      index,
      neighbors,
      ends: [p1, p2]
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

const groupByIsolated = (pathchains: Readonly<PathChain[]>) => {
  const groups: Set<PathChain>[] = []
  for (const end of ends(pathchains)) {
    if (groups.some(g => g.has(end))) continue

    const group = new Set<PathChain>()
    pathChainWalk(end.from(), pathchain => group.add(pathchain))
    groups.push(group)
  }

  return groups.map(g => Array.from(g))
}

const mergeTIntersection = (aInternal: PathInternal, aInternals: PathInternal[], bInternals: PathInternal[]) => {
  const point = aInternal.ends.find(e => e !== undefined)
  if (!point) return

  const intersected = bInternals.reduce((acc, pathInternal, index) => {
    if (acc) return acc

    const found = pointInPath(point, pathInternal.path)
    if (!found) return acc

    return {index, found}
  }, null as null | {index: number, found: PointInPath})

  if (!intersected) return

  const target = bInternals[intersected.index]
  const targetPath = intersected.found.path.deref()
  if (!targetPath) return

  const splittedPaths = [
    [...targetPath.slice(intersected.found.startIndex), point],
    [point, ...targetPath.slice(intersected.found.startIndex + 1)]
  ]

  bInternals.push(...aInternals.map((r, index) => ({
    ...r,
    index: bInternals.length + index,
  })))
  bInternals.splice(intersected.index, 1)
  bInternals.push({
    path: splittedPaths[0],
    index: bInternals.length,
    neighbors: [[aInternal.index], []],
    ends: [point, target.ends[1]]
  })
}
