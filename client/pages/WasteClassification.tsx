import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ClassificationResult,
  persistWasteClassification,
  useWasteClassification,
  validateImageForClassification,
} from "@/lib/ml-integration";
import { useAuth } from "@/lib/supabase";

const WasteClassification: React.FC = () => {
  const { user } = useAuth();
  const { classifyWaste, loading, modelReady } = useWasteClassification();
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const classifyFile = async (file?: File) => {
    if (!file) return;
    const validation = validateImageForClassification(file);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError(null);
    setSaveNotice(null);
    setResult(null);
    setImageUrl(URL.createObjectURL(file));

    try {
      const prediction = await classifyWaste(file);
      setResult(prediction);
      if (user?.id) {
        try {
          await persistWasteClassification(prediction, user.id);
          setSaveNotice("Classification saved to your account.");
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : "Classification could not be saved.");
        }
      } else {
        setSaveNotice("Sign in to save classifications to your account.");
      }
    } catch (classificationError) {
      setError(
        classificationError instanceof Error
          ? classificationError.message
          : "The classification service is unavailable.",
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Classify Waste</h1>
          <p className="text-muted-foreground">
            Upload a photo to identify waste type and get proper disposal guidance
          </p>
        </div>
        <Badge
          variant="secondary"
          className={modelReady ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
        >
          {modelReady ? "Model available" : "Model status unverified"}
        </Badge>
      </div>

      <Card>
        <CardContent className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Classification uses the configured application API. If the model or backend is unavailable,
              no prediction will be shown.
            </p>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                void classifyFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
              disabled={loading}
            />
            {loading && (
              <p className="text-sm text-muted-foreground" role="status">
                Sending image to the classification model…
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {saveNotice && (
              <p className="text-sm text-muted-foreground" role="status">{saveNotice}</p>
            )}
          </div>

          <div className="space-y-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Selected waste for classification"
                className="max-h-72 w-full rounded-lg bg-muted object-contain"
              />
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                Select an image to get started
              </div>
            )}
            {result && (
              <div className="space-y-3" aria-live="polite">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">{result.detailedClass}</Badge>
                  <Badge className="capitalize">{result.category}</Badge>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {result.confidence}% confidence
                  </span>
                </div>
                {result.disposalMethod && (
                  <p className="text-sm"><strong>Disposal:</strong> {result.disposalMethod}</p>
                )}
                {!!result.tips?.length && (
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {result.tips.map((tip) => <li key={tip}>{tip}</li>)}
                  </ul>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setImageUrl(null);
                    setError(null);
                    setSaveNotice(null);
                  }}
                >
                  Classify another image
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WasteClassification;
