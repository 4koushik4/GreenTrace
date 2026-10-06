import { NearbySearchError, requestNearbyFacilities } from "../server/overpass-proxy";

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

export const config = { maxDuration: 45 };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    return res.status(200).json(await requestNearbyFacilities(req.body));
  } catch (error) {
    if (error instanceof NearbySearchError) {
      return res.status(error.status).json({ error: "nearby_search_failed", message: error.message });
    }
    return res.status(502).json({ error: "nearby_search_failed", message: "Nearby map search is temporarily unavailable. Please try again shortly." });
  }
}
