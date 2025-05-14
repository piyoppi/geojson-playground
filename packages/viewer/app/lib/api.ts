import createFetchClient from "openapi-fetch"
import type { paths } from "@piyoppi/sansaku-api-spec/openapi.d.ts"

export const $api = createFetchClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
})
