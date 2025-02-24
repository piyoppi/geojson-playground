import { Tag } from './element.js'
import { PresentationAttributes } from './presentationalAttributes.js'

type Shape = { points: () => [number, number][] }

type PathCommand<Name> = {
  name: Name,
  points: [number, number][],
  toString: () => string
}

type Line = PathCommand<'line'>
export const line = (x: number, y: number): Line => ({
  name: 'line',
  points: [[x, y]],
  toString: () => `L ${x},${y}`
})

type Move = PathCommand<'move'>
export const move = (x: number, y: number): Move => ({
  name: 'move',
  points: [[x, y]],
  toString: () => `M ${x},${y}`
})

export const pathDatas = (v: PathCommand<unknown>[]) => ({
  name: 'pathDatas',
  points: () => v.map(c => c.points).flat(),
  toString: () => v.join(' ')
})
export type PathDatas = ReturnType<typeof pathDatas>

export type Path = (Tag & { attributes: PathAttributes }) & Shape
export type PathAttributes = PresentationAttributes & {
  d?: PathDatas
}
export const path = (attributes: PathAttributes): Path => ({
  name: "path",
  attributes,
  points: () => attributes.d?.points() || []
})
