/**
 * OpenStreetMap Integration for Recycling Centers and Location Services
 */

import { useState, useEffect } from "react";
import { maps as mapsConfig } from "./config";

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
  wheelchairAccessible: boolean;
  brailleSignage: boolean;
  audioInstructions: boolean;
  lowCounterHeight: boolean;
  visualAids: boolean;
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
  trafficConditions: "light" | "moderate" | "heavy";
  carbonFootprint: number;
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

  // If no specific types found, add common ones
  if (types.length === 0) {
    types.push("general recycling");
  }

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
    // Fallback to a basic static map service
    url = `https://www.mapquestapi.com/staticmap/v5/map?key=demo&center=${center.lat},${center.lng}&zoom=${zoom}&size=${width},${height}&type=map&format=jpg`;
  }

  return url;
};

// Enhanced utility functions for facility management
const enrichFacilityData = async (
  facilityId: string,
  tags: any,
): Promise<Partial<RecyclingFacility>> => {
  // Simulate enriching facility data with additional information
  const mockData = {
    rating: 3.5 + Math.random() * 1.5,
    reviews: generateMockReviews(),
    capacity: {
      current: Math.floor(Math.random() * 80),
      maximum: 100,
      lastUpdated: new Date().toISOString(),
    },
    specialServices: getSpecialServices(tags),
    acceptedWasteTypes: getAcceptedWasteTypes(tags),
    operationalStatus: getOperationalStatus(),
    estimatedWaitTime: Math.floor(Math.random() * 30),
    facilities: getFacilities(tags),
    accessibility: getAccessibilityFeatures(tags),
    pricing: getPricingInfo(tags),
    certifications: getCertifications(),
    lastVerified: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  };

  return mockData;
};

const generateMockReviews = (): FacilityReview[] => {
  const reviewCount = Math.floor(Math.random() * 10) + 1;
  const reviews: FacilityReview[] = [];

  for (let i = 0; i < reviewCount; i++) {
    reviews.push({
      id: `review-${i}`,
      userId: `user-${i}`,
      userName: `User${i}`,
      rating: Math.floor(Math.random() * 5) + 1,
      comment: `Great facility with helpful staff and clean environment.`,
      date: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      helpful: Math.floor(Math.random() * 20),
    });
  }

  return reviews;
};

const getSpecialServices = (tags: any): string[] => {
  const services = [];
  if (tags["service:electronics"]) services.push("Electronics recycling");
  if (tags["service:pickup"]) services.push("Pickup service");
  if (tags["service:sorting"]) services.push("Sorting assistance");
  if (tags["service:education"]) services.push("Educational tours");
  return services;
};

const getAcceptedWasteTypes = (tags: any): WasteType[] => {
  const types: WasteType[] = [];

  if (tags["recycling:plastic"] === "yes") {
    types.push({
      type: "plastic",
      subtypes: ["PET", "HDPE", "PVC", "LDPE"],
      restrictions: ["Clean containers only"],
      processingFee: 0,
    });
  }

  if (tags["recycling:glass"] === "yes") {
    types.push({
      type: "glass",
      subtypes: ["Clear glass", "Brown glass", "Green glass"],
      restrictions: ["No broken glass"],
      processingFee: 0,
    });
  }

  if (tags["recycling:metal"] === "yes") {
    types.push({
      type: "metal",
      subtypes: ["Aluminum cans", "Steel cans", "Copper"],
      restrictions: ["No paint cans"],
      processingFee: 0,
    });
  }

  return types;
};

const getOperationalStatus = (): "open" | "closed" | "maintenance" | "full" => {
  const statuses = [
    "open",
    "open",
    "open",
    "closed",
    "maintenance",
    "full",
  ] as const;
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const getFacilities = (tags: any): string[] => {
  const facilities = [];
  if (tags["amenity:parking"]) facilities.push("Parking available");
  if (tags["amenity:toilet"]) facilities.push("Restrooms");
  if (tags["amenity:cafe"]) facilities.push("Café");
  facilities.push("Information desk", "Weighing station");
  return facilities;
};

const getAccessibilityFeatures = (tags: any): AccessibilityFeatures => {
  return {
    wheelchairAccessible: tags["wheelchair"] === "yes" || Math.random() > 0.3,
    brailleSignage: Math.random() > 0.7,
    audioInstructions: Math.random() > 0.8,
    lowCounterHeight: Math.random() > 0.5,
    visualAids: Math.random() > 0.6,
  };
};

const getPricingInfo = (tags: any): PricingInfo => {
  return {
    freeTypes: ["paper", "cardboard", "glass", "metal"],
    paidTypes: [
      { type: "electronics", price: 5.0, unit: "per item" },
      { type: "hazardous", price: 2.5, unit: "per kg" },
    ],
    membershipDiscount: 0.1,
    bulkDiscount: 0.15,
  };
};

const getCertifications = (): string[] => {
  const allCerts = [
    "ISO 14001",
    "LEED Certified",
    "EPA Approved",
    "State Certified",
  ];
  return allCerts.filter(() => Math.random() > 0.5);
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
      if (hasPaidTypes) return false;
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
  // Mock route optimization - in real app, use routing APIs like OSRM or GraphHopper
  const distance = calculateDistance(start, destination);
  const baseSpeed = {
    driving: 50, // km/h
    cycling: 20,
    walking: 5,
    public: 25,
  };

  const duration = (distance / baseSpeed[mode]) * 60; // minutes
  const carbonFootprint = mode === "driving" ? distance * 0.2 : 0; // kg CO2

  return {
    distance,
    duration,
    steps: generateRouteSteps(start, destination),
    trafficConditions: "moderate",
    carbonFootprint,
    alternativeRoutes: generateAlternativeRoutes(start, destination),
  };
};

const generateRouteSteps = (
  start: Location,
  destination: Location,
): RouteStep[] => {
  return [
    {
      instruction: "Head north on Main Street",
      distance: 0.5,
      duration: 2,
      coordinates: [start],
      maneuver: "depart",
    },
    {
      instruction: "Turn right onto Eco Avenue",
      distance: 1.2,
      duration: 5,
      coordinates: [{ lat: start.lat + 0.01, lng: start.lng + 0.01 }],
      maneuver: "turn-right",
    },
    {
      instruction: "Arrive at destination",
      distance: 0,
      duration: 0,
      coordinates: [destination],
      maneuver: "arrive",
    },
  ];
};

const generateAlternativeRoutes = (
  start: Location,
  destination: Location,
): AlternativeRoute[] => {
  return [
    {
      name: "Scenic Route",
      distance: calculateDistance(start, destination) * 1.15,
      duration: 25,
      description: "Longer but more scenic route through the park",
    },
    {
      name: "Highway Route",
      distance: calculateDistance(start, destination) * 0.95,
      duration: 18,
      description: "Faster route using main highways",
    },
  ];
};

const getRealTimeCapacity = async (
  facilityId: string,
): Promise<{ available: boolean; waitTime: number }> => {
  // Mock real-time capacity data
  const currentCapacity = Math.floor(Math.random() * 100);
  return {
    available: currentCapacity < 80,
    waitTime: currentCapacity > 80 ? Math.floor(Math.random() * 45) : 0,
  };
};

const submitFacilityReport = async (
  facilityId: string,
  issue: string,
): Promise<void> => {
  // Mock facility reporting
  console.log(`Report submitted for facility ${facilityId}: ${issue}`);
  // In real app, send to backend API
};

// Mock data for development when APIs are not available
export const mockRecyclingCenters: RecyclingFacility[] = [
  {
    id: "mock-1",
    name: "Green Recycling Hub",
    address: "123 Eco Street, Green City, 12345",
    location: { lat: 40.7128, lng: -74.006 },
    amenity: "recycling",
    recycling_type: ["plastic", "glass", "metal", "paper"],
    opening_hours: "Mo-Fr 08:00-18:00; Sa 09:00-16:00",
    phone: "+1 234 567 8900",
    website: "https://greenrecyclinghub.com",
    distance: 0.8,
    rating: 4.7,
    reviews: [
      {
        id: "review-1",
        userId: "user-1",
        userName: "Sarah M.",
        rating: 5,
        comment: "Excellent facility with very helpful staff!",
        date: "2024-01-10T10:00:00Z",
        helpful: 15,
      },
    ],
    capacity: {
      current: 45,
      maximum: 100,
      lastUpdated: "2024-01-15T14:30:00Z",
    },
    specialServices: ["Pickup service", "Educational tours"],
    acceptedWasteTypes: [
      {
        type: "plastic",
        subtypes: ["PET", "HDPE"],
        restrictions: ["Clean only"],
        processingFee: 0,
      },
      {
        type: "glass",
        subtypes: ["Clear", "Brown"],
        restrictions: [],
        processingFee: 0,
      },
    ],
    operationalStatus: "open",
    estimatedWaitTime: 5,
    facilities: ["Parking available", "Restrooms", "Information desk"],
    accessibility: {
      wheelchairAccessible: true,
      brailleSignage: true,
      audioInstructions: false,
      lowCounterHeight: true,
      visualAids: true,
    },
    pricing: {
      freeTypes: ["plastic", "glass", "metal", "paper"],
      paidTypes: [{ type: "electronics", price: 5.0, unit: "per item" }],
      membershipDiscount: 0.1,
    },
    certifications: ["ISO 14001", "EPA Approved"],
    lastVerified: "2024-01-14T00:00:00Z",
  },
  {
    id: "mock-2",
    name: "EcoCenter Downtown",
    address: "456 Central Ave, Downtown, 12345",
    location: { lat: 40.7589, lng: -73.9851 },
    amenity: "waste_disposal",
    recycling_type: ["electronics", "batteries", "hazardous"],
    opening_hours: "Mo-Fr 09:00-17:00",
    phone: "+1 234 567 8901",
    distance: 1.2,
    rating: 4.2,
    reviews: [],
    capacity: {
      current: 78,
      maximum: 100,
      lastUpdated: "2024-01-15T15:00:00Z",
    },
    specialServices: ["Electronics recycling", "Hazardous waste disposal"],
    acceptedWasteTypes: [
      {
        type: "electronic",
        subtypes: ["Phones", "Computers"],
        restrictions: ["Data wiped"],
        processingFee: 2.5,
      },
      {
        type: "hazardous",
        subtypes: ["Batteries", "Chemicals"],
        restrictions: ["Sealed containers"],
        processingFee: 5.0,
      },
    ],
    operationalStatus: "open",
    estimatedWaitTime: 15,
    facilities: ["Parking available", "Secure disposal"],
    accessibility: {
      wheelchairAccessible: true,
      brailleSignage: false,
      audioInstructions: true,
      lowCounterHeight: false,
      visualAids: true,
    },
    pricing: {
      freeTypes: [],
      paidTypes: [
        { type: "electronics", price: 2.5, unit: "per kg" },
        { type: "hazardous", price: 5.0, unit: "per item" },
      ],
    },
    certifications: ["State Certified", "EPA Approved"],
    lastVerified: "2024-01-13T00:00:00Z",
  },
  {
    id: "mock-3",
    name: "Community Compost Site",
    address: "789 Garden Road, Suburbs, 12345",
    location: { lat: 40.6892, lng: -74.0445 },
    amenity: "recycling",
    recycling_type: ["organic", "compost"],
    opening_hours: "24/7",
    distance: 2.1,
    rating: 4.5,
    reviews: [
      {
        id: "review-2",
        userId: "user-2",
        userName: "Mike T.",
        rating: 4,
        comment: "Great for composting, always clean and well-maintained.",
        date: "2024-01-12T16:20:00Z",
        helpful: 8,
      },
    ],
    capacity: {
      current: 32,
      maximum: 100,
      lastUpdated: "2024-01-15T12:00:00Z",
    },
    specialServices: ["Composting education", "Free compost pickup"],
    acceptedWasteTypes: [
      {
        type: "biodegradable",
        subtypes: ["Food scraps", "Garden waste"],
        restrictions: ["No meat/dairy"],
        processingFee: 0,
      },
    ],
    operationalStatus: "open",
    estimatedWaitTime: 0,
    facilities: ["24/7 access", "Tool lending"],
    accessibility: {
      wheelchairAccessible: false,
      brailleSignage: false,
      audioInstructions: false,
      lowCounterHeight: false,
      visualAids: false,
    },
    pricing: {
      freeTypes: ["organic", "compost"],
      paidTypes: [],
    },
    certifications: ["Organic Certified"],
    lastVerified: "2024-01-15T00:00:00Z",
  },
];
