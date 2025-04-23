import type { Station } from "@piyoppi/sansaku-pilot/traffic/transportation"

type PropTypes = {
  stations: Station[],
  onStationSelected?: (station: Station) => void
}

export function StationList({ stations, onStationSelected }: PropTypes) {
  return (
    <ul>
      {stations.map(station => (
        <li key={station.id}>
          <button type="button" onClick={() => onStationSelected && onStationSelected(station)}>{station.name}</button>
        </li>
      ))}
    </ul>
  )
}
