import { useCallback, useState } from "react";
import { config } from "./config";
import { supabase } from "./supabase";

const PREDICTION_URL = "https://greentrace-wbqx.onrender.com/predict";

export type ClassificationResult = {
  detailedClass: string;
  category: "organic" | "recyclable" | "non-recyclable";
  confidence: number;
  processingTime?: number;
  tips?: string[];
  disposalMethod?: string;
};

type WasteClassInfo = {
  category: ClassificationResult["category"];
  tips: string[];
  disposalMethod: string;
};

const WASTE_CLASS_INFO: Record<string, WasteClassInfo> = {
  organic: { category: "organic", tips: ["Compost properly"], disposalMethod: "Compost bin" },
  cardboard: { category: "recyclable", tips: ["Flatten boxes"], disposalMethod: "Recycle bin" },
  glass: { category: "recyclable", tips: ["Rinse bottles"], disposalMethod: "Recycle bin" },
  metal: { category: "recyclable", tips: ["Crush cans"], disposalMethod: "Recycle bin" },
  paper: { category: "recyclable", tips: ["Keep dry"], disposalMethod: "Recycle bin" },
  plastic: { category: "recyclable", tips: ["Rinse containers"], disposalMethod: "Recycle bin" },
  trash: { category: "non-recyclable", tips: ["Dispose safely"], disposalMethod: "Landfill" },
};

type PredictionResponse = {
  class?: unknown;
  class_name?: unknown;
  confidence?: unknown;
  processingTime?: unknown;
  error?: unknown;
  message?: unknown;
  details?: unknown;
};

const responseErrorMessage = (data: PredictionResponse, status: number) => {
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  if (typeof data.error === "string" && data.error.trim()) {
    if (data.error === "classification_service_not_configured") {
      return "The waste classification model is not configured on the backend.";
    }
    if (data.error === "classification_service_unavailable") {
      return "The waste classification model is unavailable. Please try again later.";
    }
    return data.error.replace(/_/g, " ");
  }
  return `The classification backend returned an error (${status}).`;
};

export async function classifyWaste(file: File): Promise<ClassificationResult> {
  const startedAt = performance.now();
  const form = new FormData();
  form.append("image", file);

  let response: Response;
  try {
    response = await fetch(PREDICTION_URL, { method: "POST", body: form });
  } catch {
    throw new Error("The classification backend is unavailable. Check the app API connection and try again.");
  }

  let data: PredictionResponse;
  try {
    data = await response.json() as PredictionResponse;
  } catch {
    throw new Error("The classification backend returned an invalid response.");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The classification backend returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(responseErrorMessage(data, response.status));
  }

  const predictedClass = data.class ?? data.class_name;
  if (typeof predictedClass !== "string" || !predictedClass.trim()) {
    throw new Error("The classification backend returned no waste class.");
  }
  const confidenceIsPercentage = typeof data.class_name === "string";
  const maxConfidence = confidenceIsPercentage ? 100 : 1;
  if (
    typeof data.confidence !== "number" ||
    !Number.isFinite(data.confidence) ||
    data.confidence < 0 ||
    data.confidence > maxConfidence
  ) {
    throw new Error("The classification backend returned an invalid confidence score.");
  }

  const classKey = predictedClass.trim().toLowerCase();
  const info = WASTE_CLASS_INFO[classKey];
  if (!info) {
    throw new Error(`The model returned an unsupported waste class: ${predictedClass.trim()}.`);
  }
  if (data.processingTime !== undefined && (
    typeof data.processingTime !== "number" ||
    !Number.isFinite(data.processingTime) ||
    data.processingTime < 0
  )) {
    throw new Error("The classification backend returned an invalid processing time.");
  }

  return {
    detailedClass: classKey,
    category: info.category,
    confidence: confidenceIsPercentage ? data.confidence : data.confidence * 100,
    processingTime: typeof data.processingTime === "number"
      ? data.processingTime
      : Math.round(performance.now() - startedAt),
    tips: info.tips,
    disposalMethod: info.disposalMethod,
  };
}

export async function persistWasteClassification(
  result: ClassificationResult,
  userId: string,
) {
  if (!supabase) {
    throw new Error("Supabase is not configured, so this classification could not be saved.");
  }

  const { error } = await supabase.from("waste_classifications").insert({
    user_id: userId,
    classification: result.category,
    confidence: result.confidence / 100,
    details: {
      detailed_class: result.detailedClass,
      category: result.category,
      confidence_percent: result.confidence,
      disposal_method: result.disposalMethod ?? null,
      tips: result.tips ?? [],
      processing_time_ms: result.processingTime ?? null,
    },
  });

  if (error) {
    throw new Error(`Classification succeeded, but could not be saved: ${error.message}`);
  }
}

export function validateImageForClassification(file: File) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return { isValid: false, error: "Invalid image format" };
  if (file.size > config.defaults.maxUploadSize) return { isValid: false, error: "File too large" };
  return { isValid: true, error: null };
}

export function useWasteClassification() {
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  const classify = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const result = await classifyWaste(file);
      setModelReady(true);
      return result;
    } catch (error) {
      setModelReady(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { classifyWaste: classify, loading, modelReady };
}
