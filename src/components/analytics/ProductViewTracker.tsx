"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics-tracker";

/**
 * Fires a `product_view` analytics event once the product detail page is mounted in the browser.
 * Rendered from the server component so it only runs for real page views (not on back-forward cache).
 */
export default function ProductViewTracker({
  productId,
  price,
  category,
}: {
  productId: string;
  price?: number;
  category?: string;
}) {
  useEffect(() => {
    void trackEvent({
      eventName: "product_view",
      productId,
      metadata: { price, category },
    });
  }, [productId, price, category]);
  return null;
}
