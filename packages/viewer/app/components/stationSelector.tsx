import type { Route, Station } from "@piyoppi/sansaku-pilot/traffic/transportation"
import { Combobox } from "./ui/combobox"
import type { Railroad } from "@piyoppi/sansaku-pilot/traffic/railroad"
import type { BusRoute } from "@piyoppi/sansaku-pilot/traffic/busroute"
import type { BusStop } from "@piyoppi/sansaku-pilot/traffic/busroute"
import { useState } from "react"

type PropTypes = {
  railroads: Railroad[]
  busRoutes: BusRoute[]
  onStationSelected?: (station: Station) => void
}

type TransportationType = 'Railroad' | 'BusRoute'

export function StationSelector({ railroads, busRoutes, onStationSelected }: PropTypes) {
  const [transportationType, setTransportationType] = useState<TransportationType | null>(null)
  const [route, setRoute] = useState<Route<Station | BusStop> | null>(null)

  const transportationTypes = [
    ...railroads.length > 0 ? [['鉄道', 'Railroad', 'Railroad'] as const]: [],
    ...busRoutes.length > 0 ? [['バス', 'BusRoute', 'BusRoute'] as const]: []
  ]

  const handleTransportationTypeSelected = (type: TransportationType) => {
    setTransportationType(type)
  }

  const routes = transportationType === 'Railroad' ? railroads :
    transportationType === 'BusRoute' ? busRoutes :
    []

  const handleRouteSelected = (route: Route<Station | BusStop>) => {
    setRoute(route)
  }

  const handleStationSelected = (station: Station) => {
    if (onStationSelected) {
      onStationSelected(station)
    }
  }

  return (
    <>
      <Combobox
        items={transportationTypes}
        onItemSelected={handleTransportationTypeSelected}
        placeholder="交通機関を選択"
      />
      <Combobox
        items={routes.map(route => [route.name, route.id.toString(), route] as const)}
        onItemSelected={handleRouteSelected}
        placeholder="路線を選択"
      />
      { route && 
        <Combobox
          items={route.stations.map(station => [station.name, station.id.toString(), station])}
          onItemSelected={handleStationSelected}
          placeholder={`${transportationType === 'Railroad' ? '駅' : 'バス停'}を選択`}
        />
      }
    </>
  )
}
