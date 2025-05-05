import type { Paint } from './paint.js'
import type { Length } from './size.js'
import type { Color } from './color.js'

export type StrokeWidth = ['stroke-width', Length]
export type PresentationAttributes = {
  stroke?: Color,
  strokeWidth?: StrokeWidth,
  fill?: Paint
}

export const strokeWidth = (v: Length): StrokeWidth => ['stroke-width', v]
