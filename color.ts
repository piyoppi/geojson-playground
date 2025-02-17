export const rgba = (r: number, g: number, b: number, a: number) => ({
  type: 'rgba',
  toString: () => `rgba(${r},${g},${b},${a})`
})
export const rgb = (r: number, g: number, b: number) => ({
  type: 'rgba',
  toString: () => `rgb(${r},${g},${b})`
})

export type RGBA = ReturnType<typeof rgba>
export type RGB = ReturnType<typeof rgb>


