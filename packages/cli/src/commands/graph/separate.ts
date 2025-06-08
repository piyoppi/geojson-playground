import { readFileSync, writeFileSync } from 'node:fs'
import { separate } from '@piyoppi/sansaku-pilot/traffic/graph/separate.js'
import { buildRepository } from '@piyoppi/sansaku-pilot/graph/arc/partitionedRepositoryArc.js'
import { join as pathJoin } from 'node:path'
import { toTrafficGraphFile, TrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraphFile.js'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot'
import type { TrafficItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'

export const execute = async (
  inputGraphFilename: string,
  outDir: string,
) => {
  const railroadJson = JSON.parse(readFileSync(inputGraphFilename, "utf-8")) as TrafficGraphFile
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile()

  const { graph, railroads, busRoutes, companies } = buildTrafficGraphFromFile(railroadJson)

  const repository = buildRepository<TrafficItem>(
    partitionKey => Promise.reject(new Error(`Node is not found (partitionKey: ${partitionKey})`)),
    async (partitionKey, nodes) => {
      const file = await toTrafficGraphFile(
        nodes,
        companies.filter(c => c.id === partitionKey),
        railroads.filter(r => r.companyId === partitionKey),
        busRoutes.filter(b => b.companyId === partitionKey)
      )
      writeFileSync(pathJoin(outDir, `${partitionKey}.json`), JSON.stringify(file), "utf-8")
    }
  )

  await separate(repository, graph)

  await repository.store()
}
