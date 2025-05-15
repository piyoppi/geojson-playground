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
    const query = search.replaceAll(' ', '')

    if (
      !/^[Ａ-Ｚａ-ｚ０-９]$/.test(query[0])
    ) {
      setSearchQuery(query.substring(0, 1))
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
      items={query.data?.data?.items.map(s => [`${s.name} (${s.routeName})`, s.id, s.id]) || []}
      onSearchValueChanged={handleSearchValueChanged}
      onItemSelected={handleStationSelected}
    />
  )
}
