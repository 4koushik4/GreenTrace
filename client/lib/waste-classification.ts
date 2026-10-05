export const MATERIAL_CATEGORY_MAP = {
  biodegradable: "biodegradable",
  cardboard: "recyclable",
  ceramic: "non_biodegradable",
  cloth: "recyclable",
  "electronic waste": "hazardous",
  glass: "recyclable",
  hazardous: "hazardous",
  metal: "recyclable",
  paper: "recyclable",
  plastic: "non_biodegradable",
} as const;

export const WASTE_CATEGORY_DETAILS = {
  biodegradable: { label: "Biodegradable", classification: "biodegradable" },
  recyclable: { label: "Recyclable", classification: "recyclable" },
  non_biodegradable: { label: "Non-Biodegradable", classification: "non-recyclable" },
  hazardous: { label: "Hazardous", classification: "hazardous" },
} as const;

export type WasteCategoryKey = keyof typeof WASTE_CATEGORY_DETAILS;

export const normalizeMaterialKey = (material: string) =>
  material.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

export const formatMaterial = (materialKey: string) =>
  materialKey.replace(/\b\w/g, (character) => character.toUpperCase());

export const getWasteCategory = (material: string) => {
  const materialKey = normalizeMaterialKey(material);
  const categoryKey = MATERIAL_CATEGORY_MAP[materialKey as keyof typeof MATERIAL_CATEGORY_MAP];
  if (!categoryKey) return undefined;

  return {
    categoryKey,
    ...WASTE_CATEGORY_DETAILS[categoryKey],
  };
};
