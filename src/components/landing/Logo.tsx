import Image from "next/image";
import Link from "next/link";
import { LOGO_URL } from "@/lib/brand";

// Intrinsic aspect ratio of the Cloudinary logo (icon + wordmark), used to
// reserve the right space and avoid layout shift on every device.
const LOGO_RATIO = 786 / 662;

export default function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  const image = compact ? (
    <Image
      src={LOGO_URL}
      alt="Global Shelf BD"
      width={786}
      height={662}
      priority
      className="h-13 w-auto sm:h-15 md:h-16 lg:h-18 xl:h-20 object-contain"
      style={{ aspectRatio: LOGO_RATIO }}
    />
  ) : (
    <Image
      src={LOGO_URL}
      alt="Global Shelf BD — Global Products, Authentic Choice"
      width={786}
      height={662}
      className="h-24 w-auto sm:h-28 md:h-32 object-contain"
      style={{ aspectRatio: LOGO_RATIO }}
    />
  );

  return (
    <Link href="/" className="group shrink-0 inline-flex" aria-label="Global Shelf BD home">
      {light ? (
        // The artwork itself is drawn in navy/blue, so on a dark background (e.g. the
        // footer) it needs a light card behind it to stay visible and "pop" correctly.
        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">{image}</div>
      ) : (
        image
      )}
    </Link>
  );
}
