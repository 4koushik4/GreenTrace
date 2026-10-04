import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Scan, Square } from "lucide-react";
import { useWasteClassification, type ClassificationResult } from "@/lib/ml-integration";

const ARScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const { classifyWaste, loading } = useWasteClassification();

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  useEffect(() => () => {
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
  }, []);

  const startCamera = async () => {
    setError(null);
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported by this browser or device.");
      return;
    }

    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      setError("Camera is unavailable. Check your browser permission and camera connection, then try again.");
    }
  };

  const captureAndClassify = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("The camera image is not ready yet. Please wait and try again.");
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      setError("This browser cannot capture an image from the camera.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const image = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("The camera image could not be captured."));
        }, "image/jpeg");
      });
      setError(null);
      setResult(await classifyWaste(new File([image], "camera-capture.jpg", { type: "image/jpeg" })));
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "The image could not be classified.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-6 h-6 text-eco-primary" />
            Camera Waste Scanner
          </CardTitle>
          <p className="text-muted-foreground">
            Capture an image and send it to the configured waste-classification service.
            No result is shown unless the service returns a supported classification.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Live camera preview"
              className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />
            {!cameraActive && (
              <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
                <div>
                  <Camera className="mx-auto mb-2 h-10 w-10" />
                  <p>Camera preview is off.</p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex flex-wrap gap-3">
            {!cameraActive ? (
              <Button onClick={() => void startCamera()} disabled={loading}>
                <Camera className="mr-2 h-4 w-4" />
                Enable Camera
              </Button>
            ) : (
              <>
                <Button onClick={() => void captureAndClassify()} disabled={loading}>
                  <Scan className="mr-2 h-4 w-4" />
                  {loading ? "Classifying…" : "Capture & classify"}
                </Button>
                <Button variant="outline" onClick={stopCamera} disabled={loading}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop camera
                </Button>
              </>
            )}
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          {result && (
            <div className="space-y-3 rounded-lg border p-4" aria-live="polite">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ARScanner;
