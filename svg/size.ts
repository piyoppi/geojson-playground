export const px = (px: number) => ({
  name: 'px',
  toString: () => `${px}px`
})
export type Pixel = ReturnType<typeof px>

export const percentage = (per: number) => ({
  name: 'percentage',
  toString: () => `${per}%`
})
export type Percentage = ReturnType<typeof percentage>

// https://www.w3.org/TR/css-values-3/#lengths
export type Length = Pixel

export type SizeAttribute = {
  width?: Length
  height?: Length
}
