import { shortest } from '@piyoppi/sansaku-query'

export const execute = async (
  inputGraphDir: string,
  fromId: string,
  fromPk: string,
  toId: string,
  toPk: string
) => {
  console.log(
    (await shortest(inputGraphDir, fromId, fromPk, toId, toPk))
      .map(node => `${node.item.station.name}(${node.id}) \n ↓ ${node.item.station.routeIds[0]} \n`)
      .join('')
  )
}
