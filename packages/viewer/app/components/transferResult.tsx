import { $api } from "~/lib/api";
import { useQuery } from "@tanstack/react-query";
import { RailroadItem } from "./railroadItem";
import type { StationResponse } from "~/types";
import { RouteMarker } from "./routeMarker";
import { StationListItem } from "./stationListItem";

type PropTypes = {
  fromStationId?: string
  toStationId?: string
}

export function TransferResult({ fromStationId, toStationId }: PropTypes) {
  const query = useQuery({
    queryKey: ["get", "/transfer", fromStationId, toStationId],
    queryFn: async () => {
      if (!fromStationId || !toStationId) {
        return []
      }

      const result = await $api.GET("/transfer", {
        params: {
          query: {
            from: fromStationId,
            to: toStationId,
          }
        },
      })

      const routes: StationResponse[][] = []
      let currentRouteName = ''

      for (const item of result.data?.items ?? []) {
        if (currentRouteName !== item.routeName) {
          routes.push([])
          currentRouteName = item.routeName
        }

        routes.at(-1)?.push(item)
      }

      return routes
    },
    enabled: !!fromStationId && !!toStationId,
  })

  return (
    <ol className="grid">
      {query.data?.map(route => (
        <>
          <RailroadItem key={route.reduce((acc, r) => `${acc}-${r.id}`, '')} stations={route} />
          <li>
            <StationListItem type="none">乗り換え</StationListItem>
          </li>
        </>
      ))}
    </ol>
  )
}
