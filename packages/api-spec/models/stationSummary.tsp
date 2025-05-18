model StationSummaryGroup {
  id: string;
  name: string;
  kind: string;
  routeSummries: {
    id: string,
    name: string,
    companyId: string
  }[]
}

model StationSummary {
  id: string;
  name: string;
  kind: string;
  routeName: string;
}

model StationSummaryList {
  items: StationSummary[];
}

model StationSummaryGroupList {
  items: StationSummaryGroup[];
}
