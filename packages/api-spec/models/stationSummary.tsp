model StationSummary {
  id: string;
  name: string;
  routeName: string
}

model StationSummaryList {
  items: StationSummary[];
}
