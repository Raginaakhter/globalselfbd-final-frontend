import {
  History,
  Truck,
  BadgeCheck,
  Bell,
  Boxes,
  CalendarClock,
  GalleryHorizontal,
  Layers,
  Megaphone,
  PanelBottom,
  CreditCard,
  FileText,
  FolderTree,
  House,
  KeyRound,
  ListOrdered,
  Mail,
  MessageSquare,
  Star,
  Ticket,
  Users,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export const BASE = "/admin-dashboard";

export type AccessLevel = "none" | "view" | "edit";

export type ModuleKey =
  | "dashboard"
  | "categories"
  | "products"
  | "combos"
  | "offers"
  | "orders"
  | "pre-orders"
  | "inventory"
  | "payments"
  | "invoices"
  | "users"
  | "contact-messages"
  | "coupons"
  | "reviews"
  | "banners"
  | "brands"
  | "footer"
  | "shipping"
  | "newsletter"
  | "notification-settings"
  | "activity-logs"
  | "roles";

export interface ModuleDef {
  key: ModuleKey;
  title: string;
  path: string;
  icon: LucideIcon;
  section: "main" | "bottom";
  /** Key of the backend `menu` item that grants this page (the backend decides who sees it). */
  menuKey?: string;
  /** For pages the backend menu does not list: any of these permissions grants view access. */
  viewAny?: string[];
  /** Any of these permissions allows changes on the page. */
  editAny: string[];
}

// Order here is the sidebar order.
export const MODULES: ModuleDef[] = [
  { key: "dashboard", title: "Dashboard", path: BASE, icon: House, section: "main", menuKey: "dashboard", editAny: [] },
  { key: "categories", title: "Categories", path: `${BASE}/categories`, icon: FolderTree, section: "main", menuKey: "categories", editAny: ["categories.create", "categories.update", "categories.delete"] },
  { key: "products", title: "Products", path: `${BASE}/products`, icon: WandSparkles, section: "main", menuKey: "products", editAny: ["products.create", "products.update", "products.delete"] },
  { key: "combos", title: "Combos", path: `${BASE}/combos`, icon: Layers, section: "main", viewAny: ["combos.view"], editAny: ["combos.create", "combos.update", "combos.delete"] },
  { key: "offers", title: "Offers", path: `${BASE}/offers`, icon: Megaphone, section: "main", viewAny: ["offers.view"], editAny: ["offers.create", "offers.update", "offers.delete"] },
  { key: "orders", title: "Orders", path: `${BASE}/orders`, icon: ListOrdered, section: "main", menuKey: "orders", editAny: ["orders.status", "orders.paymentStatus", "orders.delete"] },
  { key: "pre-orders", title: "Pre-Orders", path: `${BASE}/pre-orders`, icon: CalendarClock, section: "main", viewAny: ["orders.viewAll", "orders.viewOwn", "orders.viewAssigned"], editAny: ["orders.update", "orders.status", "orders.delete"] },
  { key: "inventory", title: "Inventory", path: `${BASE}/inventory`, icon: Boxes, section: "main", viewAny: ["inventory.view", "suppliers.view", "shipments.view", "stockRequests.view"], editAny: ["inventory.update", "inventory.create", "inventory.delete", "inventory.adjust", "suppliers.create", "suppliers.update", "suppliers.delete", "shipments.create", "shipments.update", "shipments.delete", "shipments.receive", "stockRequests.update", "stockRequests.delete"] },
  { key: "payments", title: "Payments", path: `${BASE}/payments`, icon: CreditCard, section: "main", menuKey: "payments", editAny: ["orders.paymentStatus"] },
  { key: "invoices", title: "Invoices", path: `${BASE}/invoices`, icon: FileText, section: "main", menuKey: "invoices", editAny: ["invoices.create"] },
  { key: "users", title: "Users", path: `${BASE}/users`, icon: Users, section: "main", menuKey: "users", editAny: ["users.create", "users.update", "users.delete", "users.changeRole"] },
  { key: "contact-messages", title: "Contact Messages", path: `${BASE}/contact-messages`, icon: MessageSquare, section: "main", menuKey: "contactMessages", editAny: ["contactMessages.update", "contactMessages.delete"] },
  { key: "coupons", title: "Coupons", path: `${BASE}/coupons`, icon: Ticket, section: "main", menuKey: "coupons", editAny: ["coupons.create", "coupons.update", "coupons.delete"] },
  { key: "reviews", title: "Reviews", path: `${BASE}/reviews`, icon: Star, section: "main", menuKey: "reviews", editAny: ["reviews.update", "reviews.delete"] },
  { key: "banners", title: "Banners", path: `${BASE}/banners`, icon: GalleryHorizontal, section: "bottom", viewAny: ["banners.view"], editAny: ["banners.create", "banners.update", "banners.delete"] },
  { key: "brands", title: "Brands", path: `${BASE}/brands`, icon: BadgeCheck, section: "bottom", viewAny: ["brands.view"], editAny: ["brands.create", "brands.update", "brands.delete"] },
  { key: "footer", title: "Footer", path: `${BASE}/footer`, icon: PanelBottom, section: "bottom", viewAny: ["settings.view"], editAny: ["settings.update"] },
  { key: "shipping", title: "Delivery Charges", path: `${BASE}/shipping`, icon: Truck, section: "bottom", viewAny: ["settings.view"], editAny: ["settings.update"] },
  { key: "newsletter", title: "Newsletter", path: `${BASE}/newsletter`, icon: Mail, section: "bottom", viewAny: ["newsletter.view"], editAny: ["newsletter.send", "newsletter.delete"] },
  { key: "notification-settings", title: "Notification Email", path: `${BASE}/notification-settings`, icon: Bell, section: "bottom", viewAny: ["settings.view"], editAny: ["settings.update"] },
  { key: "activity-logs", title: "Activity Logs", path: `${BASE}/activity-logs`, icon: History, section: "bottom", viewAny: ["activityLogs.view"], editAny: [] },
  { key: "roles", title: "Roles & Permissions", path: `${BASE}/roles`, icon: KeyRound, section: "bottom", viewAny: ["roles.view"], editAny: ["roles.create", "roles.update", "roles.delete", "roles.status"] },
];

/** Resolves which module a dashboard URL belongs to (longest path wins). */
export function moduleForPath(pathname: string): ModuleDef | undefined {
  return [...MODULES]
    .sort((a, b) => b.path.length - a.path.length)
    .find((m) => pathname === m.path || (m.path !== BASE && pathname.startsWith(`${m.path}/`)));
}

/** Routes that change data and therefore need edit access rather than view access. */
export const requiresEdit = (pathname: string) => /\/products\/(add|edit)(\/|$)/.test(pathname);

/** Access level from the backend session: the menu grants the page, permissions grant changes. */
export function levelFor(mod: ModuleDef, menuKeys: Set<string>, permissions: Set<string>, role?: string): AccessLevel {
  const r = (role || "").toLowerCase();
  if (r === "admin" || r === "superadmin" || permissions.has("*") || permissions.has("all")) {
    return "edit";
  }
  const canView = mod.menuKey ? menuKeys.has(mod.menuKey) : (mod.viewAny ?? []).some((p) => permissions.has(p));
  if (!canView) return "none";
  return mod.editAny.some((p) => permissions.has(p)) ? "edit" : "view";
}
