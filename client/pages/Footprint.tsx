import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth, useWasteClassifications } from '@/lib/supabase';
import { listUserPickups } from '@/lib/pickups';

function estimateCO2Saved(classifications: number, pickups: number) {
  return Math.round((classifications * 0.5 + pickups * 1.2) * 100) / 100; // kg CO2
}
function treesEquivalent(co2Kg: number) {
  return Math.round((co2Kg / 21) * 100) / 100; // rough: 1 tree absorbs ~21kg/year
}

export default function FootprintPage() {
  const { user } = useAuth();
  const { classifications } = useWasteClassifications(user?.id);
  const [pickupCount, setPickupCount] = useState(0);

  useEffect(() => {
    (async () => {
      const list = await listUserPickups(user?.id || '');
      setPickupCount(list.length);
    })();
  }, [user?.id]);

  const clsCount = classifications.length;
  const co2 = estimateCO2Saved(clsCount, pickupCount);
  const trees = treesEquivalent(co2);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Waste Footprint Tracker</CardTitle>
          <CardDescription>Your monthly environmental impact</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded bg-slate-800/40 text-white">
            <div className="text-sm opacity-80">Items Classified</div>
            <div className="text-3xl font-bold">{clsCount}</div>
          </div>
          <div className="p-4 rounded bg-slate-800/40 text-white">
            <div className="text-sm opacity-80">Pickups Completed</div>
            <div className="text-3xl font-bold">{pickupCount}</div>
          </div>
          <div className="p-4 rounded bg-slate-800/40 text-white">
            <div className="text-sm opacity-80">CO₂ Saved (kg)</div>
            <div className="text-3xl font-bold">{co2}</div>
            <div className="text-xs opacity-60">≈ {trees} trees/year</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
