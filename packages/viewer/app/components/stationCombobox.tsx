import { $api } from "~/lib/api";
import { Combobox } from "./ui/combobox"
import { useState } from "react";

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

  const { data, error } = $api.useQuery(
    "get",
    "/stations",
    {
      params: {
        query: {
          name: searchQuery
        }
      },
    },
  )

  if (error) return `An error occured: ${error.title}`

  return (
    <Combobox
      items={data?.items.map(s => [s.name, s.id, s.id]) || []}
      onSearchValueChanged={handleSearchValueChanged}
      onItemSelected={handleStationSelected}
    />
  )
}
