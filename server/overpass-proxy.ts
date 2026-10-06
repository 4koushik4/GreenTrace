const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RADIUS_METERS = 50_000;

export class NearbySearchError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "NearbySearchError";
    this.status = status;
  }
}

export async function requestNearbyFacilities(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new NearbySearchError("A location is required to search nearby centers.", 400);
  }

  const { lat, lng, radiusMeters } = input as Record<string, unknown>;
  if (
    typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90 ||
    typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180 ||
    typeof radiusMeters !== "number" || !Number.isFinite(radiusMeters) || radiusMeters < 1 || radiusMeters > MAX_RADIUS_METERS
  ) {
    throw new NearbySearchError("Choose a valid location and search radius.", 400);
  }

  const query = `[out:json][timeout:10];nwr(around:${Math.round(radiusMeters)},${lat},${lng})["amenity"~"^(recycling|waste_disposal|waste_transfer_station)$"];out center tags;`;
  const failures: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "GreenTrace/1.0",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) {
        failures.push(`${new URL(endpoint).host} returned HTTP ${response.status}`);
        continue;
      }

      return await response.json();
    } catch (error) {
      failures.push(
        error instanceof Error && error.name === "AbortError"
          ? `${new URL(endpoint).host} timed out`
          : `${new URL(endpoint).host} could not be reached`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new NearbySearchError(
    `Nearby map search is temporarily unavailable. Overpass services did not respond (${failures.join("; ")}). Please try again shortly.`,
    502,
  );
}
