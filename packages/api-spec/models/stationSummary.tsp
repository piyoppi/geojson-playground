model StationSummaryGroup {
  id: string;
  name: string;
  kind: string;
  routeSummaries: {
    id: string,
    name: string,
    companyId: string
  }[]
}

model StationSummary {
  id: string;
  name: string;
  routeNames: string[];
}

model StationSummaryList {
  items: StationSummary[];
}

model StationSummaryGroupList {
  items: StationSummaryGroup[];
}
