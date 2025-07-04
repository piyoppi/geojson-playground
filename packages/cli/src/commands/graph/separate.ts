import { readFileSync, writeFileSync } from 'node:fs'
import { partitionByCompany } from '@piyoppi/sansaku-pilot/traffic/graph/partition/partitionByCompany.js'
import { buildPartitionedRepository } from '@piyoppi/sansaku-pilot/graph/arc/partitionedRepositoryArc.js'
import { join as pathJoin } from 'node:path'
import { toTrafficGraphFile, TrafficGraphFile } from '@piyoppi/sansaku-pilot/traffic/trafficGraphFile.js'
import { buildDefaultTrafficGraphFromFile } from '@piyoppi/sansaku-pilot/main.js'
import type { TrafficNodeItem } from '@piyoppi/sansaku-pilot/traffic/graph/trafficGraph.js'

export const execute = async (
  inputGraphFilename: string,
  outDir: string,
) => {
  const railroadJson = JSON.parse(readFileSync(inputGraphFilename, "utf-8")) as TrafficGraphFile
  const buildTrafficGraphFromFile = buildDefaultTrafficGraphFromFile()

  const { graph, railroads, busRoutes, companies } = await buildTrafficGraphFromFile(railroadJson)

  const repository = buildPartitionedRepository<TrafficNodeItem>(
    (partitionKey: string) => Promise.reject(new Error(`Node is not found (partitionKey: ${partitionKey})`)),
    async (partitionKey: string, nodes: any[]) => {
      const file = await toTrafficGraphFile(
        nodes,
        companies.filter(c => c.id === partitionKey),
        railroads.filter(r => r.companyId === partitionKey),
        busRoutes.filter(b => b.companyId === partitionKey)
      )
      writeFileSync(pathJoin(outDir, `${partitionKey}.json`), JSON.stringify(file), "utf-8")
    }
  )

  await partitionByCompany(repository, graph, railroads, busRoutes)

  await repository.store()
}
