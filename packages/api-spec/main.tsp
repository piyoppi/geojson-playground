import "@typespec/http";
import "./components/stationSummary.tsp";

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
@tag("StationSummaries")
interface StationSummaries {
  @get list(@query name: string): StationSummaryList | Error;
}
