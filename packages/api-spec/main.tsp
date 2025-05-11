import "@typespec/http";

using Http;
@service(#{ title: "Sansaku API" })
namespace SansakuApi;

model StationSummary {
  id: string;
  name: string;
  routeName: string
}

model StationSummaryList {
  items: StationSummary[];
}

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
