import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import {
  Camera,
  Upload,
  MapPin,
  QrCode,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useWasteClassification,
  validateImageForClassification,
} from "@/lib/ml-integration";
import {
  useGeolocation,
  useRecyclingCentersSearch,
  getDirectionsUrl,
  RecyclingFacility,
} from "@/lib/openstreetmap";
import { useAuth } from "../App";
import { useAuth as useSbAuth } from "@/lib/supabase";
import { awardPoints } from "@/lib/voucher-operations";
import jsQR from "jsqr";

type Step = 1 | 2 | 3 | 4;
const EXPECTED_QR = "koushik";

async function decodeQRFromImage(file: File): Promise<string | null> {
  const img = new Image();
  img.src = URL.createObjectURL(file);

  await new Promise((res) => (img.onload = res));

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, canvas.width, canvas.height);

  return code?.data || null;
}

const Assessment: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { user: sbUser } = useSbAuth();
  const { classifyWaste, loading: classifying } = useWasteClassification();
  const { location, getCurrentLocation } = useGeolocation();
  const {
    centers,
    searchNearbyRecyclingCenters,
    loading: searching,
  } = useRecyclingCentersSearch();

  const [step, setStep] = useState<Step>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] =
    useState<RecyclingFacility | null>(null);
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [qrOption, setQrOption] = useState<"manual" | "scan" | "upload" | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (processing) return;
    const file = acceptedFiles?.[0];
    if (!file) return;
    const validation = validateImageForClassification(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    setProcessing(true);
    setPreviewUrl(URL.createObjectURL(file));
    setLastFile(file);
    setPredictionError(null);
    try {
      const result = await classifyWaste(file);
      setClassification(result);
    } catch (err: any) {
      console.error("Classification failed:", err);
      setPredictionError(err?.message || String(err) || "Prediction failed");
      setClassification(null);
    } finally {
      setProcessing(false);
      try {
        if (dropzoneInputRef.current) dropzoneInputRef.current.value = "";
      } catch {}
    }
  };

  const dropzoneInputRef = useRef<HTMLInputElement | null>(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  const progressPercent = useMemo(() => {
    if (step === 1) return 10;
    if (step === 2) return 45;
    if (step === 3) return 80;
    return 100;
  }, [step]);

  const handleLocateCenters = async () => {
    const loc = location || (await getCurrentLocation());
    await searchNearbyRecyclingCenters(loc, 10);
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      await new Promise((r) => setTimeout(r, 100));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.error("Play error:", err));
      }
    } catch (err) {
      setCameraActive(false);
      alert("❌ Unable to access camera. Please check permissions.");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanQRLive = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      return;
    }

    context.drawImage(videoRef.current, 0, 0);

    const imageData = context.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const code = jsQR(imageData.data, canvasRef.current.width, canvasRef.current.height);

    if (code?.data === EXPECTED_QR) {
      setQrCodeValue(code.data);
      setVerified(true);
      stopCamera();
      
      // Award points
      const bonus = 10;
      try {
        if (sbUser?.id) {
          await awardPoints(sbUser.id, bonus, "QR verified");
        } else {
          updateUser({ points: (user?.points || 0) + bonus });
        }
      } catch {
        updateUser({ points: (user?.points || 0) + bonus });
      }
      
      setStep(4);
    }
  };

  React.useEffect(() => {
    if (!cameraActive) return;

    const interval = setInterval(() => {
      scanQRLive();
    }, 500);

    return () => clearInterval(interval);
  }, [cameraActive]);

  // Stop camera when step changes
  React.useEffect(() => {
    if (cameraActive) {
      stopCamera();
    }
  }, [step]);

  // Stop camera when qrOption changes away from "scan"
  React.useEffect(() => {
    if (qrOption !== "scan" && cameraActive) {
      stopCamera();
    }
  }, [qrOption]);

  const handleVerifyQR = async () => {
  setVerifying(true);
  await new Promise((r) => setTimeout(r, 500));

  const ok = qrCodeValue.trim().toLowerCase() === EXPECTED_QR;

  setVerified(ok);
  setVerifying(false);

  if (!ok) {
    alert("❌ Invalid QR or Code");
    return;
  }

  const bonus = 10;
  try {
    if (sbUser?.id) {
      await awardPoints(sbUser.id, bonus, "QR verified");
    } else {
      updateUser({ points: (user?.points || 0) + bonus });
    }
  } catch {
    updateUser({ points: (user?.points || 0) + bonus });
  }

  setStep(4);
};

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Assessment</h1>
        <p className="text-muted-foreground">
          Scan waste → Select center → Scan QR → Earn rewards
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guided Workflow</CardTitle>
              <CardDescription>
                Follow the steps to complete your assessment
              </CardDescription>
            </div>
            <div className="min-w-[160px]">
              <Progress value={progressPercent} />
              <div className="text-xs text-muted-foreground mt-1">
                {progressPercent}%
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-6">
            <div
              className={`rounded-xl p-4 border ${step === 1 ? "border-eco-primary" : "border-border"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step > 1 ? "bg-eco-primary text-white" : "bg-muted"}`}
                >
                  {step > 1 ? "✓" : "1"}
                </div>
                <div className="font-medium">Waste Scanning</div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Upload or capture a photo to predict the category.
              </p>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center ${isDragActive ? "border-eco-primary bg-eco-primary/5" : "border-border"}`}
              >
                <input {...getInputProps()} ref={dropzoneInputRef} />
                <Camera className="w-6 h-6 mx-auto mb-2 text-eco-primary" />
                <div className="text-sm font-medium">
                  Drag & drop or click to upload
                </div>
                <div className="text-xs text-muted-foreground">
                  PNG, JPG up to 10MB
                </div>
              </div>
              <div className="mt-2 text-right">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    if (processing) return;
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const validation = validateImageForClassification(file);
                    if (!validation.isValid) {
                      alert(validation.error);
                      return;
                    }
                    setProcessing(true);
                    setPreviewUrl(URL.createObjectURL(file));
                    setLastFile(file);
                    setPredictionError(null);
                    try {
                      const result = await classifyWaste(file);
                      setClassification(result);
                    } catch (err) {
                      console.error("Classification failed:", err);
                      setPredictionError((err as any)?.message || String(err) || "Prediction failed");
                      setClassification(null);
                    } finally {
                      setProcessing(false);
                      // reset input so same file can be selected again if needed
                      try {
                        (e.target as HTMLInputElement).value = "";
                      } catch {}
                    }
                  }}
                />
                {predictionError && (
                  <div className="mt-2 text-sm text-red-500 flex items-center justify-between">
                    <div>{predictionError}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!lastFile) return;
                          setProcessing(true);
                          setPredictionError(null);
                          try {
                            const r = await classifyWaste(lastFile);
                            setClassification(r);
                          } catch (err: any) {
                            setPredictionError(err?.message || String(err) || "Prediction failed");
                          } finally {
                            setProcessing(false);
                          }
                        }}
                      >
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPreviewUrl(null);
                          setLastFile(null);
                          setPredictionError(null);
                          setClassification(null);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <AnimatePresence>
                {(previewUrl || classifying) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mt-3"
                  >
                    <div className="rounded-md overflow-hidden bg-muted/30 aspect-video flex items-center justify-center">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      )}
                    </div>
                    {classification && (
                      <div className="mt-3 text-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="capitalize bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {classification.detailedClass}
                          </Badge>
                          <Badge 
                            className="capitalize"
                            style={{
                              backgroundColor: classification.category === 'organic' ? '#10b981' : 
                                             classification.category === 'recyclable' ? '#0ea5e9' : '#ef4444',
                              color: 'white'
                            }}
                          >
                            {classification.category}
                          </Badge>
                          <span className="text-muted-foreground ml-auto">
                            {classification.confidence}%
                          </span>
                        </div>
                        {classification.disposalMethod && (
                          <p className="text-xs font-medium">
                            📋 {classification.disposalMethod}
                          </p>
                        )}
                        {classification.tips && (
                          <ul className="list-disc pl-5 text-muted-foreground">
                            {classification.tips.slice(0, 2).map(
                              (tip: string, i: number) => (
                                <li key={i} className="text-xs">{tip}</li>
                              ),
                            )}
                          </ul>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-3 flex justify-end">
                <Button
                  disabled={!classification}
                  onClick={() => setStep(2)}
                  className="bg-gradient-to-r from-eco-primary to-eco-secondary text-white"
                >
                  Next
                </Button>
              </div>
            </div>

            <div
              className={`rounded-xl p-4 border ${step === 2 ? "border-eco-primary" : "border-border"} ${step < 2 ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step > 2 ? "bg-eco-primary text-white" : "bg-muted"}`}
                >
                  {step > 2 ? "✓" : "2"}
                </div>
                <div className="font-medium">Select Nearest Center</div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Find and choose a center that accepts your waste type.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleLocateCenters}>
                  <MapPin className="w-4 h-4 mr-2" /> Find Nearby
                </Button>
              </div>
              <div className="mt-3 space-y-2 max-h-64 overflow-auto">
                {centers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCenter(c)}
                    className={`w-full text-left p-3 rounded-lg border ${selectedCenter?.id === c.id ? "border-eco-primary bg-eco-primary/5" : "border-border hover:bg-muted/30"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.address}
                        </div>
                        {c.recycling_type && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.recycling_type.slice(0, 4).map((t) => (
                              <Badge
                                key={t}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.distance ? `${c.distance.toFixed(1)} km` : ""}
                      </div>
                    </div>
                  </button>
                ))}
                {searching && (
                  <div className="text-sm text-muted-foreground">
                    Searching…
                  </div>
                )}
              </div>
              <div className="mt-3 flex justify-between">
                {selectedCenter && location && (
                  <a
                    href={getDirectionsUrl(location, selectedCenter.location)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-eco-primary underline"
                  >
                    Directions
                  </a>
                )}
                <div className="flex-1" />
                <Button
                  onClick={() => setStep(3)}
                  className="bg-gradient-to-r from-eco-primary to-eco-secondary text-white"
                >
                  Next
                </Button>
              </div>
            </div>

            <div
              className={`rounded-xl p-4 border ${step === 3 ? "border-eco-primary" : "border-border"} ${step < 3 ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step > 3 ? "bg-eco-primary text-white" : "bg-muted"}`}
                >
                  {step > 3 ? "✓" : "3"}
                </div>
                <div className="font-medium">Verify with QR Code</div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Choose your verification method
              </p>

              {!qrOption && (
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => setQrOption("manual")}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Enter QR Code
                  </Button>

                  <Button 
                    className="w-full" 
                    onClick={() => setQrOption("scan")}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>

                  <Button 
                    className="w-full" 
                    onClick={() => setQrOption("upload")}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload QR Image
                  </Button>
                </div>
              )}

              {qrOption === "manual" && (
                <div className="space-y-3">
                  <Input
                    placeholder="Enter verification code"
                    value={qrCodeValue}
                    onChange={(e) => setQrCodeValue(e.target.value)}
                    autoFocus
                  />
                  <Button 
                    onClick={handleVerifyQR} 
                    className="w-full bg-gradient-to-r from-eco-primary to-eco-secondary text-white"
                    disabled={!qrCodeValue.trim() || verifying}
                  >
                    {verifying ? "Verifying..." : "Verify"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setQrOption(null);
                      setQrCodeValue("");
                    }}
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              )}

              {qrOption === "scan" && (
                <div className="space-y-3">
                  {!cameraActive ? (
                    <>
                      <div className="text-xs text-muted-foreground mb-2">
                        Position the QR code in front of your camera
                      </div>
                      <Button
                        onClick={startCamera}
                        className="w-full bg-gradient-to-r from-eco-primary to-eco-secondary text-white"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Open Camera
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="relative bg-black rounded-lg overflow-hidden border-2 border-eco-primary mb-3" style={{ aspectRatio: '4/3' }}>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          webkit-playsinline="true"
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'block',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)'
                          }}
                        />
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-56 h-56 border-4 border-eco-primary rounded-lg opacity-75 animate-pulse" />
                        </div>
                        <div className="absolute top-2 right-2 bg-eco-primary/80 px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1">
                          <span className="animate-pulse">🔴</span> Live Scanning
                        </div>
                      </div>
                      <div className="text-xs text-center text-muted-foreground mb-3">
                        Point your camera at the QR code — it will scan automatically
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          stopCamera();
                          setQrOption(null);
                          setQrCodeValue("");
                        }}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              )}

              {qrOption === "upload" && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground mb-2">
                    Select a QR code image file
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setVerifying(true);
                      try {
                        const decoded = await decodeQRFromImage(file);
                        if (decoded === EXPECTED_QR) {
                          setQrCodeValue(decoded);
                          setVerified(true);
                          
                          // Award points
                          const bonus = 10;
                          try {
                            if (sbUser?.id) {
                              await awardPoints(sbUser.id, bonus, "QR verified");
                            } else {
                              updateUser({ points: (user?.points || 0) + bonus });
                            }
                          } catch {
                            updateUser({ points: (user?.points || 0) + bonus });
                          }
                          
                          setStep(4);
                        } else {
                          alert("❌ Invalid QR Code");
                          setQrOption(null);
                          setQrCodeValue("");
                        }
                      } catch (err) {
                        alert("❌ Could not read QR code");
                        setQrOption(null);
                        setQrCodeValue("");
                      } finally {
                        setVerifying(false);
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setQrOption(null);
                      setQrCodeValue("");
                    }}
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              )}

              {verified && (
                <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> QR
                  verified successfully. Points awarded.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-xl font-semibold mb-1">
                You recycled successfully!
              </div>
              <div className="text-muted-foreground">+10 points earned.</div>
              <div className="mt-4">
                <Button onClick={() => setStep(1)} variant="outline">
                  Start New Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Assessment;
