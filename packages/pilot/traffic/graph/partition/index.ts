import { companyIdToString, type Route, type Station } from "../../transportation.js";

/**
 * Get partition key for traffic graph items
 * @param route - The route to get partition key from
 * @returns Partition key string (company ID as string)
 */
export const getTrafficGraphPartitionKey = (route: Route<Station>): string => {
  return companyIdToString(route.companyId);
};

export { partition } from './partition.js';
export { partitionByCompany } from './partitionByCompany.js';