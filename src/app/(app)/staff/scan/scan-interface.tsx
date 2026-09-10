"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ScanResult = {
  name: string;
  level: number;
  trustBadge?: boolean;
  duplicate?: boolean;
};

export function ScanInterface() {
  const { tr } = useI18n();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  const submit = useCallback(
    async (code: string) => {
      setLoading(true);
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        toast.error(tr(data.error ?? tr("Check-in failed")));
        return false;
      }
      const result: ScanResult = { ...data.player, duplicate: data.duplicate };
      setLastResult(result);
      if (data.duplicate) {
        toast.info(
          tr("{name} already checked in today", { name: result.name }),
        );
      } else {
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.7 },
          colors: ["#10b981", "#d4af37"],
        });
        toast.success(tr("{name} checked in!", { name: result.name }));
      }
      return true;
    },
    [tr],
  );

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!("BarcodeDetector" in window)) {
      setCameraError(
        "This browser doesn't support in-page QR scanning — use manual entry below, or Chrome/Edge on the kiosk tablet.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      scanningRef.current = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ["qr_code"],
      });
      const tick = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const value = codes[0]?.rawValue as string | undefined;
          if (value?.startsWith("masters-checkin:")) {
            scanningRef.current = false;
            const ok = await submit(value);
            // resume scanning after a short pause so one QR isn't double-read
            setTimeout(() => {
              if (streamRef.current) scanningRef.current = true;
              if (ok) requestAnimationFrame(tick);
            }, 2500);
            return;
          }
        } catch {
          /* frame not ready yet */
        }
        if (scanningRef.current) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setCameraError(
        "Camera unavailable — check permissions, or use manual entry.",
      );
    }
  }, [submit]);

  useEffect(() => stopCamera, [stopCamera]);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-square bg-black/80">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <Camera className="h-10 w-10 text-faint" />
              {cameraError && (
                <p className="text-sm text-muted">{tr(cameraError)}</p>
              )}
              <Button onClick={startCamera}>
                <Camera size={16} /> {tr("Start camera")}
              </Button>
            </div>
          )}
          {cameraOn && (
            <>
              <div className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-emerald-bright/70" />
              <Button
                variant="secondary"
                size="sm"
                onClick={stopCamera}
                className="absolute end-3 top-3"
              >
                <CameraOff size={14} /> {tr("Stop")}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Manual entry */}
      <Card>
        <p className="mb-3 text-sm font-semibold">{tr("Manual entry")}</p>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!manual.trim()) return;
            const ok = await submit(manual.trim());
            if (ok) setManual("");
          }}
        >
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={tr("masters-checkin:… or raw token")}
            aria-label={tr("QR code value")}
          />
          <Button disabled={loading || !manual.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCheck size={16} />
            )}
          </Button>
        </form>
      </Card>

      {/* Last scan */}
      {lastResult && (
        <Card className="flex items-center gap-3 border-emerald-accent/40 bg-emerald-accent/5">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-bright" />
          <div className="flex-1">
            <p className="font-semibold">{lastResult.name}</p>
            <p className="text-sm text-muted">
              {tr("Level")} {lastResult.level}
              {lastResult.duplicate
                ? tr(" · already checked in today")
                : tr(" · checked in")}
            </p>
          </div>
          {lastResult.trustBadge && (
            <Badge variant="emerald">{tr("trusted")}</Badge>
          )}
        </Card>
      )}
    </div>
  );
}
