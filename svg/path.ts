import { Color } from './color.js'
import { Tag } from './element.js'
import { Paint } from './paint.js'
import { Length } from './size.js'

export type StrokeWidth = ['stroke-width', Length]
export type PresentationAttributes = {
  stroke?: Color,
  strokeWidth?: StrokeWidth,
  fill?: Paint
}

export const strokeWidth = (v: Length): StrokeWidth => ['stroke-width', v]

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
export const path = (attr: PathAttributes): Path => ({
  name: "path",
  attributes: attr,
  points: () => attr.d?.points() || []
})
