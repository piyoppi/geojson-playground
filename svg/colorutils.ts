import { rgb } from './color.ts'

export const randomRgb = (
  option?: {
    rRange?: [number, number],
    gRange?: [number, number],
    bRange?: [number, number]
  }
) => rgb(randomInt(option?.rRange), randomInt(option?.gRange), randomInt(option?.bRange))
  
const randomInt = ([min, max]: [number, number] = [0, 255]) => min + Math.floor(Math.random() * max)


