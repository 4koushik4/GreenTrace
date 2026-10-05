import { useCallback, useState } from "react";
import { config } from "./config";
import { supabase } from "./supabase";
import {
  predictWaste,
  RoboflowPredictionError,
  ROBOFLOW_CONFIDENCE_THRESHOLD,
  type PredictionPhase,
  type WasteDetection,
} from "./roboflow";
import { getWasteCategory, type WasteCategoryKey } from "./waste-classification";

export type ClassificationResult = {
  detailedClass: string;
  material: string;
  materialKey: string;
  category: string;
  categoryKey: WasteCategoryKey;
  classification: "biodegradable" | "recyclable" | "hazardous" | "non-recyclable";
  confidence: number;
  predictions: WasteDetection[];
  processingTime?: number;
  tips?: string[];
  disposalMethod?: string;
};

export type ClassificationErrorStatus = "low_confidence" | "no_detection" | "api_error" | "network_error" | "timeout" | "invalid_image" | "not_configured";

export class WasteClassificationError extends Error {
  constructor(
    public readonly status: ClassificationErrorStatus,
    message: string,
  ) {
    super(message);
    this.name = "WasteClassificationError";
  }
}

const MATERIAL_GUIDANCE: Record<string, { tips: string[]; disposalMethod: string }> = {
  biodegradable: { tips: ["Compost in a suitable organic-waste bin."], disposalMethod: "Compost bin" },
  cardboard: { tips: ["Flatten and keep dry."], disposalMethod: "Recycling bin" },
  ceramic: { tips: ["Check local guidance; ceramics are not accepted with glass recycling."], disposalMethod: "General waste" },
  cloth: { tips: ["Donate wearable items or use a textile collection point."], disposalMethod: "Textile collection" },
  "electronic waste": { tips: ["Use an authorized e-waste collection point."], disposalMethod: "E-waste collection" },
  glass: { tips: ["Rinse containers and separate lids where required."], disposalMethod: "Glass recycling" },
  hazardous: { tips: ["Follow local hazardous-waste drop-off guidance."], disposalMethod: "Hazardous-waste collection" },
  metal: { tips: ["Empty and rinse containers."], disposalMethod: "Metal recycling" },
  paper: { tips: ["Keep paper clean and dry."], disposalMethod: "Paper recycling" },
  plastic: { tips: ["Rinse containers and check local recycling rules."], disposalMethod: "Plastic recycling" },
};

export function validateImageForClassification(file: File) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { isValid: false, error: "Please choose a JPG, PNG, or WEBP image." };
  }
  if (file.size === 0 || file.size > config.defaults.maxUploadSize) {
    return { isValid: false, error: "Choose an image smaller than 10 MB." };
  }
  return { isValid: true, error: null };
}

const mapPredictionError = (error: unknown): WasteClassificationError => {
  if (error instanceof RoboflowPredictionError) {
    return new WasteClassificationError(error.kind, error.message);
  }
  return new WasteClassificationError("api_error", "Unable to analyze this image. Please try again.");
};

export async function classifyWaste(
  file: File,
  onPhase?: (phase: PredictionPhase) => void,
): Promise<ClassificationResult> {
  const validation = validateImageForClassification(file);
  if (!validation.isValid) {
    throw new WasteClassificationError("invalid_image", validation.error ?? "Please choose a supported image.");
  }

  const startedAt = performance.now();
  let prediction;
  try {
    prediction = await predictWaste(file, onPhase);
  } catch (error) {
    throw mapPredictionError(error);
  }

  const validPredictions = prediction.predictions
    .filter((detection) => getWasteCategory(detection.materialKey))
    .sort((a, b) => b.confidence - a.confidence);
  const primary = validPredictions[0];

  if (!primary) {
    throw new WasteClassificationError(
      "no_detection",
      prediction.status === "no_detection"
        ? prediction.message
        : "No supported waste material was found. Please try another image.",
    );
  }

  const category = getWasteCategory(primary.materialKey);
  if (!category) {
    throw new WasteClassificationError("no_detection", "No supported waste material was found. Please try another image.");
  }
  if (primary.confidence < ROBOFLOW_CONFIDENCE_THRESHOLD) {
    throw new WasteClassificationError(
      "low_confidence",
      "Waste could not be identified confidently. Please capture a clearer image.",
    );
  }

  const guidance = MATERIAL_GUIDANCE[primary.materialKey];
  return {
    detailedClass: primary.material,
    material: primary.material,
    materialKey: primary.materialKey,
    category: category.label,
    categoryKey: category.categoryKey,
    classification: category.classification,
    confidence: primary.confidence,
    predictions: prediction.predictions,
    processingTime: Math.round(performance.now() - startedAt),
    tips: guidance?.tips,
    disposalMethod: guidance?.disposalMethod,
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
    classification: result.classification,
    confidence: result.confidence,
    details: {
      detailed_class: result.material,
      material: result.material,
      material_key: result.materialKey,
      category: result.category,
      category_key: result.categoryKey,
      confidence_percent: Math.round(result.confidence * 100),
      predictions: result.predictions,
      disposal_method: result.disposalMethod ?? null,
      tips: result.tips ?? [],
      processing_time_ms: result.processingTime ?? null,
    },
  });

  if (error) {
    throw new Error(`Classification succeeded, but could not be saved: ${error.message}`);
  }
}

export function useWasteClassification() {
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [phase, setPhase] = useState<PredictionPhase | null>(null);

  const classify = useCallback(async (file: File) => {
    setLoading(true);
    setPhase("preparing_image");
    try {
      const result = await classifyWaste(file, setPhase);
      setModelReady(true);
      return result;
    } catch (error) {
      setModelReady(false);
      throw error;
    } finally {
      setLoading(false);
      setPhase(null);
    }
  }, []);

  return { classifyWaste: classify, loading, modelReady, phase };
}
