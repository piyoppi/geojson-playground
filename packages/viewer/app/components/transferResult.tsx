import { $api } from "~/lib/api";
import { useQuery } from "@tanstack/react-query";

type PropTypes = {
  fromStationId?: string
  toStationId?: string
}

export function TransferResult({ fromStationId, toStationId }: PropTypes) {
  const query = useQuery({
    queryKey: ["get", "/transfer", fromStationId, toStationId],
    queryFn: async () => {
      if (!fromStationId || !toStationId) {
        return { items: [] }
      }

      const result = await $api.GET("/transfer", {
        params: {
          query: {
            from: fromStationId,
            to: toStationId,
          }
        },
      })

      return result.data
    },
    enabled: !!fromStationId && !!toStationId,
  })

  return (
    <ol>
      {query.data?.items.map((item) => (
        <li key={item.id}>
          <button type="button" onClick={() => console.log(item)}>{item.name}</button>
        </li>
      ))}
    </ol>
  )
}
