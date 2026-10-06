import { NearbySearchError, requestNearbyFacilities } from "../../server/overpass-proxy";

export const handler = async (event: { httpMethod: string; body: string | null; isBase64Encoded: boolean }) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "method_not_allowed" }) };
  }

  let input: unknown;
  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64").toString("utf8")
      : event.body ?? "";
    input = JSON.parse(body);
  } catch {
    input = null;
  }

  try {
    return { statusCode: 200, body: JSON.stringify(await requestNearbyFacilities(input)) };
  } catch (error) {
    if (error instanceof NearbySearchError) {
      return {
        statusCode: error.status,
        body: JSON.stringify({ error: "nearby_search_failed", message: error.message }),
      };
    }
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "nearby_search_failed", message: "Nearby map search is temporarily unavailable. Please try again shortly." }),
    };
  }
};
