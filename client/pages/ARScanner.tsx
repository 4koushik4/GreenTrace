import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Scan, Zap, Target, CheckCircle } from 'lucide-react';

interface ScanTarget {
  id: string;
  name: string;
  position: { x: number; y: number };
  confidence: number;
  category: 'organic' | 'recyclable' | 'non-recyclable';
  suggested_action: string;
}

const ARScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanTargets, setScanTargets] = useState<ScanTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<ScanTarget | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        
        // Simulate AR detection after 2 seconds
        setTimeout(() => {
          simulateObjectDetection();
        }, 2000);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      // Fallback to mock AR experience
      setIsScanning(true);
      setTimeout(simulateObjectDetection, 2000);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsScanning(false);
    setScanTargets([]);
    setSelectedTarget(null);
  };

  const simulateObjectDetection = () => {
    const mockTargets: ScanTarget[] = [
      {
        id: '1',
        name: 'Plastic Bottle',
        position: { x: 45, y: 35 },
        confidence: 92,
        category: 'recyclable',
        suggested_action: 'Remove cap and label, rinse, place in recycling bin'
      },
      {
        id: '2', 
        name: 'Apple Core',
        position: { x: 25, y: 60 },
        confidence: 88,
        category: 'organic',
        suggested_action: 'Add to compost bin or organic waste collection'
      },
      {
        id: '3',
        name: 'Battery',
        position: { x: 70, y: 50 },
        confidence: 95,
        category: 'non-recyclable',
        suggested_action: 'Take to hazardous waste facility - DO NOT throw in regular trash'
      }
    ];
    
    setScanTargets(mockTargets);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'organic': return 'border-green-400 bg-green-500/20 text-green-300';
      case 'recyclable': return 'border-blue-400 bg-blue-500/20 text-blue-300';
      case 'non-recyclable': return 'border-red-400 bg-red-500/20 text-red-300';
      default: return 'border-gray-400 bg-gray-500/20 text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'organic': return '🌱';
      case 'recyclable': return '♻️';
      case 'non-recyclable': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-6 h-6 text-eco-primary" />
            AR Waste Scanner
            <Badge variant="secondary" className="ml-2">DEMO</Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Point your camera at waste items for real-time classification and disposal guidance
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            {/* Camera/Mock Video Feed */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
              style={{ display: isScanning ? 'block' : 'none' }}
            />
            
            {/* Fallback background for demo */}
            {isScanning && !videoRef.current?.srcObject && (
              <div 
                className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a5568' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              >
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-white/60 text-center"
                >
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p>Scanning Environment...</p>
                </motion.div>
              </div>
            )}

            {/* AR Overlays */}
            {isScanning && scanTargets.map((target) => (
              <motion.div
                key={target.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className={`absolute ${getCategoryColor(target.category)} border-2 rounded-lg p-2 cursor-pointer transform -translate-x-1/2 -translate-y-1/2`}
                style={{
                  left: `${target.position.x}%`,
                  top: `${target.position.y}%`,
                }}
                onClick={() => setSelectedTarget(target)}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-center min-w-[120px]"
                >
                  <div className="text-2xl mb-1">{getCategoryIcon(target.category)}</div>
                  <div className="text-sm font-semibold">{target.name}</div>
                  <div className="text-xs opacity-80">{target.confidence}% confident</div>
                </motion.div>
                
                {/* Pulse effect */}
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute inset-0 ${getCategoryColor(target.category)} rounded-lg -z-10`}
                />
              </motion.div>
            ))}

            {/* Scanning Grid Overlay */}
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
            )}

            {/* Center Crosshair */}
            {isScanning && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <Target className="w-8 h-8 text-eco-primary opacity-60" />
              </motion.div>
            )}

            {/* Start/Stop Button */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              {!isScanning ? (
                <Button 
                  onClick={startCamera}
                  className="bg-eco-primary hover:bg-eco-primary/90 text-white rounded-full px-8 py-3"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start AR Scanner
                </Button>
              ) : (
                <Button 
                  onClick={stopCamera}
                  variant="destructive"
                  className="rounded-full px-8 py-3"
                >
                  Stop Scanning
                </Button>
              )}
            </div>
          </div>

          {/* Item Details Panel */}
          <AnimatePresence>
            {selectedTarget && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6"
              >
                <Card className={`border-2 ${getCategoryColor(selectedTarget.category)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{getCategoryIcon(selectedTarget.category)}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                          {selectedTarget.name}
                          <Badge className={getCategoryColor(selectedTarget.category)}>
                            {selectedTarget.category}
                          </Badge>
                        </h3>
                        <div className="text-sm text-muted-foreground mb-3">
                          Classification Confidence: {selectedTarget.confidence}%
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Disposal Instructions
                          </h4>
                          <p className="text-sm">{selectedTarget.suggested_action}</p>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" className="bg-eco-primary text-white">
                            <Zap className="w-4 h-4 mr-2" />
                            Log Classification (+15 pts)
                          </Button>
                          <Button size="sm" variant="outline">
                            Find Nearest Facility
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Summary */}
          {scanTargets.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-3 gap-4 mt-6"
            >
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-eco-primary">{scanTargets.length}</div>
                  <div className="text-sm text-muted-foreground">Items Detected</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(scanTargets.reduce((sum, t) => sum + t.confidence, 0) / scanTargets.length)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {scanTargets.length * 15}
                  </div>
                  <div className="text-sm text-muted-foreground">Potential Points</div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ARScanner;
