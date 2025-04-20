import type { BusRoute } from "@piyoppi/sansaku-pilot/busroute"

type PropTypes = {
  busRoutes: BusRoute[],
  onBusRouteSelected?: (route: BusRoute) => void
}

export function BusRouteList({ busRoutes, onBusRouteSelected }: PropTypes) {
  return (
    <ul>
      {busRoutes.map(busRoute => (
        <li key={busRoute.id}>
          <button type="button" onClick={() => onBusRouteSelected && onBusRouteSelected(busRoute)}>{busRoute.name}</button>
        </li>
      ))}
    </ul>
  )
}
