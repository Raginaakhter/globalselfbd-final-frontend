"use client";

import { useRef, useState } from "react";
import ProductImage from "./ProductImage";

const ZOOM = 2.2;

/* eslint-disable @next/next/no-img-element */
export default function ProductGallery({ images, alt, discountPercent }: { images: string[]; alt: string; discountPercent: number }) {
  const unique = [...new Set(images)];
  const [active, setActive] = useState(unique[0] ?? null);
  const [zooming, setZooming] = useState(false);
  // Mouse position in the image frame, 0–100.
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const boxRef = useRef<HTMLDivElement>(null);

  // Only enable zoom when a cursor is actually in use (desktop); touch devices stay with the normal view.
  const onEnter = () => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) setZooming(true);
  };
  const onLeave = () => setZooming(false);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div>
      <div
        ref={boxRef}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onMouseMove={onMove}
        className={`relative aspect-square rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden ${zooming ? "cursor-zoom-in" : ""}`}
      >
        {discountPercent > 0 && (
          <span className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-black">{discountPercent}% OFF</span>
        )}
        <div
          className={`w-full h-full ${zooming ? "transition-transform duration-150 ease-out" : "product-breathe"}`}
          style={{
            transform: zooming ? `scale(${ZOOM})` : undefined,
            transformOrigin: zooming ? `${pos.x}% ${pos.y}%` : "center center",
          }}
        >
          <ProductImage image={active} alt={alt} />
        </div>
      </div>
      {unique.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-3">
          {unique.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(src)}
              aria-label="Show image"
              className={`aspect-square rounded-xl overflow-hidden border-2 bg-slate-50 cursor-pointer ${active === src ? "border-brand-600" : "border-slate-200 hover:border-brand-300"}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
