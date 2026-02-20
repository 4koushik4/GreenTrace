import React, { useEffect, useState } from 'react';
import { listSmartBins, getRouteSuggestion, SmartBin } from '@/lib/iot';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SmartBinsPage() {
  const [bins, setBins] = useState<SmartBin[]>([]);
  useEffect(()=>{ (async()=> setBins(await listSmartBins()))(); }, []);
  const route = getRouteSuggestion(bins);

  return (
    <div className="container mx-auto p-4 grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Smart Bins (IoT)</CardTitle>
          <CardDescription>Demo: fill levels and suggested collection order.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {bins.map(b => (
            <div key={b.id} className="p-3 rounded bg-slate-800/40 text-white">
              <div className="font-semibold">{b.location_name}</div>
              <div className="text-sm opacity-70">Fill: {b.fill_level}%</div>
              <div className="w-full h-2 bg-slate-700 rounded mt-2">
                <div className="h-2 bg-green-600 rounded" style={{ width: `${b.fill_level}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested Route (High → Low)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {route.map((b, idx) => (
            <div key={b.id} className="p-3 rounded bg-slate-800/40 text-white flex justify-between">
              <div>{idx+1}. {b.location_name}</div>
              <div className="opacity-70">{b.fill_level}%</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
