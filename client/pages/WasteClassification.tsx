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
  const { classifyWaste, loading, modelReady, phase } = useWasteClassification();
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  const classifyFile = async (file?: File) => {
    if (!file) return;
    const validation = validateImageForClassification(file);
    if (!validation.isValid) {
      setSelectedFile(null);
      setResult(null);
      setImageUrl(null);
      setSaveNotice(null);
      setError(validation.error);
      return;
    }

    setSelectedFile(file);
    setCanRetry(false);
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
          setCanRetry(false);
          setError(saveError instanceof Error ? saveError.message : "Classification could not be saved.");
        }
      } else {
        setSaveNotice("Sign in to save classifications to your account.");
      }
    } catch (classificationError) {
      setCanRetry(true);
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
              Upload or capture a JPG, PNG, or WEBP image to identify the material and its GreenTrace waste category.
            </p>
            <Input
              type="file"
              accept="image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp"
              onChange={(event) => {
                void classifyFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
              disabled={loading}
            />
            {loading && (
              <p className="text-sm text-muted-foreground" role="status">
                {phase === "preparing_image" ? "Preparing image…" : phase === "scanning" ? "Sending image to Roboflow…" : "Analyzing waste…"}
              </p>
            )}
            {error && selectedFile && canRetry && !loading && (
              <Button variant="outline" onClick={() => void classifyFile(selectedFile)}>
                Retry analysis
              </Button>
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
                <p className="text-sm font-medium">Detected material: {result.material}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{result.material}</Badge>
                  <Badge>{result.category}</Badge>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {Math.round(result.confidence * 100)}% confidence
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
                    setSelectedFile(null);
                    setCanRetry(false);
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
