import "@typespec/http";
import "./models/stationSummary.tsp";

using Http;
@service(#{ title: "Sansaku API" })
namespace SansakuApi;

@error
@mediaTypeHint("application/problem+json")
model Error {
  type: string;
  title: string;
}

@route("/stations")
@tag("StationSummaryGroup")
interface StationSummaryGroup {
  @get list(@query name: string): StationSummaryGroupList | Error;
}

@route("/transfer")
@tag("Transfer")
interface Transfer {
  @get list(@query from: string, @query to: string): StationSummaryList | Error;
}
