import { Paint } from './paint.js'
import { Length } from './size.js'
import { Color } from './color.js'

export type StrokeWidth = ['stroke-width', Length]
export type PresentationAttributes = {
  stroke?: Color,
  strokeWidth?: StrokeWidth,
  fill?: Paint
}

export const strokeWidth = (v: Length): StrokeWidth => ['stroke-width', v]
