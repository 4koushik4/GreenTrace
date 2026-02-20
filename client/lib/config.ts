/**
 * Application Configuration
 * Centralized configuration for all integrations and environment variables
 */

export const config = {
  // Application settings
  app: {
    name: "Green India",
    url: import.meta.env.VITE_APP_URL || "http://localhost:8080",
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  },

  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    serviceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  // Maps and location services
  maps: {
    openStreetMapApiKey: import.meta.env.VITE_OPENSTREETMAP_API_KEY || "",
    mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  },

  // Machine Learning and AI services
  ml: {
    apiEndpoint: import.meta.env.VITE_ML_API_ENDPOINT || "",
    apiKey: import.meta.env.VITE_ML_API_KEY || "",
    tensorflowModelUrl: import.meta.env.VITE_TENSORFLOW_MODEL_URL || "",
  },

  // File upload and media services
  media: {
    cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
    cloudinaryApiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || "",
  },

  // Feature flags
  features: {
    enableRealTimeClassification: true,
    enableOfflineMode: true,
    enableGameification: true,
    enableCommunityFeatures: true,
    enableAnalytics: true,
  },

  // Default application settings
  defaults: {
    pointsPerClassification: {
      biodegradable: 10,
      recyclable: 15,
      hazardous: 20,
    },
    maxUploadSize: 10 * 1024 * 1024, // 10MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    mapDefaultCenter: { lat: 40.7128, lng: -74.0060 }, // New York City
    mapDefaultZoom: 12,
  },
} as const;

// Validation function to check if required environment variables are set
export const validateConfig = () => {
  const errors: string[] = [];

  // Check Supabase config if Supabase features are enabled
  if (!config.supabase.url) {
    errors.push("VITE_SUPABASE_URL is required for database functionality");
  }
  if (!config.supabase.anonKey) {
    errors.push("VITE_SUPABASE_ANON_KEY is required for authentication");
  }

  // Check Maps config for location features
  if (!config.maps.openStreetMapApiKey && !config.maps.mapboxToken && !config.maps.googleMapsApiKey) {
    console.warn("No map API keys configured. Map functionality will use default OpenStreetMap without API key.");
  }

  // Check ML config for classification features
  if (!config.ml.apiEndpoint && !config.ml.tensorflowModelUrl) {
    console.warn("No ML API endpoint or TensorFlow model URL configured. Classification will use mock data.");
  }

  if (errors.length > 0) {
    console.error("Configuration validation failed:", errors);
    return false;
  }

  return true;
};

// Export individual sections for easier imports
export const { app, supabase, maps, ml, media, features, defaults } = config;
