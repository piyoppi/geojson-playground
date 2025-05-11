import { useCallback, useState } from "react"
import { Card, CardFooter } from "~/components/ui/card"
import type { Route } from "./+types/home"
import { Button } from "~/components/ui/button"
import { StationCombobox } from "~/components/stationCombobox"
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sansaku-Viewer" },
    { name: "description", content: "Sansaku MapViewer" },
  ];
}

export const queryClient = new QueryClient()

export default function Transfer() {
  const [fromStationId, setFromStationId] = useState<string | null>(null)
  const [toStationId, setToStationId] = useState<string | null>(null)

  const handleFromStationSelected = useCallback((stationId: string) => {
    setFromStationId(stationId)
  }, [])

  const handleToStationSelected = useCallback((stationId: string) => {
    setToStationId(stationId)
  }, [])

  const handleSearch = useCallback(async () => {
  }, [fromStationId, toStationId])

  return <article className="p-4">
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4 h-screen">
        <div className="flex flex-col w-96 h-full">
          <Card className="h-1/2 p-4">
            <QueryClientProvider client={queryClient}>
              <StationCombobox onStationSelected={handleFromStationSelected}/>
              <StationCombobox onStationSelected={handleToStationSelected}/>
            </QueryClientProvider>
            <CardFooter className="p-0">
              <Button className="w-full" onClick={handleSearch}>検索</Button>
            </CardFooter>
          </Card>
        </div>
        <div className="flex flex-col gap-4 w-96 h-full">
          <ol>
          </ol>
        </div>
      </div>
    </div>
  </article>;
}
