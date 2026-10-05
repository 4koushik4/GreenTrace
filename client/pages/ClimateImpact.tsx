import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase, useAuth } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CloudSun, Leaf, Plus, Recycle, Wind } from "lucide-react";

type WasteRecord = { id: string; category: string; material_type: string; weight_kg: number; recorded_at: string; location: string; disposal_method: string; recycled: boolean };
type Climate = { temperature?: number; precipitation?: number; humidity?: number; wind?: number };
const factors: Record<string, { landfill: number; recycle: number }> = {
  plastic: { landfill: 2.0, recycle: 1.1 }, paper: { landfill: 1.1, recycle: 0.35 },
  glass: { landfill: 0.25, recycle: 0.2 }, metal: { landfill: 1.8, recycle: 0.7 },
  organic: { landfill: 1.0, recycle: 0.12 }, e_waste: { landfill: 2.5, recycle: 1.2 },
  other: { landfill: 0.7, recycle: 0.5 },
};
const methods = ["Recycling", "Composting", "Landfill", "Reuse", "Safe collection"];
const round = (n: number) => Math.round(n * 100) / 100;

export default function ClimateImpact() {
  const { user, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [climate, setClimate] = useState<Climate | null>(null);
  const [weatherMessage, setWeatherMessage] = useState("Choose a locality and load recent weather observations.");
  const [form, setForm] = useState({ category: "recyclable", material_type: "plastic", weight_kg: "", recorded_at: new Date().toISOString().slice(0, 10), location: "", disposal_method: "Recycling", recycled: true });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase || !user) { setRecords([]); setLoading(false); return; }
      const { data, error } = await supabase.from("waste_weight_records").select("id,category,material_type,weight_kg,recorded_at,location,disposal_method,recycled").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(200);
      if (!active) return;
      if (error) setMessage(`Waste records unavailable: ${error.message}. Apply the climate impact database migration to enable tracking.`);
      else setRecords((data ?? []) as WasteRecord[]);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [user?.id]);

  const totals = useMemo(() => records.reduce((acc, row) => {
    const factor = factors[row.material_type] ?? factors.other;
    acc.weight += Number(row.weight_kg) || 0;
    acc.estimated += (Number(row.weight_kg) || 0) * ((row.recycled || row.disposal_method === "Recycling" || row.disposal_method === "Composting") ? factor.recycle : factor.landfill);
    if (row.recycled || row.disposal_method === "Recycling" || row.disposal_method === "Composting") acc.diverted += Number(row.weight_kg) || 0;
    return acc;
  }, { weight: 0, estimated: 0, diverted: 0 }), [records]);

  async function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    if (!supabase || !user) { setMessage("Sign in with a configured Supabase account to save waste records."); return; }
    const weight = Number(form.weight_kg);
    if (!Number.isFinite(weight) || weight <= 0) { setMessage("Enter a weight greater than zero kilograms."); return; }
    const { data, error } = await supabase.from("waste_weight_records").insert({ user_id: user.id, ...form, weight_kg: weight }).select("id,category,material_type,weight_kg,recorded_at,location,disposal_method,recycled").single();
    if (error) { setMessage(`Could not save record: ${error.message}. Check that the migration has been applied.`); return; }
    setRecords((current) => [data as WasteRecord, ...current]);
    setForm((current) => ({ ...current, weight_kg: "" }));
    setMessage("Waste record saved. Its impact is an estimate using the factor table below.");
  }

  async function loadClimate() {
    setClimate(null); setWeatherMessage("Looking up locality and recent weather observations…");
    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      if (!geoResponse.ok) throw new Error("Geocoding service is unavailable.");
      const geo = await geoResponse.json(); const place = geo.results?.[0];
      if (!place) throw new Error("No matching locality found.");
      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto`);
      if (!weatherResponse.ok) throw new Error("Weather service is unavailable.");
      const weather = await weatherResponse.json();
      setClimate({ temperature: weather.current?.temperature_2m, precipitation: weather.current?.precipitation, humidity: weather.current?.relative_humidity_2m, wind: weather.current?.wind_speed_10m });
      setCity(`${place.name}${place.admin1 ? `, ${place.admin1}` : ""}`);
      setWeatherMessage(`Current conditions for ${place.name}, ${place.country}; observation ${weather.current?.time ?? "time unavailable"}. This snapshot does not establish a climate trend or a formal flood/drought risk.`);
    } catch (error) { setWeatherMessage(error instanceof Error ? error.message : "Environmental data could not be loaded."); }
  }

  const diversion = totals.weight ? Math.round(totals.diverted / totals.weight * 100) : 0;
  const vulnerability = Math.round(Math.min(100, Math.max(0, 45 + (climate?.temperature && climate.temperature >= 35 ? 15 : 0) + (100 - diversion) * 0.25)));
  if (!supabase) return <div className="rounded-lg border p-6">Supabase is not configured. Waste records cannot be loaded or saved.</div>;
  if (authLoading || loading) return <div className="p-8 text-center" role="status">Loading climate and waste data…</div>;
  if (!user) return <div className="rounded-lg border p-6">Sign in to manage your waste records and impact assessment.</div>;

  return <div className="space-y-6 rounded-2xl border border-emerald-400/15 bg-slate-900/40 p-4 text-slate-100 sm:p-6">
    <header><p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">GreenTrace · Local environment</p><h1 className="mt-2 text-3xl font-bold">Climate &amp; Ecosystem Impact</h1><p className="mt-2 max-w-3xl text-slate-300">Connect recorded waste management activity with local environmental conditions. All waste impact figures are estimates, not direct emissions measurements.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[["Recorded waste", `${round(totals.weight)} kg`, Recycle], ["Estimated waste emissions", `${round(totals.estimated)} kg CO₂e`, CloudSun], ["Diverted from disposal", `${round(totals.diverted)} kg`, Leaf], ["Explainable vulnerability", `${vulnerability}/100`, AlertTriangle]].map(([title, value, Icon]: any) => <Card key={title}><CardHeader className="pb-2"><CardDescription>{title}</CardDescription><CardTitle className="flex items-center gap-2 text-2xl"><Icon className="h-5 w-5 text-emerald-500"/>{value}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{title === "Explainable vulnerability" ? `Illustrative screening score: 45 baseline + ${climate?.temperature && climate.temperature >= 35 ? "15 heat flag + " : "0 heat flag + "}${round((100-diversion)*0.25)} waste diversion component. Not a validated ecological index.` : "Based on saved user records only."}</CardContent></Card>)}
    </div>
    {message && <p role="status" className="rounded-md border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-100">{message}</p>}
    <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <Card><CardHeader><CardTitle>Record measured waste</CardTitle><CardDescription>Use a scale or verified collection record. Do not enter classifier item counts as kilograms.</CardDescription></CardHeader><CardContent><form onSubmit={addRecord} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Waste category</Label><Select value={form.category} onValueChange={(v) => setForm({...form, category:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["biodegradable","recyclable","hazardous","organic","non-recyclable"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Material type</Label><Select value={form.material_type} onValueChange={(v) => setForm({...form, material_type:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{[["plastic","Plastic"],["paper","Paper/cardboard"],["glass","Glass"],["metal","Metal"],["organic","Organic/food"],["e_waste","Electronic waste"],["other","Other/mixed"]].map(([v,label])=><SelectItem key={v} value={v}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Weight (kg)</Label><Input required type="number" min="0.001" step="0.001" value={form.weight_kg} onChange={e=>setForm({...form,weight_kg:e.target.value})}/></div>
        <div className="space-y-2"><Label>Date</Label><Input required type="date" value={form.recorded_at} onChange={e=>setForm({...form,recorded_at:e.target.value})}/></div>
        <div className="space-y-2"><Label>Location</Label><Input required placeholder="Ward, city" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div>
        <div className="space-y-2"><Label>Disposal method</Label><Select value={form.disposal_method} onValueChange={v=>setForm({...form,disposal_method:v,recycled:v==="Recycling"||v==="Composting"})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{methods.map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div className="sm:col-span-2"><Button type="submit"><Plus className="mr-2 h-4 w-4"/>Save measured record</Button></div>
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Wind className="h-5 w-5"/>Local conditions</CardTitle><CardDescription>Recent observation snapshot from Open-Meteo. These are weather observations, not long-term climate normals or official hazard warnings.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex gap-2"><Input aria-label="City or locality" value={city} onChange={e=>setCity(e.target.value)}/><Button onClick={()=>void loadClimate()}>Load</Button></div><p className="text-sm text-muted-foreground">{weatherMessage}</p>{climate && <div className="grid grid-cols-2 gap-3">{[["Temperature",`${climate.temperature ?? "—"} °C`],["Precipitation",`${climate.precipitation ?? "—"} mm`],["Relative humidity",`${climate.humidity ?? "—"}%`],["Wind speed",`${climate.wind ?? "—"} km/h`]].map(([k,v])=><div key={k} className="rounded-md bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>)}</div>}<p className="text-xs text-muted-foreground">Source: Open-Meteo Geocoding and Forecast APIs; current conditions are dynamic. AQI, drought and flood hazards are not provided here.</p></CardContent></Card>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Before vs after</CardTitle><CardDescription>Compare the oldest half with the newest half of your recorded waste history. It is a descriptive estimate and can be skewed by different reporting periods.</CardDescription></CardHeader><CardContent>{records.length < 2 ? <p className="text-sm text-muted-foreground">Add at least two measured records to compare periods.</p> : (()=>{const split=Math.ceil(records.length/2), newer=records.slice(0,split), older=records.slice(split); const calc=(rows:WasteRecord[])=>rows.reduce((s,r)=>s+Number(r.weight_kg)*((r.recycled||r.disposal_method==="Recycling"||r.disposal_method==="Composting"?(factors[r.material_type]??factors.other).recycle:(factors[r.material_type]??factors.other).landfill)),0);const before=calc(older),after=calc(newer);return <div className="grid grid-cols-3 gap-3 text-center"><div className="rounded bg-muted/40 p-4"><p className="text-xs text-muted-foreground">Earlier records</p><p className="text-xl font-bold">{round(before)} kg CO₂e</p></div><div className="rounded bg-muted/40 p-4"><p className="text-xs text-muted-foreground">Recent records</p><p className="text-xl font-bold">{round(after)} kg CO₂e</p></div><div className="rounded bg-emerald-950/40 p-4"><p className="text-xs text-muted-foreground">Estimated change</p><p className="text-xl font-bold">{before ? `${round((before-after)/before*100)}%` : "—"}</p></div></div>})()}</CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Waste records</CardTitle><CardDescription>{records.length} measured records. Factors are kg CO₂e per kg of material and show indicative landfill versus recovery pathways.</CardDescription></CardHeader><CardContent className="space-y-2">{records.length===0 ? <p className="text-sm text-muted-foreground">No measured waste records yet.</p> : records.map(row=><div key={row.id} className="grid gap-1 border-b py-2 text-sm sm:grid-cols-5"><span>{row.recorded_at}</span><span>{row.location}</span><span className="capitalize">{row.material_type.replace("_"," ")} · {row.weight_kg} kg</span><span>{row.disposal_method}</span><span>Estimated {round(Number(row.weight_kg)*((row.recycled||row.disposal_method==="Recycling"||row.disposal_method==="Composting"?(factors[row.material_type]??factors.other).recycle:(factors[row.material_type]??factors.other).landfill)))} kg CO₂e</span></div>)}</CardContent></Card>
    <details className="rounded-md border p-4 text-sm"><summary className="cursor-pointer font-semibold">Methodology, assumptions &amp; sources</summary><div className="mt-3 space-y-2 text-muted-foreground"><p>Indicative screening factors (kg CO₂e/kg): plastic landfill 2.0 / recycling 1.1; paper 1.1 / 0.35; glass 0.25 / 0.20; metal 1.8 / 0.70; organic 1.0 / composting 0.12; e-waste 2.5 / recovery 1.2; mixed 0.7 / recovery 0.5. These simplified defaults are provisional scenario assumptions, not India-specific verified factors. Replace with a cited local life-cycle inventory before formal research claims.</p><p>Calculation: recorded mass × pathway factor. “Diverted” means mass marked recycled or assigned Recycling/Composting; it does not independently verify downstream processing. No tree, methane, air quality, flood or drought metrics are inferred from these values.</p><p>Weather: <a className="underline" href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">Open-Meteo API documentation</a>. Factors should be reviewed against a documented inventory such as <a className="underline" href="https://www.epa.gov/warm" target="_blank" rel="noreferrer">US EPA WARM</a>; WARM is not India-specific. Reported ecosystem vulnerability is a transparent illustrative screening indicator, not a validated ecological assessment.</p></div></details>
  </div>;
}
