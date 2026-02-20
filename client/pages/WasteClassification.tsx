// src/components/WasteClassification.tsx

import React from "react";
import { Badge } from "@/components/ui/badge";

const WasteClassification: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-full">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Classify Waste</h1>
          <p className="text-muted-foreground">
            Upload a photo to identify waste type and get proper disposal guidance
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          AI Powered
        </Badge>
      </div>

      {/* IFRAME CONTAINER */}
      <div className="w-full h-[78vh] rounded-xl overflow-hidden border border-border bg-background shadow-sm">

        <iframe
          src="http://localhost:5000/"
          title="Smart Waste Scanner"
          className="w-full h-full border-none"
        />

      </div>

    </div>
  );
};

export default WasteClassification;
