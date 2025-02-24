import { Tag } from './element.js'
import { PresentationAttributes } from './presentationalAttributes.js'
import { Length, Percentage } from './size.js'

export type CircleAttributes = PresentationAttributes & {
  cx: Length | Percentage
  cy: Length | Percentage
  r: Length | Percentage
}
export type Circle = (Tag & { attributes: CircleAttributes })

export const circle = (attributes: CircleAttributes): Circle => ({
  name: "circle",
  attributes: attributes
})
