import { useEffect, useState } from "react";
import { supabase, useAuth } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const factors: Record<string, { landfill: number; recycle: number }> = {
  plastic: { landfill: 2, recycle: 1.1 }, paper: { landfill: 1.1, recycle: 0.35 },
  glass: { landfill: 0.25, recycle: 0.2 }, metal: { landfill: 1.8, recycle: 0.7 },
  organic: { landfill: 1, recycle: 0.12 }, e_waste: { landfill: 2.5, recycle: 1.2 }, other: { landfill: 0.7, recycle: 0.5 },
};

type RecordRow = { id: string; material_type: string; weight_kg: number; disposal_method: string; recycled: boolean; recorded_at: string };

export default function ImpactDashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [message, setMessage] = useState("Loading measured waste records…");
  useEffect(() => {
    let active = true;
    if (!supabase || !user) { setMessage("Sign in with Supabase to view measured impact."); return; }
    supabase.from("waste_weight_records").select("id,material_type,weight_kg,disposal_method,recycled,recorded_at").eq("user_id", user.id).order("recorded_at", { ascending: true }).then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(`Measured impact unavailable: ${error.message}. Apply the climate impact migration first.`);
      else { setRows((data ?? []) as RecordRow[]); setMessage(data?.length ? "" : "No measured waste records yet."); }
    });
    return () => { active = false; };
  }, [user?.id]);
  const estimates = rows.reduce((a, row) => {
    const factor = factors[row.material_type] ?? factors.other;
    const recovered = row.recycled || ["Recycling", "Composting", "Reuse"].includes(row.disposal_method);
    a.mass += Number(row.weight_kg) || 0;
    a.recovered += recovered ? Number(row.weight_kg) || 0 : 0;
    a.co2e += (Number(row.weight_kg) || 0) * (recovered ? factor.recycle : factor.landfill);
    return a;
  }, { mass: 0, recovered: 0, co2e: 0 });
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-3">{[["Measured waste", `${estimates.mass.toFixed(2)} kg`], ["Recovery recorded", `${estimates.recovered.toFixed(2)} kg`], ["Estimated pathway emissions", `${estimates.co2e.toFixed(2)} kg CO2e`]].map(([label, value]) => <Card key={label}><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle>{value}</CardTitle></CardHeader></Card>)}</div>
    <Card><CardHeader><CardTitle>Waste impact from your records</CardTitle><CardDescription>Calculated from authenticated measured waste records and provisional pathway factors; estimates are not direct measurements.</CardDescription></CardHeader><CardContent>{message ? <p className="text-sm text-muted-foreground">{message}</p> : <p className="text-sm text-muted-foreground">{rows.length} records included. Factor methodology and sources are documented in Climate &amp; Ecosystem Impact.</p>}</CardContent></Card>
  </div>;
}
