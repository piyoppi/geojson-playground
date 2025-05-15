import { useCallback, useState } from "react"
import { Card, CardFooter } from "~/components/ui/card"
import type { Route } from "./+types/home"
import { Button } from "~/components/ui/button"
import { StationCombobox } from "~/components/stationCombobox"
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { TransferResult } from "~/components/transferResult"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sansaku-Viewer" },
    { name: "description", content: "Sansaku MapViewer" },
  ];
}

export const queryClient = new QueryClient()

export default function Transfer() {
  const [fromStationId, setFromStationId] = useState<string | undefined>(undefined)
  const [toStationId, setToStationId] = useState<string | undefined>(undefined)

  const handleFromStationSelected = useCallback((stationId: string) => {
    setFromStationId(stationId)
    console.log(stationId)
  }, [])

  const handleToStationSelected = useCallback((stationId: string) => {
    setToStationId(stationId)
    console.log(stationId)
  }, [])

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
            </CardFooter>
          </Card>
        </div>
        <div className="flex flex-col gap-4 w-96 h-full">
          <Card className="h-1/2 p-4">
            <QueryClientProvider client={queryClient}>
              <TransferResult fromStationId={fromStationId} toStationId={toStationId}/>
            </QueryClientProvider>
          </Card>
        </div>
      </div>
    </div>
  </article>;
}
