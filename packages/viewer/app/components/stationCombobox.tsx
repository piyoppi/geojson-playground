import { $api } from "~/lib/api";
import { Combobox } from "./ui/combobox"
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

type PropTypes = {
  onStationSelected?: (stationId: string) => void
}

export function StationCombobox({ onStationSelected }: PropTypes) {
  const [searchQuery, setSearchQuery] = useState('')

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
      setSearchQuery(searchQuery)
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
          return [`${kind} | ${s.name}`, s.id, s.id]
        }) || []
      }
      onSearchValueChanged={handleSearchValueChanged}
      onItemSelected={handleStationSelected}
    />
  )
}
