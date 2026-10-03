// "use client";

// import { Phone, Truck } from "lucide-react";
// import { useSite } from "@/context/SiteContext";

// const MARQUEE_SEC = 26;

// export default function TopBar() {
//   const { settings } = useSite();
//   const text = settings.topBarText;

//   return (
//     <div className="bg-navy-700 text-white text-xs">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="relative h-9 overflow-hidden">
//           <div className="absolute inset-0 flex items-center">
//             <div
//               className="flex w-max topbar-marquee hover:[animation-play-state:paused] font-medium"
//               style={{ animationDuration: `${MARQUEE_SEC}s` }}
//             >
//               {[0, 1].map((copyIdx) => (
//                 <span
//                   key={copyIdx}
//                   className="whitespace-nowrap pr-20"
//                   aria-hidden={copyIdx === 1 ? "true" : undefined}
//                 >
//                   {text}
//                 </span>
//               ))}
//             </div>
//           </div>

//           <div className="topbar-overlay-left absolute inset-y-0 left-0 flex items-center pr-6">
//             <Truck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
//           </div>

//           <div className="topbar-overlay-right absolute inset-y-0 right-0 hidden md:flex items-center pl-6">
//             {settings.phone && (
//               <a
//                 href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
//                 className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
//               >
//                 <Phone className="w-3.5 h-3.5 text-brand-400 shrink-0" /> {settings.phone}
//               </a>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { Phone, Truck } from "lucide-react";
import { useMemo } from "react";
import { useSite } from "@/context/SiteContext";

const MARQUEE_SEC = 16;

export default function TopBar() {
  const { settings } = useSite();

  const marqueeText = useMemo(
    () => settings.topBarText?.trim() || "",
    [settings.topBarText]
  );

  return (
    <div className="sticky top-0 z-50 bg-navy-700 text-white text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9">
        <div className="relative h-full flex items-center">

          {/* =========================
              LEFT: TRUCK ICON
          ========================== */}
          <div className="relative z-30 flex items-center pr-2 shrink-0 bg-navy-700">
            <Truck className="w-3.5 h-3.5 text-brand-400" />
          </div>

          {/* =========================
              MARQUEE CONTAINER
          ========================== */}
          <div className="relative flex-1 min-w-0 h-full overflow-hidden">

            <div
              className="topbar-marquee-track"
              style={{
                animationDuration: `${MARQUEE_SEC}s`,
              }}
            >
              {/* First copy */}
              <span className="topbar-marquee-item">
                {marqueeText}
              </span>

              {/* Second copy for continuous loop */}
              <span
                className="topbar-marquee-item"
                aria-hidden="true"
              >
                {marqueeText}
              </span>
            </div>
          </div>

          {/* =========================
              PHONE NUMBER
          ========================== */}
          {settings.phone && (
            <div className="topbar-phone">
              <a
                href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5 text-brand-400" />

                <span>{settings.phone}</span>
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}