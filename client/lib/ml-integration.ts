import { useCallback, useEffect, useState } from "react";

export type ClassificationResult = {
  detailedClass: string;
  category: "organic" | "recyclable" | "non-recyclable";
  confidence: number;
  processingTime?: number;
  tips?: string[];
  disposalMethod?: string;
};

const WASTE_CLASS_INFO: any = {
  organic: { category: "organic", tips: ["Compost properly"], disposalMethod: "Compost bin" },
  cardboard: { category: "recyclable", tips: ["Flatten boxes"], disposalMethod: "Recycle bin" },
  glass: { category: "recyclable", tips: ["Rinse bottles"], disposalMethod: "Recycle bin" },
  metal: { category: "recyclable", tips: ["Crush cans"], disposalMethod: "Recycle bin" },
  paper: { category: "recyclable", tips: ["Keep dry"], disposalMethod: "Recycle bin" },
  plastic: { category: "recyclable", tips: ["Rinse containers"], disposalMethod: "Recycle bin" },
  trash: { category: "non-recyclable", tips: ["Dispose safely"], disposalMethod: "Landfill" }
};

export async function classifyWaste(file: File): Promise<ClassificationResult> {
  const t0 = performance.now();

  const form = new FormData();
  form.append("image", file);

  const res = await fetch("http://localhost:5001/predict", {
    method: "POST",
    body: form
  });

  if (!res.ok) throw new Error("Prediction API failed");

  const data = await res.json();

  const classKey = data.class_name.toLowerCase();
  const info = WASTE_CLASS_INFO[classKey] || WASTE_CLASS_INFO["trash"];

  const t1 = performance.now();

  return {
    detailedClass: classKey,
    category: info.category,
    confidence: Math.round(Number(data.confidence)),
    processingTime: Math.round(t1 - t0),
    tips: info.tips,
    disposalMethod: info.disposalMethod
  };
}


export function validateImageForClassification(file: File) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return { isValid: false, error: "Invalid image format" };
  if (file.size > 5 * 1024 * 1024) return { isValid: false, error: "File too large" };
  return { isValid: true, error: null };
}

export function useWasteClassification() {
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(true);

  useEffect(() => setModelReady(true), []);

  const classify = useCallback(async (file: File) => {
    setLoading(true);
    try {
      return await classifyWaste(file);
    } finally {
      setLoading(false);
    }
  }, []);

  return { classifyWaste: classify, loading, modelReady };
}
