export const rgba = (r: number, g: number, b: number, a: number) => ({
  type: 'rgba',
  toString: () => `rgba(${r},${g},${b},${a})`
})
export const rgb = (r: number, g: number, b: number) => ({
  type: 'rgba',
  toString: () => `rgb(${r},${g},${b})`
})
// ref: https://www.w3.org/TR/css-color-3/#rgba-color
export type RGBA = ReturnType<typeof rgba>

// ref: https://www.w3.org/TR/css-color-3/#rgb-color
export type RGB = ReturnType<typeof rgb>

// ref: https://www.w3.org/TR/css-color-3/#html4
export type BasicColorKeyword =
    'black'
  | 'silver'
  | 'gra'
  | 'white'
  | 'maroon'
  | 'red'
  | 'purple'
  | 'fuchsia'
  | 'green'
  | 'lime'
  | 'olive'
  | 'yellow'
  | 'navy'
  | 'blue'
  | 'teal'
  | 'aqua'

// ref: https://www.w3.org/TR/css-color-3/#transparent-def
export type Transparent = 'transparent'

export type Color =
    RGB
  | RGBA
  | BasicColorKeyword
  | Transparent
