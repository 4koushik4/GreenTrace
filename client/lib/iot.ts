import { supabase } from "@/lib/supabase";

export interface SmartBin {
  id: string;
  location_name: string;
  lat: number;
  lng: number;
  fill_level: number;
  last_updated: string;
}

export async function listSmartBins(): Promise<SmartBin[]> {
  if (!supabase) {
    throw new Error("Supabase must be configured to load smart bin data.");
  }

  const { data, error } = await supabase
    .from("smart_bins")
    .select("id, location_name, lat, lng, fill_level, last_updated")
    .order("last_updated", { ascending: false });

  if (error) {
    throw new Error(`Unable to load smart bins: ${error.message}`);
  }

  return (data ?? []) as SmartBin[];
}

export function getRouteSuggestion(bins: SmartBin[]): SmartBin[] {
  return [...bins].sort((a, b) => b.fill_level - a.fill_level);
}
