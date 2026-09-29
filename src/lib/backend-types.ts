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

export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CASH_ON_DELIVERY" | "BKASH" | "NAGAD" | "ROCKET" | "CARD";

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
}

export interface Order {
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
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingInformation: ShippingInformation;
  cancelledAt: string | null;
  /** Set when the order reaches that step; null until then. */
  confirmedAt?: string | null;
  shippedAt?: string | null;
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
}

export interface AdminOrderListItem {
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
  /** Delivery charge */
  shippingCost: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
}

export interface OrderListItem {
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
  /** Empty string when not set. */
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
  ordersByStatus: Record<OrderStatus, MoneySplit & { orders: number; amount: number }>;
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
  insideDhaka: number;
  outsideDhaka: number;
  /** Backend free-delivery threshold (0 = off). Not shown on the website. */
  freeShippingMinimum: number;
  rule: string;
  /** Only with ?city= on GET /api/public/shipping: the exact charge the order will use. */
  quote?: { city: string; area: "INSIDE_DHAKA" | "OUTSIDE_DHAKA"; subtotal: number; charge: number };
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
  "ORDER_SHIPPED",
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
