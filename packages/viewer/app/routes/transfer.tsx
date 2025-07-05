import { useCallback, useState, useEffect } from "react"
import { Card, CardFooter } from "~/components/ui/card"
import type { Route } from "./+types/home"
import { StationCombobox } from "~/components/stationCombobox"
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { TransferResult } from "~/components/transferResult"
import { useSearchParams } from "react-router"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sansaku-Viewer" },
    { name: "description", content: "Sansaku MapViewer" },
  ];
}

export const queryClient = new QueryClient()

export default function Transfer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [fromStationId, setFromStationId] = useState<string | undefined>(
    searchParams.get('from') || undefined
  )
  const [toStationId, setToStationId] = useState<string | undefined>(
    searchParams.get('to') || undefined
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (fromStationId) params.set('from', fromStationId)
    if (toStationId) params.set('to', toStationId)
    setSearchParams(params, { replace: true })
  }, [fromStationId, toStationId, setSearchParams])

  const handleFromStationSelected = useCallback((stationId: string) => {
    setFromStationId(stationId)
  }, [])

  const handleToStationSelected = useCallback((stationId: string) => {
    setToStationId(stationId)
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
          <QueryClientProvider client={queryClient}>
            <TransferResult fromStationId={fromStationId} toStationId={toStationId}/>
          </QueryClientProvider>
        </div>
      </div>
    </div>
  </article>;
}
