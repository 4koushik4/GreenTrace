import { describe, expect, it } from "vitest";
import { getWasteCategory } from "./waste-classification";

describe("getWasteCategory", () => {
  it.each([
    ["BIODEGRADABLE", "biodegradable"],
    ["CARDBOARD", "recyclable"],
    ["CERAMIC", "non_biodegradable"],
    ["CLOTH", "recyclable"],
    ["ELECTRONIC WASTE", "hazardous"],
    ["GLASS", "recyclable"],
    ["HAZARDOUS", "hazardous"],
    ["METAL", "recyclable"],
    ["PAPER", "recyclable"],
    ["PLASTIC", "non_biodegradable"],
  ])("maps %s to %s", (material, categoryKey) => {
    expect(getWasteCategory(material)?.categoryKey).toBe(categoryKey);
  });

  it("stores non-biodegradable with the normalized database key", () => {
    expect(getWasteCategory("plastic")).toMatchObject({
      categoryKey: "non_biodegradable",
      label: "Non-Biodegradable",
      classification: "non_biodegradable",
    });
  });

  it("normalizes separators and returns no category for an unknown class", () => {
    expect(getWasteCategory("electronic_waste")?.categoryKey).toBe("hazardous");
    expect(getWasteCategory("unknown material")).toBeUndefined();
  });
});
