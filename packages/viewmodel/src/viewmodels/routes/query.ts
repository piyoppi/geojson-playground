import type { DatabaseHandler } from '../../database.js'
import { buildPlaceholder } from '../../helpers/query.js'
import { CompanySummaryRecord, StationSummaryRecord } from './table.js'
import { CompanySummary, RouteSummary, StationSummary, StationSummaryGroup } from './model.js'

export const findRouteSummariesFromId = (database: DatabaseHandler, ids: string[]): RouteSummary[] => {
  if (ids.length === 0) return [];
  
  const query = `
    SELECT routes.id as route_id, routes.name as route_name, 
           companies.id as company_id, companies.name as company_name
    FROM routes 
    JOIN companies ON routes.company_id = companies.id
    WHERE routes.id in (${ids.map(_ => '?').join(',')})
  `

  const stmt = database.prepare(query)
  const records = stmt.all(...ids) as any[]

  return createRouteSummaries(records);
}

export const findCompanySummariesFromId = (database: DatabaseHandler, ids: string[]): CompanySummary[] => {
  const query = `
    SELECT id, name
    FROM companies
    WHERE id in (${ids.map(_ => '?').join(',')})
  `

  const stmt = database.prepare(query)
  const records = stmt.all(...ids) as CompanySummaryRecord[]

  return records.map(record => ({
    id: record.id,
    name: record.name
  }))
}

export const findStationSummariesFromGroupId = (database: DatabaseHandler, groupIds: string[]): StationSummary[] => {
  const query = `
    SELECT id, group_id, partition_key, name, kind
    FROM stations 
    WHERE group_id in (${buildPlaceholder(groupIds)})
    ORDER BY name
  `

  const stmt = database.prepare(query)
  const items = stmt.all(...groupIds) as StationSummaryRecord[]

  return convertStationSummaryRecordsToModel(items)
}

export const findStationSummariesFromKeyword = (database: DatabaseHandler, stationNamePart: string, limit: number): StationSummary[] => {
  const query = `
    SELECT id, group_id, partition_key, name, kind
    FROM stations 
    WHERE name LIKE ? 
    ORDER BY name
    LIMIT ?
  `
  
  const stmt = database.prepare(query)
  const searchPattern = `${stationNamePart}%`
  
  const items: any[] = stmt.all(searchPattern, limit) as StationSummaryRecord[]

  return convertStationSummaryRecordsToModel(items)
}

export const findStationSummariesFromId = (database: DatabaseHandler, ids: string[]): StationSummary[] => {
  const query = `
    SELECT id, group_id, partition_key, name, kind
    FROM stations 
    WHERE id in (${buildPlaceholder(ids)})
    ORDER BY name
  `

  const stmt = database.prepare(query)
  const items = stmt.all(...ids) as StationSummaryRecord[]

  return convertStationSummaryRecordsToModel(items)
}

export const findStationSummaryGroupsFromKeyword = (database: DatabaseHandler, stationNamePart: string, limit: number): StationSummaryGroup[] => {
  database.exec('PRAGMA case_sensitive_like=ON;')

  const query = `
    SELECT station_groups.id, station_groups.name, station_groups.kind, routes.id AS route_id, routes.name AS route_name, routes.company_id, companies.name AS company_name
    FROM station_groups
    INNER JOIN stations ON station_groups.id = stations.group_id
    INNER JOIN routes ON stations.route_id = routes.id
    INNER JOIN companies ON routes.company_id = companies.id
    WHERE station_groups.name LIKE ?
    LIMIT ?;
  `

  const stmt = database.prepare(query)
  const searchPattern = `${stationNamePart}%`
  
  const items: any[] = stmt.all(searchPattern, limit)

  return structureStationSummaryGroups(items);
}

const convertStationSummaryRecordsToModel = (items: StationSummaryRecord[]): StationSummary[] =>
  items.map(item => ({
    id: item.id,
    groupId: item.group_id,
    partitionKey: item.partition_key,
    name: item.name,
    kind: item.kind,
  }))

const createCompanySummaries = (
  items: { company_id: string; company_name: string }[]
): CompanySummary[] => {
  return [...new Map(items.map(item => [
    item.company_id, 
    { id: item.company_id, name: item.company_name }
  ])).values()];
};

const createRouteSummaries = (
  items: { route_id: string; route_name: string; company_id: string; company_name: string }[]
): RouteSummary[] => {
  const routeGroups = Object.groupBy(items, item => item.route_id);
  
  return Object.entries(routeGroups).map(([routeId, routeItems]) => ({
    id: routeId,
    name: routeItems![0].route_name,
    CompanySummaries: createCompanySummaries(routeItems!)
  }));
};

const structureStationSummaryGroups = (items: any[]): StationSummaryGroup[] => {
  if (items.length === 0) return [];
  
  const stationGroups = Object.groupBy(items, item => item.id);
  
  return Object.entries(stationGroups).map(([groupId, groupItems]) => ({
    id: groupId,
    name: groupItems![0].name,
    kind: groupItems![0].kind,
    routeSummaries: createRouteSummaries(groupItems!)
  }));
};
