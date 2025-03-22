import { Paint } from './paint'
import { Length } from './size'
import { Color } from './color'

export type StrokeWidth = ['stroke-width', Length]
export type PresentationAttributes = {
  stroke?: Color,
  strokeWidth?: StrokeWidth,
  fill?: Paint
}

export const strokeWidth = (v: Length): StrokeWidth => ['stroke-width', v]
