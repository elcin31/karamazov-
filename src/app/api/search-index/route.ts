import { getSearchIndex } from "@/lib/search-index";

// This index contains public, versioned museum material only. Browser-local
// reading progress is applied by the client, never sent to this endpoint.
export const dynamic = "force-static";
export function GET() {
  return Response.json(getSearchIndex(true), {
    headers: {
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
