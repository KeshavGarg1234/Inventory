"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QrCodeDisplayProps {
  data: string;
}

export function QrCodeDisplay({ data }: QrCodeDisplayProps) {
  
  const downloadQRCode = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#qr-code-canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "inventra-qrcode.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle>Item QR Code</CardTitle>
        <CardDescription>Scan this code to quickly access item details.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg shadow-inner">
           <QRCodeCanvas id="qr-code-canvas" value={data} size={200} level={"H"} />
        </div>
        <Button onClick={downloadQRCode}>Download QR Code</Button>
      </CardContent>
    </Card>
  );
}
