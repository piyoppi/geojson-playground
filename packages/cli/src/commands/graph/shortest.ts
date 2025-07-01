import { shortest } from '@piyoppi/sansaku-query'
import { isRailroadStationNode, isBusStopNode } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'

export const execute = async (
  inputGraphDir: string,
  fromId: string,
  fromPk: string,
  toId: string,
  toPk: string
) => {
  const result = await shortest(inputGraphDir, fromId, fromPk, toId, toPk)
  console.log(
    result.nodes
      .map((node) => {
        if (isRailroadStationNode(node)) {
          return `Station: ${node.id}\n ↓\n`
        } else if (isBusStopNode(node)) {
          return `Bus Stop: ${node.id}\n ↓\n`
        } else {
          return `Junction: ${node.id}\n ↓\n`
        }
      })
      .join('')
  )
}
