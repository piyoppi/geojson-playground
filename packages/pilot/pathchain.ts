import { type Position2D, diff } from "./geometry"
import { type Path, type PointInPath, pointInPath as findPointInPath } from "./path"
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
}
export type PathInternal = {
  path: Path,
  index: number,
  neighbors: [number[], number[]],
}
type Visited = { pathChain: PathChain, next: NextFn }

export type PointInPathchain = {
  pointInPath: PointInPath,
  pathchain: WeakRef<PathChain>
}

export const buildPathchain = async (paths: Readonly<Path[]>): Promise<PathChain[][]> => {
  const pathInternals = buildPathInternal(paths)
  mergeTIntersection(pathInternals)

  const grouped = await groupByIsolated(buildFromInternal(pathInternals))

  return grouped
}

export const buildFromInternal = (pathInternals: PathInternal[]): PathChain[] => {
  const step = generateStep(pathInternals, index => pathchains[index])

  const pathchains = pathInternals.map((r, index) => ({
    path: r.path,
    isEnded: r.neighbors.some(n => n.length === 0),
    from: () => step.generateVisit(new Set([index]), index),
  }))

  return pathchains
}

export const ends = (pathchains: Readonly<PathChain[]>) => pathchains.filter(r => r.isEnded)

export const findPointInPathChain = (pathchains: Readonly<PathChain[]>) => (p: Readonly<Position2D>) => {
  return pathchains.reduce((acc, pathchain) => {
    if (acc) return acc

    const found = findPointInPath(p, pathchain.path)
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

const groupByIsolated = async (pathchains: Readonly<PathChain[]>) => {
  const groups: Set<PathChain>[] = []
  for (const end of ends(pathchains)) {
    if (groups.some(g => g.has(end))) continue

    const group = new Set<PathChain>()
    await pathChainWalk(end.from(), pathchain => group.add(pathchain) && Promise.resolve())
    groups.push(group)
  }

  return groups.map(g => Array.from(g))
}

export const mergeTIntersection = (pathInternals: PathInternal[]) => {
  const endPathInternals = pathInternals.filter(r => r.neighbors.find(n => n.length === 0))

  for (const endPathInternal of endPathInternals) {
    const ends = endPathInternal.neighbors.flatMap((n, index) => {
      const point = endPathInternal.path.at(index * -1)
      return n.length === 0 && point ? [{point, index}] : []
    })

    for (const end of ends) {
      const intersects = pathInternals.flatMap((targetPathInternal, index) => {
        if (targetPathInternal === endPathInternal) return []
        const pointInPath = findPointInPath(end.point, targetPathInternal.path)
        return pointInPath ? [{ pointInPath, targetPathInternal, index }] : []
      })

      for (const intersect of intersects) {
        const splittedPathIndex1 = intersect.index
        const splittedPathIndex2 = pathInternals.length

        const path1 = intersect.targetPathInternal.path.slice(0, intersect.pointInPath.startIndex + 1)
        if (path1.at(-1)?.at(0) !== end.point[0] || path1.at(-1)?.at(1) !== end.point[1]) path1.push([...end.point])
        pathInternals.splice(
          splittedPathIndex1,
          1,
          {
            path: path1,
            index: splittedPathIndex1,
            neighbors: [[...intersect.targetPathInternal.neighbors[0]], [endPathInternal.index, splittedPathIndex2]],
          }
        )

        const path2 = intersect.targetPathInternal.path.slice(intersect.pointInPath.startIndex + 1)
        if (path2.at(0)?.at(0) !== end.point[0] || path2.at(0)?.at(1) !== end.point[1]) path2.unshift([...end.point])
        pathInternals.push(
          {
            path: path2,
            index: splittedPathIndex2,
            neighbors: [[endPathInternal.index, splittedPathIndex1], [...intersect.targetPathInternal.neighbors[1]]],
          }
        )
        for (const neighbor of intersect.targetPathInternal.neighbors[1]) {
          const neighbors = pathInternals[neighbor].neighbors[0]
          const index = neighbors.findIndex(i => i === intersect.index)
          if (index >= 0) neighbors[index] = splittedPathIndex2
        }

        endPathInternal.neighbors[end.index].push(splittedPathIndex1, splittedPathIndex2)
      }
    }
  }
}
