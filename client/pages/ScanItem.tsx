import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera } from 'lucide-react';

interface ScannedItem {
  code: string;
  type: 'QR' | 'BARCODE';
  timestamp: string;
}

export default function ScanItem() {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback((error: any, result: any) => {
    if (error) {
      setError(error.message);
      return;
    }

    if (result) {
      const scannedItem: ScannedItem = {
        code: result.text,
        type: result.text.startsWith('http') ? 'QR' : 'BARCODE',
        timestamp: new Date().toISOString(),
      };
      setScannedData(scannedItem);
      setScanning(false);
    }
  }, []);

  const startScanning = () => {
    setError(null);
    setScanning(true);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Scan Item</CardTitle>
          <CardDescription>
            Scan a barcode or QR code to identify the item and get recycling instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanning ? (
            <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">QR/Barcode Scanner</p>
                <p className="text-sm text-gray-500">Camera functionality coming soon</p>
              </div>
              <Button
                variant="secondary"
                className="absolute bottom-4 right-4"
                onClick={() => setScanning(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={startScanning} className="w-full">
              Start Scanning
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {scannedData && (
            <Alert>
              <AlertTitle>Item Scanned!</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Type: {scannedData.type}</p>
                <p>Code: {scannedData.code}</p>
                <p>Time: {new Date(scannedData.timestamp).toLocaleString()}</p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
