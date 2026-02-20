export interface SmartBin {
  id: string;
  location_name: string;
  lat: number;
  lng: number;
  fill_level: number; // 0-100
  last_updated: string;
}

const MOCK_BINS: SmartBin[] = [
  { id: 'bin-1', location_name: 'Central Park', lat: 40.785, lng: -73.968, fill_level: 35, last_updated: new Date().toISOString() },
  { id: 'bin-2', location_name: '5th Ave Station', lat: 40.774, lng: -73.965, fill_level: 78, last_updated: new Date().toISOString() },
  { id: 'bin-3', location_name: 'Eco Mall', lat: 40.762, lng: -73.979, fill_level: 12, last_updated: new Date().toISOString() },
];

export async function listSmartBins(): Promise<SmartBin[]> {
  return MOCK_BINS;
}

export function getRouteSuggestion(bins: SmartBin[]): SmartBin[] {
  return [...bins].sort((a,b)=>b.fill_level - a.fill_level);
}
