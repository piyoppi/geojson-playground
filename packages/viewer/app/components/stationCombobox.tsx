import { $api } from "~/lib/api";
import { Combobox } from "./ui/combobox"
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type PropTypes = {
  onStationSelected?: (stationId: string) => void
}

export function StationCombobox({ onStationSelected }: PropTypes) {
  const [searchQuery, setSearchQuery] = useState('')
  const currentTimerId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleStationSelected = (id: string) => {
    if (onStationSelected) {
      onStationSelected(id)
    }
  }

  const handleSearchValueChanged = (search: string) => {
    const searchQuery = search.replaceAll(' ', '')

    if (
      !/^[Ａ-Ｚａ-ｚ０-９]$/.test(searchQuery[0])
    ) {
      if (currentTimerId) {
        clearTimeout(currentTimerId.current)
      }

      const timerId = setTimeout(() => {
        setSearchQuery(searchQuery)
        clearTimeout(currentTimerId.current)
      }, 1000)

      currentTimerId.current = timerId
    }
  }

  const query = useQuery({
    queryKey: ["get", "/stations", searchQuery],
    queryFn: () => $api.GET("/stations", {
      params: {
        query: {
          name: searchQuery
        }
      },
    }),
    enabled: searchQuery.length > 0,
  })

  return (
    <Combobox
      items={
        query.data?.data?.items.map(s => {
          const kind = (s.kind === 'bus') ? 'バス' : '鉄道'
          const routeName = s.routeSummaries.map(r => r.name).join(',')
          return [`${kind} | ${s.name} (${routeName})`, s.id, s.id]
        }) || []
      }
      onSearchValueChanged={handleSearchValueChanged}
      onItemSelected={handleStationSelected}
    />
  )
}
