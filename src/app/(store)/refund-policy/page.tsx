import type { Metadata } from "next";
import { fetchSite } from "@/lib/site-fetch";
import LegalPageLayout, { type LegalSection } from "@/components/legal/LegalPageLayout";
import ContactDetailsBlock from "@/components/legal/ContactDetailsBlock";

export const metadata: Metadata = {
  title: "Refund & Return Policy | Global Shelf BD",
  description: "How returns, replacements and refunds work at Global Shelf BD.",
};

const LAST_UPDATED = "September 29, 2026";

function buildSections(): LegalSection[] {
  return [
    {
      title: "1. Return Request Period",
      body: (
        <>
          <p>Customers may request a return within <strong>24 hours</strong> of receiving the product.</p>
          <p>For damaged, defective, incorrect, or expired products, customers must contact us within this 24-hour period.</p>
          <p>We strongly recommend checking your package and products immediately upon delivery.</p>
        </>
      ),
    },
    {
      title: "2. Conditions for Return",
      body: (
        <>
          <p>To be eligible for a return, the product must:</p>
          <ul>
            <li>Be unused and in its original condition.</li>
            <li>Have the original packaging, seals, tags, labels, and accessories intact, where applicable.</li>
            <li>Not be opened, consumed, altered, or damaged after delivery.</li>
            <li>Be accompanied by valid proof of purchase/order information.</li>
            <li>Fall within a category that is eligible for return under this policy.</li>
          </ul>
          <p>
            Depending on the nature of the claim, we may request photographs or videos of the product, packaging, barcode, batch number, expiry date,
            or other relevant information before approving the return.
          </p>
        </>
      ),
    },
    {
      title: "3. Damaged or Defective Products",
      body: (
        <>
          <p>If you receive a product that is damaged or defective, please contact us within 24 hours of delivery. We may ask you to provide:</p>
          <ul>
            <li>Order number or proof of purchase</li>
            <li>Photographs/videos of the damaged or defective product</li>
            <li>Photographs of the outer packaging</li>
            <li>Product barcode, batch number, or serial number, where applicable</li>
            <li>Expiry date, where applicable</li>
          </ul>
          <p>After reviewing the information, Global Shelf BD will determine the appropriate solution. Depending on availability and the circumstances, we may offer: Replacement, Refund, or another appropriate resolution.</p>
          <p>Products damaged as a result of customer misuse, improper storage, alteration, or failure to follow the manufacturer&apos;s instructions will generally not qualify for a return or refund.</p>
        </>
      ),
    },
    {
      title: "4. Wrong Product Delivered",
      body: (
        <>
          <p>If you receive a product different from the one you ordered, please contact us within 24 hours of delivery.</p>
          <p>Please provide your order number and clear photographs of the product and packaging.</p>
          <p>After verification, we will arrange an appropriate resolution, which may include replacement of the correct product or a refund.</p>
        </>
      ),
    },
    {
      title: "5. Expired or Incorrectly Labelled Products",
      body: (
        <>
          <p>We take product authenticity, quality, and expiry dates seriously.</p>
          <p>If you receive a product that is already expired or has a significant product/label discrepancy, please contact us within 24 hours of delivery.</p>
          <p>Subject to verification, we may provide a replacement or refund as appropriate.</p>
        </>
      ),
    },
    {
      title: "6. Non-Returnable Products",
      body: (
        <>
          <p>For safety, hygiene, quality, and regulatory reasons, certain products may not be eligible for return. These may include, but are not limited to:</p>
          <ul>
            <li>Food and beverage products</li>
            <li>Baby food and infant products</li>
            <li>Snacks and confectionery</li>
            <li>Opened or unsealed products</li>
            <li>Products with broken or removed safety seals</li>
            <li>Personal care and hygiene products that have been opened</li>
            <li>Cosmetics or beauty products that have been opened or used</li>
            <li>Perishable products</li>
            <li>Customized or specially ordered products</li>
            <li>Products purchased under certain clearance or promotional offers</li>
            <li>Gift cards, where applicable</li>
          </ul>
          <p>
            <strong>Important:</strong> Even if a product belongs to a non-returnable category, customers should contact us if the product arrives
            damaged, defective, incorrect, or expired. Such cases will be reviewed individually.
          </p>
        </>
      ),
    },
    {
      title: "7. Change of Mind",
      body: (
        <>
          <p>
            We understand that circumstances can change. However, returns based solely on a change of mind may not be accepted, particularly for
            food, baby products, personal care, beauty, hygiene, and other products where safety or product integrity may be affected.
          </p>
          <p>Please carefully review the product description, size, quantity, ingredients, specifications, and other available information before placing your order.</p>
          <p>If you need additional information before purchasing, please contact our customer service team.</p>
        </>
      ),
    },
    {
      title: "8. Discounted or Promotional Products",
      body: (
        <p>
          Products purchased under special discounts, clearance offers, promotional campaigns, bundle offers, or other special terms may have
          different return or refund conditions. The applicable terms will be communicated with the relevant offer or product listing.
        </p>
      ),
    },
    {
      title: "9. Return Procedure",
      body: (
        <>
          <p>Please do not send any product back to us without first contacting Global Shelf BD and receiving return instructions.</p>
          <p>To initiate a return request:</p>
          <ul>
            <li><strong>Step 1:</strong> Contact our customer service team within 24 hours of receiving your order.</li>
            <li><strong>Step 2:</strong> Provide your order number and explain the reason for the return.</li>
            <li><strong>Step 3:</strong> Provide photographs/videos or other information requested by our team.</li>
            <li><strong>Step 4:</strong> We will review the claim and inform you whether the return request is approved.</li>
            <li><strong>Step 5:</strong> If approved, we will provide instructions regarding how and where to return the product.</li>
          </ul>
          <p>Products returned without prior approval may not be accepted.</p>
        </>
      ),
    },
    {
      title: "10. Return Shipping",
      body: (
        <>
          <p>
            For products that are confirmed to be damaged, defective, incorrect, or otherwise eligible due to an error attributable to Global Shelf
            BD, we will determine the appropriate return shipping arrangement.
          </p>
          <p>For other approved returns, the customer may be responsible for applicable return delivery costs.</p>
          <p>Return shipping arrangements may vary depending on the product category and circumstances of the return.</p>
        </>
      ),
    },
    {
      title: "11. Refund Process",
      body: (
        <>
          <p>Once a returned product has been received and inspected, we will notify you regarding the status of your refund.</p>
          <p>If your refund is approved, the applicable amount will be processed through the original payment method whenever reasonably possible.</p>
          <p>
            The time required for the refund to appear in your account may vary depending on the payment provider, bank, card issuer, mobile
            financial service, or other payment platform.
          </p>
          <p>
            Any applicable delivery, return, payment processing, or other charges will be handled according to the circumstances of the order and the
            applicable terms communicated to the customer.
          </p>
        </>
      ),
    },
    {
      title: "12. Replacement",
      body: (
        <>
          <p>Where appropriate, Global Shelf BD may offer a replacement instead of a refund. Replacement is subject to:</p>
          <ul>
            <li>Product availability</li>
            <li>Verification of the return claim</li>
            <li>Product category</li>
            <li>Condition of the returned product</li>
          </ul>
          <p>If the same product is unavailable, we may discuss an alternative solution with the customer.</p>
        </>
      ),
    },
    {
      title: "13. Order Cancellation",
      body: (
        <>
          <p>If you wish to cancel an order, please contact us as soon as possible.</p>
          <p>Cancellation requests may not be accepted once an order has already been processed, dispatched, or handed over to the delivery service.</p>
          <p>If an order is successfully cancelled before dispatch, any applicable refund will be processed according to the payment method and circumstances of the order.</p>
        </>
      ),
    },
    {
      title: "14. Important Note for Imported Products",
      body: (
        <>
          <p>Many of our products may be sourced internationally and may have specific storage, handling, usage, and expiry requirements.</p>
          <p>
            Customers are advised to carefully read the product label, ingredients, instructions, warnings, allergy information, storage
            requirements, and other manufacturer-provided information before using or consuming any product.
          </p>
          <p>
            Global Shelf BD is not responsible for problems arising from improper storage, misuse, alteration, or failure to follow the
            manufacturer&apos;s instructions after delivery.
          </p>
        </>
      ),
    },
    {
      title: "15. Our Commitment",
      body: (
        <>
          <p>At Global Shelf BD, we are committed to providing authentic products, reliable service, and a transparent shopping experience.</p>
          <p>If something goes wrong with your order, please contact us. Our team will review the matter fairly and work to provide an appropriate solution in accordance with this policy.</p>
          <p>Your trust matters to us.</p>
        </>
      ),
    },
  ];
}

export default async function RefundPolicyPage() {
  const { settings } = await fetchSite();
  const sections = buildSections();

  return (
    <LegalPageLayout
      title="Refund / Return Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>
            At Global Shelf BD, customer satisfaction and trust are at the heart of everything we do. We make every effort to ensure that the
            products you receive are authentic, properly packed, and in good condition.
          </p>
          <p>However, if you receive a damaged, defective, incorrect, or otherwise eligible product, we are here to help.</p>
          <p>Please read the following policy carefully before placing your order.</p>
        </>
      }
      sections={sections}
      footer={
        <>
          <p className="text-sm text-slate-600 mb-4">
            When contacting us about a return, replacement, or refund, please include your order number, name, contact number, and details of the
            issue.
          </p>
          <ContactDetailsBlock settings={settings} />
        </>
      }
    />
  );
}
