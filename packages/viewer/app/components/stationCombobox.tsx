import type { Station } from "@piyoppi/sansaku-pilot/traffic/transportation"
import { Combobox } from "./ui/combobox"

type PropTypes = {
  stations: Station[],
  onStationSelected?: (station: Station) => void
}

export function StationCombobox({ stations, onStationSelected }: PropTypes) {
  const handleStationSelected = (station: Station) => {
    if (onStationSelected) {
      onStationSelected(station)
    }
  }

  return (
    <Combobox
      items={stations.map(station => [station.name, station.id.toString(), station])}
      onItemSelected={handleStationSelected}
    />
  )
}
