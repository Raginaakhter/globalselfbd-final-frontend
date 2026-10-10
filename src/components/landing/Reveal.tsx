"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "up" | "fade" | "left" | "right" | "zoom";

interface Props {
  children: React.ReactNode;
  /** Delay in ms before animating in (nice for staggered sections). */
  delay?: number;
  /** Animation flavour. Defaults to a soft slide-up. */
  variant?: Variant;
  className?: string;
  as?: React.ElementType;
  /** Reveal every time the element enters the viewport (default: once only). */
  repeat?: boolean;
}

/** Reveals its children with a fade/translate animation when scrolled into view. */
export default function Reveal({ children, delay = 0, variant = "up", className = "", as: Tag = "div", repeat = false }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // SSR / older browser fallback: show immediately.
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (!repeat) io.unobserve(entry.target);
          } else if (repeat) {
            setShown(false);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [repeat]);

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant} ${shown ? "reveal-shown" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms`, animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
