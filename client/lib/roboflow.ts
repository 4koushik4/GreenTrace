import { config } from "./config";
import { formatMaterial, normalizeMaterialKey } from "./waste-classification";

export const ROBOFLOW_MODEL = "kou-551wn/garbage-classification-model-v1-sfvrl-2-rfdetr-medium-t1";
const ROBOFLOW_API_URL = "https://serverless.roboflow.com";
const ROBOFLOW_API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY;
export const ROBOFLOW_CONFIDENCE_THRESHOLD = 0.5;
const REQUEST_TIMEOUT_MS = 30_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type WasteDetection = {
  material: string;
  materialKey: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
};

export type WastePrediction =
  | {
      status: "success";
      material: string;
      materialKey: string;
      confidence: number;
      predictions: WasteDetection[];
    }
  | {
      status: "low_confidence";
      message: string;
      primary: WasteDetection;
      predictions: WasteDetection[];
    }
  | {
      status: "no_detection";
      message: string;
      predictions: WasteDetection[];
    };

export type PredictionPhase = "preparing_image" | "scanning" | "predicting";
export type PredictionErrorKind = "invalid_image" | "missing_api_key" | "timeout" | "network_error" | "api_error";

export class RoboflowPredictionError extends Error {
  constructor(public readonly kind: PredictionErrorKind) {
    super(predictionErrorMessage(kind));
    this.name = "RoboflowPredictionError";
  }
}

const predictionErrorMessage = (kind: PredictionErrorKind) => {
  switch (kind) {
    case "invalid_image":
      return "Please choose a JPG, PNG, or WEBP image under 10 MB.";
    case "missing_api_key":
      return "Roboflow is not configured. Add VITE_ROBOFLOW_API_KEY to the Vite environment.";
    case "timeout":
      return "Image analysis timed out. Please try again.";
    case "network_error":
      return "Unable to connect to Roboflow. Check your connection and try again.";
    case "api_error":
      return "Unable to analyze this image. Please try again.";
  }
};

const encodeImage = async (image: Blob) => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new RoboflowPredictionError("invalid_image"));
    reader.onerror = () => reject(new RoboflowPredictionError("invalid_image"));
    reader.readAsDataURL(image);
  });
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) throw new RoboflowPredictionError("invalid_image");
  return dataUrl.slice(commaIndex + 1);
};

const parseDetections = (data: unknown): WasteDetection[] => {
  if (!data || typeof data !== "object" || !Array.isArray((data as { predictions?: unknown }).predictions)) {
    throw new RoboflowPredictionError("api_error");
  }

  return (data as { predictions: unknown[] }).predictions.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const prediction = value as Record<string, unknown>;
    const rawMaterial = prediction.class;
    const confidence = prediction.confidence;
    if (
      typeof rawMaterial !== "string" ||
      !rawMaterial.trim() ||
      typeof confidence !== "number" ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1
    ) return [];

    const boundingBox = [prediction.x, prediction.y, prediction.width, prediction.height];
    const hasBoundingBox = boundingBox.every((part) => typeof part === "number" && Number.isFinite(part));
    const materialKey = normalizeMaterialKey(rawMaterial);

    return [{
      material: formatMaterial(materialKey),
      materialKey,
      confidence,
      ...(hasBoundingBox && {
        boundingBox: {
          x: prediction.x as number,
          y: prediction.y as number,
          width: prediction.width as number,
          height: prediction.height as number,
        },
      }),
    }];
  });
};

export async function predictWaste(
  image: File | Blob,
  onPhase?: (phase: PredictionPhase) => void,
): Promise<WastePrediction> {
  if (!ALLOWED_IMAGE_TYPES.has(image.type) || image.size === 0 || image.size > config.defaults.maxUploadSize) {
    throw new RoboflowPredictionError("invalid_image");
  }
  if (!ROBOFLOW_API_KEY) throw new RoboflowPredictionError("missing_api_key");

  onPhase?.("preparing_image");
  const encodedImage = await encodeImage(image);
  onPhase?.("scanning");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${ROBOFLOW_API_URL}/${ROBOFLOW_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ROBOFLOW_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: encodedImage,
      signal: controller.signal,
    });
  } catch {
    window.clearTimeout(timeout);
    throw new RoboflowPredictionError(controller.signal.aborted ? "timeout" : "network_error");
  }
  window.clearTimeout(timeout);
  onPhase?.("predicting");

  if (!response.ok) throw new RoboflowPredictionError("api_error");

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new RoboflowPredictionError("api_error");
  }

  const predictions = parseDetections(data);
  if (!predictions.length) {
    return {
      status: "no_detection",
      message: "No waste was detected in this image. Please try another photo.",
      predictions,
    };
  }

  const primary = predictions.reduce((best, prediction) =>
    prediction.confidence > best.confidence ? prediction : best,
  );
  if (primary.confidence < ROBOFLOW_CONFIDENCE_THRESHOLD) {
    return {
      status: "low_confidence",
      message: "Waste could not be identified confidently. Please capture a clearer image.",
      primary,
      predictions,
    };
  }

  return {
    status: "success",
    material: primary.material,
    materialKey: primary.materialKey,
    confidence: primary.confidence,
    predictions,
  };
}
