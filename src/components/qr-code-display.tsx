"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QrCodeDisplayProps {
  data: string;
}

const logoSrc = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6A29E3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>'
)}`;


const imageSettings = {
  src: logoSrc,
  height: 48,
  width: 48,
  excavate: true,
};

export function QrCodeDisplay({ data }: QrCodeDisplayProps) {
  
  const downloadQRCode = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#qr-code-canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `inventra-qrcode-${data}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle>Unit QR Code</CardTitle>
        <CardDescription>This QR code contains the unique ID for this unit.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg shadow-inner">
           <QRCodeCanvas 
              id="qr-code-canvas" 
              value={data} 
              size={200} 
              level={"H"} 
              imageSettings={imageSettings}
            />
        </div>
        <Button onClick={downloadQRCode}>Download QR Code</Button>
      </CardContent>
    </Card>
  );
}
