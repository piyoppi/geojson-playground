import { Tag } from './element'
import { PresentationAttributes } from './presentationalAttributes'
import { Length, Percentage } from './size'

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
