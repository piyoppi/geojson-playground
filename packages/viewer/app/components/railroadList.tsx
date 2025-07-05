import type { RailroadRoute } from "@piyoppi/sansaku-pilot/traffic/railroad";

type PropTypes = {
  railroads: RailroadRoute[],
  onRailroadSelected?: (railroad: RailroadRoute) => void
}

export function RailroadList({ railroads, onRailroadSelected }: PropTypes) {
  return (
    <ul>
      {railroads.map(railroad => (
        <li key={railroad.id.toString()}>
          <button type="button" onClick={() => onRailroadSelected && onRailroadSelected(railroad)}>{railroad.name}</button>
        </li>
      ))}
    </ul>
  )
}
