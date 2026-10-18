// Shapes returned by the Express API (see http://localhost:5000/api-docs).

export type Status = "ACTIVE" | "INACTIVE";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
  imageUrl: string | null;
  description: string;
  status: Status;
  parent?: { _id: string; name: string; slug: string; status: Status } | null;
  path?: string;
  level?: number;
  childrenCount?: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

export type ProductUnit = "KG" | "GM" | "Liter" | "ML" | "Meter" | "CM" | "Piece";

export interface Product {
  _id: string;
  productTitle: string;
  slug: string;
  productDescription: string;
  categoryId: { _id: string; name: string; slug: string; status: Status } | null;
  customerSellPrice: number;
  customerSpecialPrice: number | null;
  finalPrice: number;
  discountPercent: number;
  isFabric: boolean;
  sizes: string[];
  unit: ProductUnit | null;
  quantity: number | null;
  thumbnail: string;
  gallery: string[];
  availability: "IN_STOCK" | "OUT_OF_STOCK";
  status: Status;
  /** Sells without a stock requirement; always reported as IN_STOCK. */
  isPreOrder?: boolean;
  /** Promised fulfilment window in days (≥ 15 when isPreOrder, 0 otherwise). */
  preOrderMinDays?: number;
  /**
   * Ships at no shipping cost when every billable line in the cart is a product with this flag true.
   * Backend clamps to false when customerSpecialPrice is set (discounted products always pay shipping).
   */
  freeDelivery?: boolean;
  /** Staff with inventory.view only */
  stock?: number;
  /** Staff with products.update only */
  productCost?: number;
  /** From APPROVED reviews only */
  rating?: ProductRating;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOptions {
  categories: { _id: string; name: string; slug: string; path: string }[];
  sizes: string[];
  units: string[];
}

/** DELETE /products/:id — always 200; products used in any order are deactivated instead of removed. */
export type ProductDeleteResult =
  | { _id: string; productTitle: string; deleted: true; status?: undefined }
  | { _id: string; productTitle: string; deleted: false; status: Status };

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

/** Pre-order product limits enforced by the backend. */
export const PRE_ORDER_MIN_DAYS = 15;
export const PRE_ORDER_MAX_DAYS = 365;

/** Internal, append-only order note. Never returned on customer-facing endpoints. */
export interface AdminNote {
  _id?: string;
  note: string;
  addedBy: string | { _id: string; fullName?: string; email?: string } | null;
  addedAt: string;
}

/** Fields shared by every order shape that carries pre-order info. */
export interface PreOrderInfo {
  isPreOrder?: boolean;
  preOrderMinDays?: number;
  /** createdAt + preOrderMinDays (snapshot; not re-derived from product edits). */
  expectedDeliveryDate?: string | null;
}
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CASH_ON_DELIVERY" | "BKASH" | "NAGAD" | "ROCKET" | "CARD";
export type FulfillmentMethod = "DELIVERY" | "STORE_PICKUP";
export type AdminDiscountType = "PERCENTAGE" | "FIXED";

export interface ShippingInformation {
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  area: string;
  orderNotes?: string;
}

export interface OrderItem {
  _id: string;
  productId: string;
  productTitleSnapshot: string;
  thumbnailSnapshot: string;
  quantity: number;
  selectedSize: string | null;
  selectedUnit: string | null;
  unitPrice: number;
  subtotal: number;
  isPreOrder?: boolean;
}

export interface Order extends PreOrderInfo {
  _id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  discount: number;
  /** Coupon used on this order, if any */
  couponCode?: string | null;
  /** Backend says whether the customer may still cancel it */
  canCancel?: boolean;
  shippingCost: number;
  /** DELIVERY by default; STORE_PICKUP forces shippingCost to 0. */
  fulfillmentMethod?: FulfillmentMethod;
  /** Admin-applied discount (null for normal orders). */
  adminDiscountType?: AdminDiscountType | null;
  adminDiscountValue?: number;
  adminDiscountAmount?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingInformation: ShippingInformation;
  cancelledAt: string | null;
  cancellationReason?: string | null;
  /** Set when the order reaches that step; null until then. */
  confirmedAt?: string | null;
  readyToShipAt?: string | null;
  shippedAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
  /** Product price given back on refund; the delivery charge is never refunded */
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder extends Order {
  customer?: { _id: string; fullName: string; email: string } | null;
  allowedNextStatuses?: OrderStatus[];
  allowedNextPaymentStatuses?: PaymentStatus[];
  cancelledBy?: string | null;
  adminNotes?: AdminNote[];
}

export interface AdminOrderListItem extends PreOrderInfo {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  itemCount: number;
  totalQuantity: number;
  /** Product price before discount */
  subtotal: number;
  discount: number;
  /** Admin-only discount actually taken off the order (0 if none). */
  adminDiscountAmount?: number;
  /** DELIVERY (default) or STORE_PICKUP. */
  fulfillmentMethod?: FulfillmentMethod;
  /** Delivery charge */
  shippingCost: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
}

/** Response of POST /api/orders/checkout (preview without saving). */
export interface CheckoutPreview extends PreOrderInfo {
  items: {
    productId: string;
    comboId: string | null;
    productTitle: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: number;
  coupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    eligibleSubtotal: number;
    discount: number;
  } | null;
  adminDiscount?: {
    type: AdminDiscountType;
    value: number;
    amount: number;
    eligibleSubtotal: number;
  } | null;
  fulfillmentMethod: FulfillmentMethod;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  shippingInformation: ShippingInformation;
  /** Gates the admin-only discount controls in the checkout UI. */
  canUseAdminDiscount: boolean;
}

export interface OrderListItem extends PreOrderInfo {
  _id: string;
  orderNumber: string;
  itemCount: number;
  totalQuantity: number;
  firstItem: { productTitle: string; thumbnail: string } | null;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
}

/** Response of POST /api/public/orders/track (guest lookup by phone + order number). */
export interface TrackedOrder extends PreOrderInfo {
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentMethod?: FulfillmentMethod;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  cancellationReason?: string | null;
  items?: { productTitle: string; thumbnail: string; quantity: number; unitPrice: number; subtotal: number; isPreOrder?: boolean }[];
  shippingInformation?: Partial<ShippingInformation>;
  timeline?: {
    placedAt: string | null;
    confirmedAt: string | null;
    readyToShipAt: string | null;
    shippedAt: string | null;
    outForDeliveryAt: string | null;
    deliveredAt: string | null;
    cancelledAt: string | null;
  };
  /** Older responses */
  itemCount?: number;
}

export interface RoleRef {
  _id: string;
  name: string;
  status: Status;
  isProtected?: boolean;
}

export interface BackendUser {
  _id: string;
  fullName: string;
  email: string;
  role: RoleRef | null;
  status: Status;
  /** Primary field on the new phone-first API. */
  phoneNumber?: string;
  /** Legacy field for pre-migration responses. */
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  status: Status;
  isProtected: boolean;
  userCount?: number;
  permissionCount?: number;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  _id: string;
  name: string;
  module: string;
  action: string;
  description: string;
}

export interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  selectedSize: string | null;
  selectedUnit: string | null;
  unitPrice: number;
  subtotal: number;
  productSnapshot: { productTitle: string; slug: string; thumbnail: string; customerSellPrice: number; customerSpecialPrice: number | null };
  availability: "IN_STOCK" | "OUT_OF_STOCK";
  isAvailable: boolean;
  issue: string | null;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  hasIssues: boolean;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Cash on Delivery",
  BKASH: "bKash",
  NAGAD: "Nagad",
  ROCKET: "Rocket",
  CARD: "Card",
};

/* ---------- Landing page content (banners, brands, footer) ---------- */

/** HERO = big banner (several = slider), PROMO = small promo card beside it (max 2 active). */
export type BannerPlacement = "HERO" | "PROMO";

export interface Banner {
  _id: string;
  placement: BannerPlacement;
  imageUrl: string;
  mobileImageUrl: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  /** A path like "/shop" or a full http(s) URL. */
  buttonLink: string;
  altText: string;
  sortOrder: number;
  status?: Status;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  link: string;
  isFeatured: boolean;
  sortOrder: number;
  status?: Status;
  createdAt?: string;
  updatedAt?: string;
}

export const SOCIAL_NETWORKS = ["facebook", "instagram", "youtube", "tiktok", "twitter", "linkedin", "whatsapp"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export interface FooterSettings {
  logoUrl: string;
  aboutText: string;
  contact: { phone: string; email: string; address: string };
  socialLinks: Record<SocialNetwork, string>;
  columns: { title: string; links: { label: string; url: string }[] }[];
  copyrightText: string;
}

export const EMPTY_FOOTER: FooterSettings = {
  logoUrl: "",
  aboutText: "",
  contact: { phone: "", email: "", address: "" },
  socialLinks: { facebook: "", instagram: "", youtube: "", tiktok: "", twitter: "", linkedin: "", whatsapp: "" },
  columns: [],
  copyrightText: "",
};

/* ---------- Reports ---------- */

export type ReportPeriodKey = "today" | "yesterday" | "last7Days" | "last14Days" | "last30Days" | "last6Months" | "last1Year";

export interface PaymentPeriod {
  key: ReportPeriodKey;
  label: string;
  from: string;
  to: string;
  received: PaymentTotals;
  refunded: PaymentTotals;
  net: number;
  netSplit: MoneySplit;
}

/** Product money (after discount) is the company's; the delivery charge goes to the delivery company. */
export interface MoneySplit {
  productAmount: number;
  shippingCost: number;
}

export interface PaymentTotals extends MoneySplit {
  amount: number;
  orders: number;
}

export interface PaymentsReport {
  currency: string;
  timezone: string;
  periods: PaymentPeriod[];
  outstanding: MoneySplit & { amount: number; orders: number; byPaymentMethod: { paymentMethod: PaymentMethod; orders: number; amount: number }[] };
}

export interface SalesPeriod {
  key: ReportPeriodKey;
  label: string;
  from: string;
  to: string;
  amount: number;
  orders: number;
  /** Delivered orders that were refunded; they count their delivery charge only */
  refundedOrders?: number;
  productSales: number;
  shippingCost: number;
  discount: number;
}

export interface SalesReport {
  currency: string;
  timezone: string;
  basis: string;
  periods: SalesPeriod[];
  ordersByStatus: Partial<Record<OrderStatus, MoneySplit & { orders: number; amount: number }>>;
}

export type SalesChartRange = "7d" | "14d" | "30d" | "6m" | "1y";

export interface SalesChart {
  range: SalesChartRange;
  groupBy: "day" | "month";
  currency: string;
  total: MoneySplit & { amount: number; orders: number };
  points: (MoneySplit & { label: string; amount: number; orders: number })[];
}

/* ---------- Delivery charges ---------- */

export interface ShippingSettings {
  currency: string;
  /** Site-wide kill switch. When false, every order's shipping cost is forced to 0 regardless of other rules. */
  deliveryChargesEnabled: boolean;
  insideDhaka: number;
  outsideDhaka: number;
  /** Backend free-delivery threshold (0 = off). Not shown on the website. */
  freeShippingMinimum: number;
  rule: string;
  /** Only with ?city= on GET /api/public/shipping: the exact charge the order will use. */
  quote?: { city: string; area: "INSIDE_DHAKA" | "OUTSIDE_DHAKA"; subtotal: number; charge: number };
}

/** GET/PUT /api/settings/preorder — controls the backend's auto pre-order behaviour. */
export interface PreOrderSettings {
  /** When true, a product auto-flips to isPreOrder on stock-out (and reverts on restock). */
  autoEnableOnStockOut: boolean;
  /** Delivery window applied when auto-enabling (whole number, PRE_ORDER_MIN_DAYS..PRE_ORDER_MAX_DAYS). */
  defaultPreOrderDays: number;
  /** Business floor, read-only. */
  minDeliveryDays: number;
  /** Business ceiling, read-only. */
  maxDeliveryDays: number;
}

/* ---------- Accounting (expenses + P&L) ---------- */

export type ExpenseType =
  | "AD_COST"
  | "DELIVERY_COST"
  | "DAMAGE_COST"
  | "SALARY"
  | "RENT"
  | "UTILITY"
  | "PACKAGING"
  | "COMMISSION"
  | "OTHER";

export const EXPENSE_TYPES: ExpenseType[] = [
  "AD_COST",
  "DELIVERY_COST",
  "DAMAGE_COST",
  "SALARY",
  "RENT",
  "UTILITY",
  "PACKAGING",
  "COMMISSION",
  "OTHER",
];

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  AD_COST: "Ad cost",
  DELIVERY_COST: "Delivery cost",
  DAMAGE_COST: "Damage cost",
  SALARY: "Salary",
  RENT: "Rent",
  UTILITY: "Utility",
  PACKAGING: "Packaging",
  COMMISSION: "Commission",
  OTHER: "Other",
};

export interface Expense {
  _id: string;
  type: ExpenseType;
  amount: number;
  description: string;
  expenseDate: string;
  paidVia?: string | null;
  /** Populated on GET /:id, string ref elsewhere. */
  orderId?: string | { _id: string; orderNumber: string; totalAmount: number } | null;
  productId?: string | { _id: string; productTitle: string; sku?: string } | null;
  createdBy?: string | { _id: string; fullName?: string; email?: string } | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/admin/expenses/summary — totals + per-type breakdown over a date range. */
export interface ExpensesSummary {
  currency: string;
  from: string;
  to: string;
  total: number;
  count: number;
  byType: { type: ExpenseType; amount: number; count: number }[];
}

export interface PnlPeriodTotals {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expensesTotal: number;
  expensesByType: Partial<Record<ExpenseType, number>>;
  netProfit: number;
  margin: number;
  orders: number;
  shippingCollected: number;
  discount: number;
  adminDiscount: number;
}

export type PnlPeriodKey =
  | "today"
  | "yesterday"
  | "last7Days"
  | "last14Days"
  | "last30Days"
  | "last6Months"
  | "last1Year";

export interface PnlPeriod {
  key: PnlPeriodKey;
  label: string;
  from: string;
  to: string;
  totals: PnlPeriodTotals;
}

/** GET /api/reports/pnl — rolling-windows mode (no fromDate/toDate query). */
export interface PnlRollingReport {
  currency: string;
  timezone: string;
  periods: PnlPeriod[];
}

/** GET /api/reports/pnl?fromDate=&toDate= — single custom range. */
export interface PnlCustomRangeReport {
  currency: string;
  timezone: string;
  range: { from: string; to: string; label: string };
  totals: PnlPeriodTotals;
}

export type PnlReport = PnlRollingReport | PnlCustomRangeReport;

export const isPnlRolling = (r: PnlReport): r is PnlRollingReport => "periods" in r;

/** GET /api/admin/orders/:id/profit — full breakdown for one order. */
export interface OrderProfit {
  currency: string;
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  units: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  shippingCollected: number;
  discount: number;
  adminDiscount: number;
  expensesTotal: number;
  expensesByType: Partial<Record<ExpenseType, number>>;
  netProfit: number;
  margin: number;
  note: string | null;
}

/* ---------- Newsletter ---------- */

export type SubscriberStatus = "SUBSCRIBED" | "UNSUBSCRIBED";

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  status: SubscriberStatus;
  source: string;
  userId: string | null;
  subscribedAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
}

export interface SubscriberSummary {
  subscribed: number;
  unsubscribed: number;
  total: number;
}

export type CampaignType = "NEW_PRODUCT" | "OFFER" | "ANNOUNCEMENT";
export type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";

export interface CampaignProduct {
  _id: string;
  productTitle: string;
  slug: string;
  thumbnail: string;
  customerSellPrice: number;
  customerSpecialPrice: number | null;
  status: Status;
}

export interface NewsletterCampaign {
  _id: string;
  type: CampaignType;
  subject: string;
  heading: string;
  message: string;
  productIds: string[];
  /** Included on create/get/update, not in the list */
  products?: CampaignProduct[];
  buttonText: string;
  buttonLink: string;
  status: CampaignStatus;
  recipients: number;
  sentCount: number;
  failedCount: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignPreview {
  subject: string;
  html: string;
  text: string;
  products: number;
}

/* ---------- Activity logs ---------- */

export const ACTIVITY_ACTIONS = [
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_DELETED",
  "ROLE_STATUS_CHANGED",
  "USER_ROLE_CHANGED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_STATUS_CHANGED",
  "PERMISSION_ASSIGNED",
  "PERMISSION_REMOVED",
  "ORDER_CREATED",
  "ORDER_CONFIRMED",
  "ORDER_PROCESSING",
  "ORDER_READY_TO_SHIP",
  "ORDER_SHIPPED",
  "ORDER_OUT_FOR_DELIVERY",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
  "PAYMENT_STATUS_CHANGED",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface ActivityLog {
  _id: string;
  actorUserId: { _id: string; fullName: string; email: string } | null;
  action: ActivityAction | string;
  /** Populated targets; null when the target was deleted, absent when not relevant. */
  targetUserId?: { _id: string; fullName: string; email: string } | null;
  targetRoleId?: { _id: string; name: string } | null;
  targetOrderId?: { _id: string; orderNumber: string } | null;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

/* ---------- Contact messages ---------- */

export type ContactStatus = "NEW" | "READ" | "REPLIED";

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactStatus;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSummary {
  new: number;
  read: number;
  replied: number;
  total: number;
}

/* ---------- Coupons ---------- */

export type DiscountType = "PERCENTAGE" | "FIXED";
export type CouponScope = "ENTIRE_ORDER" | "CATEGORIES" | "PRODUCTS";
/** Saved status plus dates and usage */
export type CouponState = "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED" | "USED_UP";

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  scope: CouponScope;
  categoryIds: string[];
  productIds: string[];
  startsAt: string;
  expiresAt: string;
  status: Status;
  usedCount: number;
  state: CouponState;
  remainingUses: number | null;
  createdAt: string;
  updatedAt: string;
  /** GET /coupons/:id only */
  categories?: { _id: string; name: string; slug: string }[];
  products?: { _id: string; productTitle: string; slug: string; thumbnail: string }[];
}

/* ---------- Invoices ---------- */

/** Order and payment statuses are live from the order, not frozen on the invoice. */
export interface InvoiceListItem {
  _id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  issuedAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  /** Product price given back on refund (0 when not refunded) */
  refundAmount: number;
  itemCount: number;
}

export interface InvoiceItem {
  productId: string;
  productTitle: string;
  selectedSize: string | null;
  selectedUnit: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice extends Omit<InvoiceListItem, "itemCount"> {
  customerEmail: string | null;
  shippingAddress: string;
  shippingArea: string;
  shippingCity: string;
  items: InvoiceItem[];
  paidAt: string | null;
  deliveredAt: string | null;
  /** totalAmount - refundAmount */
  netAmount: number;
  seller: { name: string; logoUrl: string; phone: string; email: string; address: string };
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalSales: number;
  todayInvoices: number;
  todaySales: number;
  totalProductSales: number;
  totalShipping: number;
  todayProductSales: number;
  todayShipping: number;
  basis: string;
}

export type InvoiceDateRange = "today" | "yesterday" | "last7Days" | "last30Days" | "thisMonth" | "lastMonth";

/* ---------- Reviews ---------- */

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";

export interface ProductRating {
  averageRating: number;
  totalReviews: number;
}

export interface AdminReview {
  _id: string;
  customerId: string;
  orderId: string;
  productId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  productTitle: string;
  productImage: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  showOnHomepage: boolean;
  /** Other products the admin attached this review to (it also shows on their pages) */
  associatedProductIds: string[];
  associatedProducts: ReviewProductRef[];
  /** Slug of the product the customer bought */
  productSlug: string | null;
  moderatedBy: string | null;
  moderatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** GET /admin/reviews/:id only */
  product?: { _id: string; slug: string; status: Status; ratingAverage: number; ratingCount: number } | null;
  moderatedByName?: string | null;
  audit?: ReviewAuditEntry[];
}

export interface ReviewProductRef {
  _id: string;
  productTitle: string;
  slug: string;
  thumbnail: string;
  status: Status;
}

export interface ReviewAuditEntry {
  action: string;
  by: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  at: string;
}

export interface AdminReviewSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hidden: number;
  onHomepage: number;
}

/** Public review (APPROVED only) */
export interface PublicReview {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  /** Set on reviews an admin attached from another product: the product actually bought */
  reviewedProduct?: string;
  createdAt: string;
}

export interface ProductReviewSummary extends ProductRating {
  breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface HomepageReview extends PublicReview {
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
}

export interface ReviewEligibility {
  eligible: boolean;
  alreadyReviewed: boolean;
  productId: string;
  orders: { orderId: string; orderNumber: string; deliveredAt: string }[];
}

export interface MyReview {
  _id: string;
  orderNumber: string;
  productTitle: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
}

/* ---------- Combos ---------- */

export interface ComboItemDetail {
  productId: string;
  productTitle: string;
  slug: string;
  thumbnail: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Combo {
  _id: string;
  comboTitle: string;
  slug: string;
  description: string;
  comboPrice: number;
  thumbnail: string;
  gallery: string[];
  categoryId: string | null;
  items: { productId: string; quantity: number }[];
  itemDetails: ComboItemDetail[];
  originalTotal: number;
  savings: number;
  discountPercent: number;
  startsAt: string | null;
  endsAt: string | null;
  status: Status;
  isLive: boolean;
  displayOrder: number;
  soldCount: number;
  revenue: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComboPickerProduct {
  _id: string;
  productTitle: string;
  slug: string;
  thumbnail: string;
  customerSellPrice: number;
  customerSpecialPrice: number | null;
  finalPrice: number;
  stock: number;
}

export interface ComboStats {
  _id: string;
  comboTitle: string;
  views: number;
  soldCount: number;
  revenue: number;
}

export interface ComboStatsSummary {
  totals: {
    totalRevenue: number;
    totalSold: number;
    totalViews: number;
    totalCombos: number;
  };
  topPerformers: {
    _id: string;
    comboTitle: string;
    slug: string;
    comboPrice: number;
    soldCount: number;
    revenue: number;
    thumbnail: string;
  }[];
}

/* ---------- Offers ---------- */

export type OfferState = "ACTIVE" | "INACTIVE" | "SCHEDULED" | "ENDED";

export interface Offer {
  _id: string;
  title: string;
  slug: string;
  description: string;
  bannerImage: string | null;
  badgeColor: string | null;
  badgeLabel: string;
  discountType: DiscountType;
  discountValue: number;
  startsAt: string;
  endsAt: string;
  productIds: string[];
  categoryIds: string[];
  minOrderValue: number | null;
  status: Status;
  state: OfferState;
  displayOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** GET /api/offers/:id only */
  products?: { _id: string; productTitle: string; slug: string; thumbnail: string }[];
  categories?: { _id: string; name: string; slug: string }[];
}

/* ---------- Updated Cart Item (combo support) ---------- */

export interface CartItemV2 {
  _id: string;
  type: "product" | "combo";
  productId: string | null;
  comboId: string | null;
  quantity: number;
  selectedSize: string | null;
  selectedUnit: string | null;
  unitPrice: number;
  subtotal: number;
  productSnapshot: { productTitle: string; slug: string; thumbnail: string; customerSellPrice: number; customerSpecialPrice: number | null } | null;
  comboSnapshot: {
    comboTitle: string;
    slug: string;
    thumbnail: string;
    comboPrice: number;
    items: { productId: string; productTitle: string; quantity: number; unitPrice: number }[];
  } | null;
  availability: "IN_STOCK" | "OUT_OF_STOCK";
  isAvailable: boolean;
  issue: string | null;
}

export interface CartV2 {
  _id: string;
  customerId: string;
  items: CartItemV2[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  hasIssues: boolean;
}

/* ---------- Updated Order Item (combo support) ---------- */

export interface OrderItemV2 extends OrderItem {
  type?: "product" | "combo";
  comboId?: string | null;
  comboItemsSnapshot?: { productId: string; productTitle: string; quantity: number; unitPrice: number }[];
}

/* ---------- Inventory ---------- */

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type ShipmentStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export type StockRequestStatus = "NEW" | "NOTIFIED" | "RESOLVED" | "CANCELLED";

export type SupplierStatus = "ACTIVE" | "INACTIVE";

export type LotStatus = "ACTIVE" | "DEPLETED" | "CANCELLED";

export type StockMovementType =
  | "PURCHASE"
  | "SALE"
  | "RESERVATION"
  | "RELEASE"
  | "RETURN"
  | "DAMAGE"
  | "LOSS"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "MANUAL_STOCK_UPDATE"
  | "EXPIRY"
  | "INTERNAL_USE";

export interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  damagedQuantity: number;
  returnedQuantity: number;
  inventoryCost: number;
  inventoryValue: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  profitMargin: number;
  /** SKUs currently auto-flipped to pre-order (stock = 0, still buyable because autoEnableOnStockOut is on). */
  autoPreOrderCount?: number;
  /** SKUs an admin manually marked as pre-order (never auto-overridden on restock). */
  manualPreOrderCount?: number;
  shipments: { total: number; pending: number };
  suppliers: { active: number };
}

/** How a product became isPreOrder: MANUAL = admin toggled it; AUTO = backend auto-flipped on stock-out; NONE = not a pre-order. */
export type PreOrderSource = "MANUAL" | "AUTO" | "NONE";

export interface InventoryRow {
  _id: string;
  productTitle: string;
  slug: string;
  sku: string | null;
  stock: number;
  reserved: number;
  available: number;
  soldQuantity: number;
  soldRevenue: number;
  returnedQuantity: number;
  damagedQuantity: number;
  productCost: number;
  customerSellPrice: number;
  customerSpecialPrice: number | null;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  isPreOrder: boolean;
  /** Present when the admin inventory endpoint returns it; absent on older backend versions. */
  preOrderSource?: PreOrderSource | null;
  cogs: number;
  profit: number;
  margin: number;
  status: Status;
}

export interface InventoryLot {
  _id: string;
  productId?: string | { _id: string; productTitle?: string; sku?: string | null };
  shipmentId?: string | null;
  supplierId?: { _id?: string; name?: string } | string | null;
  lotNumber: string;
  receivedQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  landedUnitCost: number;
  sellingPrice: number;
  receivedDate: string;
  expiryDate?: string | null;
  status: LotStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovement {
  _id?: string;
  productId: string | { _id?: string; productTitle?: string; sku?: string | null };
  lotId?: string | null;
  shipmentId?: string | null;
  orderId?: string | null;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  reason?: string;
  createdBy?: string | { _id?: string; fullName?: string } | null;
  createdAt: string;
}

export interface InventoryProductDetail {
  product: InventoryRow;
  lots: InventoryLot[];
  recentMovements: StockMovement[];
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status: SupplierStatus;
  shipmentCount?: number;
  lotCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShipmentItem {
  _id?: string;
  itemId?: string;
  productId: string | { _id: string; productTitle?: string; sku?: string | null; thumbnail?: string };
  purchaseQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  landedUnitCost?: number;
  sellingPrice?: number;
  notes?: string;
}

export interface Shipment {
  _id: string;
  shipmentNumber: string;
  supplierId: Supplier | string | null;
  shipmentDate: string;
  expectedDate?: string | null;
  receivedDate?: string | null;
  status: ShipmentStatus;
  items: ShipmentItem[];
  subtotal: number;
  shippingCost: number;
  customsCost: number;
  tax: number;
  otherCost: number;
  totalCost: number;
  notes?: string;
  totalProducts?: number;
  totalQuantity?: number;
  totalReceived?: number;
  createdBy?: { _id?: string; fullName?: string } | string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockRequest {
  _id: string;
  productId: { _id: string; productTitle: string; sku?: string | null } | string;
  customerId?: { _id: string; fullName?: string; phoneNumber?: string; email?: string } | string | null;
  requestedQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  status: StockRequestStatus;
  adminNote?: string;
  notifiedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryValidationResult {
  productId: string;
  requested: number;
  available: number | null;
  ok: boolean;
  stockStatus: StockStatus | null;
  isPreOrder: boolean;
}

export interface CartStockValidation {
  cartId: string;
  ok: boolean;
  issues: {
    cartItemId: string;
    type: "product" | "combo";
    productId: string | null;
    comboId: string | null;
    productTitle: string;
    requested: number;
    available: number;
    issue: string;
  }[];
}

export interface OrderStockValidation {
  ok: boolean;
  reason?: string;
}

export interface ProfitReport {
  rows: {
    productId: string;
    productTitle: string;
    sku: string | null;
    soldQuantity: number;
    revenue: number;
    cogs: number;
    profit: number;
    margin: number;
  }[];
  totals: { revenue: number; cogs: number; profit: number; margin: number };
}

export interface PurchaseReport {
  shipments: {
    _id?: string;
    shipmentNumber: string;
    supplier: string;
    shipmentDate: string;
    status: ShipmentStatus;
    totalItems: number;
    quantity: number;
    received: number;
    subtotal: number;
    totalCost: number;
  }[];
  totals: { subtotal: number; totalCost: number; quantity: number; received: number };
}

export interface ValuationReport {
  rows: {
    productId?: string;
    productTitle: string;
    sku: string | null;
    stock: number;
    unitCost: number;
    sellPrice: number;
    costValue: number;
    sellValue: number;
  }[];
  totals: { costValue: number; sellValue: number };
}

/* ---------- Steadfast Courier ---------- */

export type CourierBookingStatus = "IN_PROGRESS" | "SUCCESS" | "FAILED" | "UNCERTAIN";

export type CourierDeliveryStatus =
  | "pending"
  | "in_review"
  | "hold"
  | "delivered"
  | "partial_delivered"
  | "cancelled"
  | "exceptional"
  | "unknown"
  | "delivered_approval_pending"
  | "partial_delivered_approval_pending"
  | "cancelled_approval_pending"
  | "unknown_approval_pending";

export type CourierSettlementStatus =
  | "PENDING"
  | "PARTIALLY_SETTLED"
  | "SETTLED"
  | "UNDER_RECONCILIATION"
  | "DISPUTED";

export type DeliveryMethod = "MANUAL" | "STEADFAST";

export interface CourierSummary {
  totalShipments: number;
  booking: {
    inProgress: number;
    success: number;
    failed: number;
    uncertain: number;
  };
  delivery: Record<CourierDeliveryStatus, number>;
  settlement: {
    pending: number;
    partiallySettled: number;
    settled: number;
    underReconciliation: number;
    disputed: number;
  };
  totals: {
    codSubmitted: number;
    codReceived: number;
    codOutstanding: number;
    configuredCharge: number;
    actualCharge: number;
  };
  courierBalance: number | null;
  configured: boolean;
}

export interface CourierShipmentListItem {
  _id: string;
  orderNumber: string;
  invoice: string;
  consignmentId: string | null;
  trackingCode: string | null;
  customerName: string;
  customerPhone: string;
  bookingStatus: CourierBookingStatus;
  deliveryStatus: CourierDeliveryStatus;
  settlementStatus: CourierSettlementStatus;
  codAmountSubmitted: number;
  codAmountReceived: number;
  codOutstanding: number;
  configuredCharge: number;
  actualCharge: number | null;
  orderTotal: number;
  isFinalDelivered: boolean;
  returnRequestedAt: string | null;
  cancellationRequestedAt: string | null;
  createdAt: string;
}

export interface CourierShipmentItem {
  productId?: string;
  productTitle: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CourierShipmentDetail extends Omit<CourierShipmentListItem, "customerName" | "customerPhone"> {
  courierInvoice: string | null;
  bookingAttemptedAt: string | null;
  bookingSucceededAt: string | null;
  bookingFailureReason?: string | null;
  lastDeliveryStatusSyncedAt: string | null;
  lastDeliveryStatusSyncError?: string | null;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string | null;
  deliveryAddress: string;
  items: CourierShipmentItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  advancePaid: number;
  cancellationApiResponse?: string | null;
  returnReceivedAt?: string | null;
  returnInspectionCompletedAt?: string | null;
  lastSettlementRecordedAt?: string | null;
}

export interface CourierStatusEvent {
  _id: string;
  previousStatus: CourierDeliveryStatus | null;
  newStatus: CourierDeliveryStatus;
  isTransition: boolean;
  source: "API_POLL" | "WEBHOOK" | "MANUAL" | string;
  note?: string | null;
  createdAt: string;
}

export interface CourierReturnRequest {
  _id: string;
  status: "REQUESTED" | "PARCEL_RECEIVED" | "RESTOCKED" | string;
  reason?: string;
  parcelReceivedAt?: string | null;
  stockRestoredAt?: string | null;
  inspectionNotes?: string | null;
  createdAt: string;
}

export interface CourierSettlement {
  _id: string;
  amount: number;
  receivedAt: string;
  source: string;
  payoutId?: string | null;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CourierShipmentFullResponse {
  shipment: CourierShipmentDetail;
  events: CourierStatusEvent[];
  returnRequests: CourierReturnRequest[];
  settlements: CourierSettlement[];
}

export interface CourierSettings {
  outboundCharge: number;
  returnCharge: number;
  configured: boolean;
}

export interface CourierBookingResponse {
  _id: string;
  consignmentId: string | null;
  trackingCode: string | null;
  bookingStatus: CourierBookingStatus;
  deliveryStatus: CourierDeliveryStatus;
  codAmountSubmitted: number;
  settlementStatus: CourierSettlementStatus;
  bookingFailureReason?: string;
}
