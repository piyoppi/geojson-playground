export const px = (px: number) => ({
  name: 'px',
  toString: () => `${px}px`
})
export type Pixel = ReturnType<typeof px>

// https://www.w3.org/TR/css-values-3/#lengths
export type Length = Pixel

export type SizeAttribute = {
  width?: Length
  height?: Length
}
