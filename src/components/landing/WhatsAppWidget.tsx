"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Change this one value to point the widget at a different WhatsApp account.
// International format, digits only (country code + number), no "+" or spaces.
const WHATSAPP_NUMBER = "8801552405670";
const PREFILLED_MESSAGE = "Hello, I would like to know more about your products.";

const CLOSED_KEY = "gsbd-whatsapp-widget-closed";

export default function WhatsAppWidget() {
  const [visible, setVisible] = useState(false);

  // Delay first paint until after hydration so SSR doesn't flash the widget
  // for users who already dismissed it this session.
  useEffect(() => {

    try {
      if (sessionStorage.getItem(CLOSED_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILLED_MESSAGE)}`;

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(CLOSED_KEY, "1");
    } catch {
      /* storage blocked — fine, closes for this view only */
    }
  };

  return (
    <div
      className="fixed right-3 sm:right-4 md:right-5 bottom-4 sm:bottom-5 z-[60] flex items-start gap-1 sm:gap-1.5 max-w-[calc(100vw-1rem)]"
      role="complementary"
      aria-label="Chat with us on WhatsApp"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full bg-[#1C398E] text-white p-1.5 sm:pl-2 sm:pr-3 sm:py-1.5 shadow-lg shadow-blue-900/20 ring-1 ring-black/5 transition-transform duration-200 hover:scale-[1.04] hover:shadow-xl active:scale-95"
        aria-label="Open WhatsApp chat"
      >
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#25D366]">
          {/* Inline SVG keeps the official WhatsApp glyph without pulling an extra icon pack */}
          <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="h-4 w-4 sm:h-5 sm:w-5 fill-white"
          >
            <path d="M19.11 17.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.49-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM16.03 5.33c-5.87 0-10.65 4.78-10.66 10.66 0 1.88.49 3.72 1.42 5.33l-1.5 5.49 5.62-1.47a10.6 10.6 0 0 0 5.11 1.3h.01c5.87 0 10.66-4.79 10.66-10.66a10.6 10.6 0 0 0-3.12-7.55 10.57 10.57 0 0 0-7.54-3.1zm0 19.5h-.01a8.84 8.84 0 0 1-4.5-1.23l-.32-.19-3.34.88.89-3.25-.21-.33a8.86 8.86 0 0 1-1.36-4.72c0-4.88 3.98-8.86 8.86-8.86 2.37 0 4.59.92 6.27 2.6a8.8 8.8 0 0 1 2.59 6.27c0 4.88-3.98 8.84-8.87 8.84z" />
          </svg>
        </span>
        {/* Label stays hidden on phones to keep the widget compact; appears from sm (640px) up */}
        <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
          Chat with Us
        </span>
      </a>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Close WhatsApp chat widget"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow-md ring-1 ring-black/5 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
