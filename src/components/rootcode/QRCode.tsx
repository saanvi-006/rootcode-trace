import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

export interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 180, className = "" }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    if (!value) return;

    QRCodeLib.toDataURL(value, {
      width: size * 2,
      margin: 2,
      color: {
        dark: "#1a3826",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code", err);
      });

    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground ${className}`}
      >
        Generating QR…
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code for ${value}`}
      style={{ width: size, height: size }}
      className={`rounded-lg bg-white p-2 shadow-sm border border-border object-contain ${className}`}
    />
  );
}
