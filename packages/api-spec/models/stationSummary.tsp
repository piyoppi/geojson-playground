model StationSummaryGroup {
  id: string;
  name: string;
}

model StationSummary {
  id: string;
  name: string;
  routeName: string;
}

model StationSummaryList {
  items: StationSummary[];
}

model StationSummaryGroupList {
  items: StationSummaryGroup[];
}
