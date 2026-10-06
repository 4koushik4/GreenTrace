import { ROBOFLOW_ENDPOINT } from "../shared/roboflow.js";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_IMAGE_LENGTH = 14_000_000;

type ProxyErrorKind = "invalid_request" | "not_configured" | "timeout" | "network_error" | "upstream_error";

const publicErrors: Record<ProxyErrorKind, { status: number; message: string }> = {
  invalid_request: { status: 400, message: "Choose a supported image smaller than 10 MB." },
  not_configured: { status: 503, message: "Roboflow is not configured on the server." },
  timeout: { status: 504, message: "Image analysis timed out. Please try again." },
  network_error: { status: 502, message: "Unable to connect to Roboflow. Check your connection and try again." },
  upstream_error: { status: 502, message: "Unable to analyze this image. Please try again." },
};

export class RoboflowProxyError extends Error {
  readonly status: number;
  readonly code: ProxyErrorKind;

  constructor(kind: ProxyErrorKind) {
    const error = publicErrors[kind];
    super(error.message);
    this.name = "RoboflowProxyError";
    this.status = error.status;
    this.code = kind;
  }
}

export async function requestRoboflowPrediction(image: string) {
  if (!image || image.length > MAX_IMAGE_LENGTH || !/^[A-Za-z0-9+/]+=*$/.test(image)) {
    throw new RoboflowProxyError("invalid_request");
  }

  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) throw new RoboflowProxyError("not_configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(ROBOFLOW_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: image,
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeout);
    throw new RoboflowProxyError(controller.signal.aborted ? "timeout" : "network_error");
  }
  clearTimeout(timeout);

  if (!response.ok) throw new RoboflowProxyError("upstream_error");

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new RoboflowProxyError("upstream_error");
  }

  if (!result || typeof result !== "object" || !Array.isArray((result as { predictions?: unknown }).predictions)) {
    throw new RoboflowProxyError("upstream_error");
  }

  return result;
}
