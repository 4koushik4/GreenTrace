/**
 * OpenStreetMap Integration for Recycling Centers and Location Services
 */

import { useState, useEffect } from "react";
import { maps as mapsConfig } from "./config";
import { supabase } from "./supabase";

// Location and map types
export interface Location {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RecyclingFacility {
  id: string;
  name: string;
  address: string;
  location: Location;
  amenity: string;
  recycling_type?: string[];
  opening_hours?: string;
  phone?: string;
  website?: string;
  distance?: number;
  rating?: number;
  reviews?: FacilityReview[];
  capacity?: {
    current: number;
    maximum: number;
    lastUpdated: string;
  };
  specialServices?: string[];
  acceptedWasteTypes?: WasteType[];
  operationalStatus?: "open" | "closed" | "maintenance" | "full";
  estimatedWaitTime?: number;
  facilities?: string[];
  accessibility?: AccessibilityFeatures;
  pricing?: PricingInfo;
  certifications?: string[];
  lastVerified?: string;
}

export interface FacilityReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export interface WasteType {
  type:
    | "biodegradable"
    | "recyclable"
    | "hazardous"
    | "electronic"
    | "textile"
    | "glass"
    | "plastic"
    | "metal"
    | "paper";
  subtypes?: string[];
  restrictions?: string[];
  processingFee?: number;
}

export interface AccessibilityFeatures {
  wheelchairAccessible?: boolean;
  brailleSignage?: boolean;
  audioInstructions?: boolean;
  lowCounterHeight?: boolean;
  visualAids?: boolean;
}

export interface PricingInfo {
  freeTypes: string[];
  paidTypes: { type: string; price: number; unit: string }[];
  membershipDiscount?: number;
  bulkDiscount?: number;
}

export interface RouteOptimization {
  distance: number;
  duration: number;
  steps: RouteStep[];
  trafficConditions?: "light" | "moderate" | "heavy";
  carbonFootprint?: number;
  alternativeRoutes: AlternativeRoute[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: Location[];
  maneuver: string;
}

export interface AlternativeRoute {
  name: string;
  distance: number;
  duration: number;
  description: string;
}

export interface GeocodeResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface FacilityFilters {
  wasteTypes: string[];
  maxDistance: number;
  openNow: boolean;
  highRating: boolean;
  freeOnly: boolean;
  accessibility?: string[];
  minRating?: number;
}

// Geolocation Hook
export const useGeolocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async (): Promise<Location> => {
    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by this browser"));
            return;
          }

          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          });
        },
      );

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setLocation(newLocation);
      return newLocation;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get location";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    loading,
    error,
    getCurrentLocation,
  };
};

// Geocoding Hook (convert address to coordinates)
export const useGeocoding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = async (address: string): Promise<GeocodeResult[]> => {
    setLoading(true);
    setError(null);

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "EcoSort-App/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const results = await response.json();
      return results;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Geocoding failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (
    lat: number,
    lng: number,
  ): Promise<GeocodeResult> => {
    setLoading(true);
    setError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "EcoSort-App/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Reverse geocoding failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    geocodeAddress,
    reverseGeocode,
    loading,
    error,
  };
};

// Enhanced Recycling Centers Search Hook with real-time data
export const useRecyclingCentersSearch = () => {
  const [centers, setCenters] = useState<RecyclingFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FacilityFilters>({
    wasteTypes: [],
    maxDistance: 10,
    openNow: false,
    highRating: false,
    freeOnly: false,
  });
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "name">(
    "distance",
  );

  const searchNearbyRecyclingCenters = async (
    location: Location,
    radiusKm: number = 10,
    options?: {
      wasteTypes?: string[];
      openNow?: boolean;
      includeReviews?: boolean;
      realTimeData?: boolean;
    },
  ): Promise<RecyclingFacility[]> => {
    setLoading(true);
    setError(null);

    try {
      // Calculate bounding box for search
      const earthRadius = 6371; // km
      const latDelta = (radiusKm / earthRadius) * (180 / Math.PI);
      const lngDelta =
        ((radiusKm / earthRadius) * (180 / Math.PI)) /
        Math.cos((location.lat * Math.PI) / 180);

      const bounds: MapBounds = {
        north: location.lat + latDelta,
        south: location.lat - latDelta,
        east: location.lng + lngDelta,
        west: location.lng - lngDelta,
      };

      // Search for recycling facilities using Overpass API
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="recycling"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["amenity"="waste_disposal"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["amenity"="waste_transfer_station"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          way["amenity"="recycling"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          way["amenity"="waste_disposal"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          relation["amenity"="recycling"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        );
        out center meta;
      `;

      const overpassUrl = "https://overpass-api.de/api/interpreter";
      const response = await fetch(overpassUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!response.ok) {
        throw new Error(`Overpass API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Process and format results with enhanced data
      const facilities: RecyclingFacility[] = await Promise.all(
        data.elements.map(async (element: any) => {
          const lat = element.lat || element.center?.lat;
          const lng = element.lon || element.center?.lon;

          if (!lat || !lng) return null;

          const facilityLocation = { lat, lng };
          const distance = calculateDistance(location, facilityLocation);

          // Get additional facility data
          const enrichedData = await enrichFacilityData(
            element.id.toString(),
            element.tags,
          );

          return {
            id: element.id.toString(),
            name:
              element.tags?.name ||
              element.tags?.operator ||
              "Recycling Center",
            address: formatAddress(element.tags),
            location: facilityLocation,
            amenity: element.tags?.amenity || "recycling",
            recycling_type: extractRecyclingTypes(element.tags),
            opening_hours: element.tags?.opening_hours,
            phone: element.tags?.phone,
            website: element.tags?.website,
            distance,
            ...enrichedData,
          };
        }),
      );

      const validFacilities = facilities.filter(Boolean);
      const filteredFacilities = applyFilters(validFacilities, filters);
      const sortedFacilities = sortFacilities(filteredFacilities, sortBy);

      setCenters(sortedFacilities);
      return sortedFacilities;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to search recycling centers";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getOptimizedRoute = async (
    start: Location,
    destination: Location,
    mode: "driving" | "walking" | "cycling" | "public" = "driving",
  ): Promise<RouteOptimization> => {
    // Implementation for route optimization with multiple transport modes
    return await calculateOptimizedRoute(start, destination, mode);
  };

  const getNearestFacilityByWasteType = async (
    location: Location,
    wasteType: string,
  ): Promise<RecyclingFacility | null> => {
    const facilities = await searchNearbyRecyclingCenters(location, 25, {
      wasteTypes: [wasteType],
    });
    return facilities.length > 0 ? facilities[0] : null;
  };

  const checkFacilityCapacity = async (
    facilityId: string,
  ): Promise<{ available: boolean; waitTime: number }> => {
    // Real-time capacity checking
    return await getRealTimeCapacity(facilityId);
  };

  const reportFacilityIssue = async (
    facilityId: string,
    issue: string,
  ): Promise<void> => {
    // Report facility issues or updates
    await submitFacilityReport(facilityId, issue);
  };

  return {
    centers,
    searchNearbyRecyclingCenters,
    getOptimizedRoute,
    getNearestFacilityByWasteType,
    checkFacilityCapacity,
    reportFacilityIssue,
    loading,
    error,
    filters,
    setFilters,
    sortBy,
    setSortBy,
  };
};

// Utility functions
export const calculateDistance = (
  point1: Location,
  point2: Location,
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatAddress = (tags: any): string => {
  const parts = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);

  return parts.length > 0 ? parts.join(", ") : "Address not available";
};

const extractRecyclingTypes = (tags: any): string[] => {
  const types: string[] = [];

  // Check for specific recycling types
  const recyclingKeys = Object.keys(tags).filter((key) =>
    key.startsWith("recycling:"),
  );
  recyclingKeys.forEach((key) => {
    if (tags[key] === "yes") {
      const type = key.replace("recycling:", "");
      types.push(type);
    }
  });

  return types;
};

// Generate directions URL
export const getDirectionsUrl = (from: Location, to: Location): string => {
  // Use OpenStreetMap-based routing
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${from.lat}%2C${from.lng}%3B${to.lat}%2C${to.lng}`;
};

// Generate static map image URL
export const getStaticMapUrl = (
  center: Location,
  zoom: number = 15,
  width: number = 400,
  height: number = 300,
  markers: Location[] = [],
): string => {
  // Using a static map service compatible with OpenStreetMap
  let url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/`;

  if (mapsConfig.mapboxToken) {
    // Add markers
    if (markers.length > 0) {
      const markerString = markers
        .map((marker) => `pin-s+ff0000(${marker.lng},${marker.lat})`)
        .join(",");
      url += `${markerString}/`;
    }

    url += `${center.lng},${center.lat},${zoom}/${width}x${height}@2x?access_token=${mapsConfig.mapboxToken}`;
  } else {
    const markerParams = markers
      .map((marker) => `&markers=${marker.lat},${marker.lng},red-pushpin`)
      .join("");
    url = `https://staticmap.openstreetmap.de/staticmap.php?center=${center.lat},${center.lng}&zoom=${zoom}&size=${width}x${height}${markerParams}`;
  }

  return url;
};

// Enhanced utility functions for facility management
const enrichFacilityData = async (
  _facilityId: string,
  tags: any,
): Promise<Partial<RecyclingFacility>> => {
  return {
    specialServices: getSpecialServices(tags),
    acceptedWasteTypes: getAcceptedWasteTypes(tags),
    facilities: getFacilities(tags),
    accessibility: getAccessibilityFeatures(tags),
  };
};

const getSpecialServices = (tags: any): string[] => {
  const services = [];
  if (tags["service:electronics"] === "yes") services.push("Electronics recycling");
  if (tags["service:pickup"] === "yes") services.push("Pickup service");
  if (tags["service:sorting"] === "yes") services.push("Sorting assistance");
  if (tags["service:education"] === "yes") services.push("Educational tours");
  return services;
};

const getAcceptedWasteTypes = (tags: any): WasteType[] => {
  const types: WasteType[] = [];

  if (tags["recycling:plastic"] === "yes") {
    types.push({
      type: "plastic",
    });
  }

  if (tags["recycling:glass"] === "yes") {
    types.push({
      type: "glass",
    });
  }

  if (tags["recycling:metal"] === "yes") {
    types.push({
      type: "metal",
    });
  }

  return types;
};

const getFacilities = (tags: any): string[] => {
  const facilities = [];
  if (tags["parking"] === "yes") facilities.push("Parking available");
  if (tags["toilets"] === "yes") facilities.push("Restrooms");
  if (tags["cafe"] === "yes") facilities.push("Café");
  return facilities;
};

const getAccessibilityFeatures = (tags: any): AccessibilityFeatures | undefined => {
  const features: AccessibilityFeatures = {};
  if (tags["wheelchair"] === "yes" || tags["wheelchair"] === "no") {
    features.wheelchairAccessible = tags["wheelchair"] === "yes";
  }
  if (tags["braille"] === "yes" || tags["braille"] === "no") {
    features.brailleSignage = tags["braille"] === "yes";
  }
  if (tags["audio"] === "yes" || tags["audio"] === "no") {
    features.audioInstructions = tags["audio"] === "yes";
  }
  if (tags["low_counter"] === "yes" || tags["low_counter"] === "no") {
    features.lowCounterHeight = tags["low_counter"] === "yes";
  }
  if (tags["visual_aids"] === "yes" || tags["visual_aids"] === "no") {
    features.visualAids = tags["visual_aids"] === "yes";
  }
  return Object.keys(features).length > 0 ? features : undefined;
};

const applyFilters = (
  facilities: RecyclingFacility[],
  filters: FacilityFilters,
): RecyclingFacility[] => {
  return facilities.filter((facility) => {
    // Distance filter
    if (facility.distance && facility.distance > filters.maxDistance)
      return false;

    // Waste type filter
    if (filters.wasteTypes.length > 0) {
      const facilityTypes =
        facility.acceptedWasteTypes?.map((wt) => wt.type) || [];
      if (
        !filters.wasteTypes.some((type) => facilityTypes.includes(type as any))
      )
        return false;
    }

    // Open now filter
    if (filters.openNow && facility.operationalStatus !== "open") return false;

    // High rating filter
    if (filters.highRating && (facility.rating || 0) < 4.0) return false;

    // Free only filter
    if (filters.freeOnly) {
      const hasPaidTypes =
        facility.pricing?.paidTypes && facility.pricing.paidTypes.length > 0;
      if (!facility.pricing || hasPaidTypes) return false;
    }

    // Minimum rating filter
    if (filters.minRating && (facility.rating || 0) < filters.minRating)
      return false;

    return true;
  });
};

const sortFacilities = (
  facilities: RecyclingFacility[],
  sortBy: "distance" | "rating" | "name",
): RecyclingFacility[] => {
  return [...facilities].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        return (a.distance || 0) - (b.distance || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
};

const calculateOptimizedRoute = async (
  start: Location,
  destination: Location,
  mode: "driving" | "walking" | "cycling" | "public",
): Promise<RouteOptimization> => {
  if (mode === "public") {
    throw new Error("Public transit routing is not available from the configured map service.");
  }

  const profile = {
    driving: "routed-car",
    cycling: "routed-bike",
    walking: "routed-foot",
  }[mode];
  const coordinates = `${start.lng},${start.lat};${destination.lng},${destination.lat}`;
  const url = `https://routing.openstreetmap.de/${profile}/route/v1/driving/${coordinates}?overview=full&steps=true&alternatives=true&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Route service request failed: ${response.statusText}`);
  }

  const result = await response.json();
  const primaryRoute = result.routes?.[0];
  if (!primaryRoute || !Array.isArray(primaryRoute.legs)) {
    throw new Error("Route service returned no usable route.");
  }

  const steps: RouteStep[] = primaryRoute.legs.flatMap((leg: any) =>
    (leg.steps ?? []).map((step: any) => {
      const maneuver = step.maneuver ?? {};
      const instruction = [maneuver.type, maneuver.modifier, step.name]
        .filter(Boolean)
        .join(" ");
      const coordinates = step.geometry?.coordinates ?? [];
      return {
        instruction: instruction || "Continue",
        distance: Number(step.distance ?? 0) / 1000,
        duration: Number(step.duration ?? 0) / 60,
        coordinates: coordinates.map(([lng, lat]: [number, number]) => ({
          lat,
          lng,
        })),
        maneuver: maneuver.type ?? "continue",
      };
    }),
  );

  const alternatives: AlternativeRoute[] = (result.routes ?? [])
    .slice(1)
    .map((route: any, index: number) => ({
      name: `Alternative route ${index + 1}`,
      distance: Number(route.distance) / 1000,
      duration: Number(route.duration) / 60,
      description: "Alternative route from OpenStreetMap routing.",
    }));

  return {
    distance: Number(primaryRoute.distance) / 1000,
    duration: Number(primaryRoute.duration) / 60,
    steps,
    alternativeRoutes: alternatives,
  };
};

const getRealTimeCapacity = async (
  facilityId: string,
): Promise<{ available: boolean; waitTime: number }> => {
  throw new Error(`Live capacity data is not available for facility ${facilityId}.`);
};

const submitFacilityReport = async (
  facilityId: string,
  issue: string,
): Promise<void> => {
  if (!supabase) {
    throw new Error("Supabase must be configured to submit a facility report.");
  }

  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!data.user) {
    throw new Error("Sign in to submit a facility report.");
  }

  const { error } = await supabase.from("waste_reports").insert({
    citizen_id: data.user.id,
    title: "Recycling facility issue",
    description: `Facility ${facilityId}: ${issue}`,
    category: "other",
  });
  if (error) throw error;
};
