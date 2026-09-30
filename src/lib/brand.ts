// Central brand constants. Change LOGO_URL here to swap the logo everywhere
// (site header, dashboard sidebar, invoices, Open Graph share preview and
// the invoice fallback when the backend has no seller logo set).
export const LOGO_URL = "https://res.cloudinary.com/dqkczdjjs/image/upload/v1790744894/logo-compact_s8ceyx.webp";

// Favicons served via Cloudinary's on-the-fly resize.
// c_pad,b_transparent keeps the aspect ratio and pads with transparency so
// the icon stays sharp at square sizes browsers actually use.
const cld = (t: string) =>
  `https://res.cloudinary.com/dqkczdjjs/image/upload/${t},c_pad,b_transparent,f_png/v1790744894/logo-compact_s8ceyx.webp`;
export const FAVICON_32 = cld("w_32,h_32");
export const FAVICON_192 = cld("w_192,h_192");
export const APPLE_ICON_180 = cld("w_180,h_180");
