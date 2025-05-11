import createFetchClient from "openapi-fetch"
import createClient from "openapi-react-query"
import type { paths } from "@piyoppi/sansaku-api-spec/openapi.d.ts"

const fetchClient = createFetchClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
})

export const $api = createClient(fetchClient)

