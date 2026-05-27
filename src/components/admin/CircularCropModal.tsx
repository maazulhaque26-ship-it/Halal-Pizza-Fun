"use client";

import { useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check } from "lucide-react";

const CONTAINER = 300; // container px (square)
const CIRCLE    = 244; // circle diameter px
const OUTPUT    = 400; // canvas output px (high-res)

interface Props {
  src: string;
  onConfirm: (blob: Blob) => void;
  onClose: () => void;
}

export function CircularCropModal({ src, onConfirm, onClose }: Props) {
  const imgRef   = useRef<HTMLImageElement>(null);
  const dragRef  = useRef({ startX: 0, startY: 0, ox: 0, oy: 0 });
  const touchRef = useRef({ startX: 0, startY: 0, ox: 0, oy: 0, dist: 0, startScale: 1 });

  const [nat, setNat]       = useState({ w: 1, h: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale]   = useState(1);
  const [dragging, setDragging] = useState(false);

  // "fit" = minimum scale so image fills the circle
  const fitScale  = Math.max(CIRCLE / nat.w, CIRCLE / nat.h);
  const totalScale = fitScale * scale;
  const dW = nat.w * totalScale;
  const dH = nat.h * totalScale;

  // Clamp so the circle never shows empty background
  const clamp = (ox: number, oy: number) => ({
    x: Math.min((dW - CIRCLE) / 2, Math.max(-((dW - CIRCLE) / 2), ox)),
    y: Math.min((dH - CIRCLE) / 2, Math.max(-((dH - CIRCLE) / 2), oy)),
  });

  const onLoad = () => {
    const img = imgRef.current!;
    setNat({ w: img.naturalWidth, h: img.naturalHeight });
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };

  // ── Mouse ──
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const { startX, startY, ox, oy } = dragRef.current;
    setOffset(clamp(ox + e.clientX - startX, oy + e.clientY - startY));
  };
  const onMouseUp = () => setDragging(false);
  const onWheel   = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(5, Math.max(0.8, s - e.deltaY * 0.003)));
  };

  // ── Touch ──
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchRef.current = { ...touchRef.current, startX: e.touches[0].clientX, startY: e.touches[0].clientY, ox: offset.x, oy: offset.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current.dist = Math.hypot(dx, dy);
      touchRef.current.startScale = scale;
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const { startX, startY, ox, oy } = touchRef.current;
      setOffset(clamp(ox + e.touches[0].clientX - startX, oy + e.touches[0].clientY - startY));
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const r  = Math.hypot(dx, dy) / touchRef.current.dist;
      setScale(Math.min(5, Math.max(0.8, touchRef.current.startScale * r)));
    }
  };

  // ── Crop → Canvas ──
  const handleCrop = () => {
    const canvas = document.createElement("canvas");
    canvas.width  = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d")!;

    // Circular clip
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();

    // Source rect in natural-image pixels
    const srcW = CIRCLE / totalScale;
    const srcH = CIRCLE / totalScale;
    const srcX = nat.w / 2 - srcW / 2 - offset.x / totalScale;
    const srcY = nat.h / 2 - srcH / 2 - offset.y / totalScale;

    ctx.drawImage(imgRef.current!, srcX, srcY, srcW, srcH, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob(b => { if (b) onConfirm(b); }, "image/png", 0.95);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div
        className="bg-[#0d1117] rounded-2xl border border-white/10 shadow-2xl w-full"
        style={{ maxWidth: 360 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
          <div>
            <h3 className="font-black text-white text-base">Crop Logo</h3>
            <p className="text-[11px] text-white/40 mt-0.5">Drag · Scroll / pinch to zoom</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop canvas */}
        <div className="flex justify-center py-5">
          <div
            className="relative overflow-hidden rounded-xl select-none"
            style={{
              width: CONTAINER,
              height: CONTAINER,
              cursor: dragging ? "grabbing" : "grab",
              // Checkerboard to show transparency
              backgroundImage:
                "linear-gradient(45deg,#1c2030 25%,transparent 25%)," +
                "linear-gradient(-45deg,#1c2030 25%,transparent 25%)," +
                "linear-gradient(45deg,transparent 75%,#1c2030 75%)," +
                "linear-gradient(-45deg,transparent 75%,#1c2030 75%)",
              backgroundSize: "18px 18px",
              backgroundPosition: "0 0,0 9px,9px -9px,-9px 0",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          >
            {/* The image — hidden but used by Canvas */}
            <img
              ref={imgRef}
              src={src}
              alt="crop"
              onLoad={onLoad}
              draggable={false}
              style={{
                position: "absolute",
                width:  dW,
                height: dH,
                left: (CONTAINER - dW) / 2 + offset.x,
                top:  (CONTAINER - dH) / 2 + offset.y,
                pointerEvents: "none",
                userSelect: "none",
              }}
            />

            {/* Dark overlay outside circle — box-shadow trick */}
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                width:  CIRCLE,
                height: CIRCLE,
                left: (CONTAINER - CIRCLE) / 2,
                top:  (CONTAINER - CIRCLE) / 2,
                boxShadow: `0 0 0 ${CONTAINER}px rgba(13,17,23,0.82)`,
              }}
            />

            {/* Circle border */}
            <div
              className="absolute pointer-events-none rounded-full border-2 border-primary/60"
              style={{
                width:  CIRCLE,
                height: CIRCLE,
                left: (CONTAINER - CIRCLE) / 2,
                top:  (CONTAINER - CIRCLE) / 2,
              }}
            />

            {/* Crosshair guides */}
            <div className="absolute pointer-events-none" style={{ left: (CONTAINER - CIRCLE) / 2, top: CONTAINER / 2 - 0.5, width: CIRCLE, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <div className="absolute pointer-events-none" style={{ top: (CONTAINER - CIRCLE) / 2, left: CONTAINER / 2 - 0.5, height: CIRCLE, width: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-6 pb-2">
          <ZoomOut className="w-4 h-4 text-white/35 shrink-0" />
          <input
            type="range" min={80} max={500} value={Math.round(scale * 100)}
            onChange={e => setScale(Number(e.target.value) / 100)}
            className="flex-1 accent-primary h-1 cursor-pointer"
          />
          <ZoomIn className="w-4 h-4 text-white/35 shrink-0" />
          <span className="text-[11px] text-white/35 w-9 text-right tabular-nums">{Math.round(scale * 100)}%</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 p-6 pt-4">
          <button
            onClick={() => { setOffset({ x: 0, y: 0 }); setScale(1); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-sm font-bold rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 active:scale-95 text-black text-sm font-black rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            <Check className="w-4 h-4" /> Crop &amp; Use
          </button>
        </div>
      </div>
    </div>
  );
}
