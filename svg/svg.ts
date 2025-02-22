import { Tag } from './element.js'
import { Path } from './path.js'
import { SizeAttribute } from './size.js'

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

export const addPadding = ([x, y, w, h]: ViewBox, top: number, right: number, bottom?: number, left?: number): ViewBox => [
  x - (left !== undefined ? left : right),
  y - top,
  w + right,
  h + (bottom !== undefined ? bottom : top)
]
