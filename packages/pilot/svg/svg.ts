import type { Tag } from './element.js'
import type { Path } from './path.js'
import type { SizeAttribute } from './size.js'

type ViewBox = [number, number, number, number]
type SvgChildren = Path

type Svg = Tag & { attributes: SvgAttributes }
type SvgAttributes = SizeAttribute | {
  viewBox?: ViewBox
  xmlns?: 'http://www.w3.org/2000/svg'
}
export const svg = (attributes: SvgAttributes, children: SvgChildren[]): Svg => ({
  name: "svg",
  attributes: {
    ...attributes,
    xmlns: 'http://www.w3.org/2000/svg'
  },
  children
})

export const getBoundaryViewBox = (points: [number, number][]): ViewBox => {
  const minX = Math.min(...points.map(([x, _]) => x))
  const minY = Math.min(...points.map(([_, y]) => y))
  const maxX = Math.max(...points.map(([x, _]) => x))
  const maxY = Math.max(...points.map(([_, y]) => y))

  return [
    minX,
    minY,
    maxX - minX,
    maxY - minY
  ]
}

export const addPadding = ([x, y, w, h]: ViewBox, top: number, right: number, bottom: number = top, left: number = right): ViewBox => [
  x - left,
  y - top,
  w + right + left,
  h + bottom + top
]
