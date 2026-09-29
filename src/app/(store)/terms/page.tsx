import type { Metadata } from "next";
import { fetchSite } from "@/lib/site-fetch";
import LegalPageLayout, { type LegalSection } from "@/components/legal/LegalPageLayout";
import ContactDetailsBlock from "@/components/legal/ContactDetailsBlock";

export const metadata: Metadata = {
  title: "Terms of Service | Global Shelf BD",
  description: "The terms and conditions that govern your use of the Global Shelf BD website and services.",
};

const LAST_UPDATED = "September 22, 2026";

function buildSections(): LegalSection[] {
  return [
    {
      title: "1. About Global Shelf BD",
      body: (
        <>
          <p>Global Shelf BD operates as an Importer, Retailer, and Online Shopping Platform.</p>
          <p>We source and trade products from Bangladesh and international markets and may offer products including:</p>
          <ul>
            <li>Baby &amp; Kids Products</li>
            <li>Food &amp; Snacks</li>
            <li>Organic &amp; Healthy Products</li>
            <li>Beauty &amp; Personal Care</li>
            <li>Lifestyle Products</li>
            <li>Household Products</li>
            <li>Other consumer goods</li>
          </ul>
          <p>Our product categories may change from time to time.</p>
        </>
      ),
    },
    {
      title: "2. Eligibility",
      body: (
        <>
          <p>By using this website, you confirm that:</p>
          <ul>
            <li>The information you provide is accurate and complete.</li>
            <li>You have the legal capacity to enter into a purchase agreement.</li>
            <li>You will use the website lawfully.</li>
            <li>You will not use the website for fraudulent, abusive, or unlawful activities.</li>
          </ul>
          <p>If you are placing an order on behalf of a business or another person, you confirm that you have the authority to do so.</p>
        </>
      ),
    },
    {
      title: "3. Product Information",
      body: (
        <>
          <p>We make reasonable efforts to ensure that product information displayed on our website is accurate. Product information may include:</p>
          <ul>
            <li>Product name</li>
            <li>Brand</li>
            <li>Description</li>
            <li>Images</li>
            <li>Ingredients</li>
            <li>Size</li>
            <li>Weight</li>
            <li>Country of origin</li>
            <li>Manufacturing information</li>
            <li>Expiry information</li>
            <li>Storage instructions</li>
            <li>Price</li>
            <li>Availability</li>
          </ul>
          <p>However, packaging, labels, colors, and product presentation may change from time to time due to manufacturer updates. Customers should always review the actual product packaging and manufacturer&apos;s instructions before consuming or using a product.</p>
        </>
      ),
    },
    {
      title: "4. Product Authenticity",
      body: (
        <>
          <p>Global Shelf BD is committed to offering authentic and genuine products sourced from trusted suppliers, brands, distributors, and manufacturers.</p>
          <p>Where appropriate, we may maintain relevant purchase, import, supplier, or product documentation to support product authenticity. We do not knowingly sell counterfeit products.</p>
        </>
      ),
    },
    {
      title: "5. Product Availability",
      body: (
        <>
          <p>All products are subject to availability. If a product becomes unavailable after an order is placed, we may:</p>
          <ul>
            <li>Contact the customer regarding an alternative;</li>
            <li>Adjust the order;</li>
            <li>Cancel the unavailable item; or</li>
            <li>Provide an applicable refund.</li>
          </ul>
        </>
      ),
    },
    {
      title: "6. Prices",
      body: (
        <p>
          Product prices displayed on our website are subject to change without prior notice. The applicable price for an order will generally be the
          price displayed at the time the order is confirmed, subject to correction of obvious errors. Delivery charges and other applicable charges
          may be added separately.
        </p>
      ),
    },
    {
      title: "7. Pricing Errors",
      body: (
        <>
          <p>Although we take reasonable care to ensure accurate pricing, occasional errors may occur.</p>
          <p>
            If a significant pricing error is identified before an order is dispatched, Global Shelf BD may contact the customer to confirm whether
            they wish to proceed at the correct price. If the customer does not wish to proceed, the order may be cancelled and any applicable payment
            refunded.
          </p>
        </>
      ),
    },
    {
      title: "8. Placing an Order",
      body: (
        <p>
          When you place an order through our website, you are submitting a request to purchase the selected products. An order is not necessarily
          considered finally accepted until Global Shelf BD confirms the order. We may contact the customer for confirmation, verification, or
          clarification before dispatch.
        </p>
      ),
    },
    {
      title: "9. Order Cancellation",
      body: (
        <>
          <p>Global Shelf BD may cancel an order where:</p>
          <ul>
            <li>The product is unavailable.</li>
            <li>The product information or price contains a material error.</li>
            <li>Payment cannot be verified.</li>
            <li>Fraudulent or suspicious activity is detected.</li>
            <li>The delivery location is outside our service area.</li>
            <li>The customer has provided incorrect or incomplete information.</li>
            <li>There are circumstances preventing us from fulfilling the order.</li>
          </ul>
          <p>Customers may request cancellation before dispatch, subject to our applicable cancellation policy.</p>
        </>
      ),
    },
    {
      title: "10. Payment",
      body: (
        <>
          <p>We may provide different payment methods, including:</p>
          <ul>
            <li>Cash on Delivery</li>
            <li>Mobile Financial Services</li>
            <li>Debit/Credit Cards</li>
            <li>Internet Banking</li>
            <li>Other payment methods available on the website</li>
          </ul>
          <p>Payment services may be provided by third-party payment providers. Customers are responsible for providing accurate payment information.</p>
        </>
      ),
    },
    {
      title: "11. Delivery",
      body: (
        <p>
          Delivery is governed by our <a href="/shipping-policy">Shipping &amp; Delivery Policy</a>. Estimated delivery times are provided for
          guidance and may vary due to location, product availability, customs, transportation, or circumstances beyond our reasonable control.
        </p>
      ),
    },
    {
      title: "12. Returns, Refunds & Replacements",
      body: (
        <p>
          Returns, refunds, replacements, and cancellations are governed by our <a href="/refund-policy">Refund / Return Policy</a>. Customers should
          review that policy before placing an order.
        </p>
      ),
    },
    {
      title: "13. Food, Baby Food, Cosmetics & Personal Care",
      body: (
        <>
          <p>Customers are responsible for reviewing:</p>
          <ul>
            <li>Ingredients</li>
            <li>Allergens</li>
            <li>Nutritional information</li>
            <li>Age suitability</li>
            <li>Storage requirements</li>
            <li>Usage instructions</li>
            <li>Warnings</li>
            <li>Expiry dates</li>
          </ul>
          <p>before consuming or using a product. Global Shelf BD does not provide medical advice.</p>
          <p>
            If you have allergies, dietary restrictions, medical conditions, or other health-related concerns, please consult an appropriately
            qualified professional before consuming a product.
          </p>
        </>
      ),
    },
    {
      title: "14. Imported Products",
      body: (
        <>
          <p>
            Imported products may be subject to applicable Bangladesh customs, regulatory, labeling, testing, certification, and other legal
            requirements.
          </p>
          <p>Global Shelf BD will undertake applicable import procedures for products it imports and distributes.</p>
          <p>
            Product availability may be affected by import regulations, customs clearance, government requirements, or changes in international
            supply.
          </p>
        </>
      ),
    },
    {
      title: "15. Intellectual Property",
      body: (
        <>
          <p>All content on this website, including:</p>
          <ul>
            <li>Logo</li>
            <li>Brand name</li>
            <li>Text</li>
            <li>Graphics</li>
            <li>Images</li>
            <li>Product descriptions</li>
            <li>Website design</li>
            <li>Layout</li>
            <li>Icons</li>
            <li>Videos</li>
            <li>Other materials</li>
          </ul>
          <p>is owned by or licensed to Global Shelf BD or its relevant rights holders, unless otherwise stated.</p>
          <p>You may not reproduce, copy, modify, distribute, sell, or commercially exploit our website content without prior written permission.</p>
        </>
      ),
    },
    {
      title: "16. User Accounts",
      body: (
        <>
          <p>If you create an account, you are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your login information.</li>
            <li>Providing accurate information.</li>
            <li>Updating your information when necessary.</li>
            <li>Not allowing unauthorized persons to use your account.</li>
          </ul>
          <p>You should immediately notify us if you believe your account has been compromised.</p>
        </>
      ),
    },
    {
      title: "17. Prohibited Activities",
      body: (
        <>
          <p>Users must not:</p>
          <ul>
            <li>Use the website for unlawful purposes.</li>
            <li>Attempt to gain unauthorized access.</li>
            <li>Introduce malicious software.</li>
            <li>Interfere with website operations.</li>
            <li>Copy or scrape website content without permission.</li>
            <li>Submit fraudulent orders.</li>
            <li>Provide false information.</li>
            <li>Abuse promotions or discounts.</li>
            <li>Attempt payment fraud.</li>
            <li>Misuse customer support services.</li>
          </ul>
        </>
      ),
    },
    {
      title: "18. Third-Party Services",
      body: (
        <>
          <p>Our website may use third-party services including:</p>
          <ul>
            <li>Payment gateways</li>
            <li>Courier and delivery companies</li>
            <li>Hosting providers</li>
            <li>Analytics services</li>
            <li>Marketing platforms</li>
            <li>Communication services</li>
          </ul>
          <p>These third parties may have their own terms and privacy policies.</p>
        </>
      ),
    },
    {
      title: "19. Website Availability",
      body: (
        <>
          <p>We aim to keep our website available and functioning properly. However, temporary interruption may occur because of:</p>
          <ul>
            <li>Maintenance</li>
            <li>Technical problems</li>
            <li>Server issues</li>
            <li>Cybersecurity incidents</li>
            <li>Internet disruptions</li>
            <li>Third-party service interruptions</li>
            <li>Other unforeseen circumstances</li>
          </ul>
        </>
      ),
    },
    {
      title: "20. Limitation of Liability",
      body: (
        <p>
          To the extent permitted by applicable law, Global Shelf BD will not be responsible for losses arising from circumstances beyond our
          reasonable control. Nothing in these Terms &amp; Conditions is intended to exclude or limit any legal right or consumer protection that
          cannot lawfully be excluded or limited.
        </p>
      ),
    },
    {
      title: "21. Changes to These Terms",
      body: (
        <>
          <p>We may update these Terms &amp; Conditions from time to time to reflect:</p>
          <ul>
            <li>Changes in our business</li>
            <li>New products or services</li>
            <li>Changes in technology</li>
            <li>Changes in applicable laws or regulations</li>
            <li>Changes in operational procedures</li>
          </ul>
          <p>Updated terms will be posted on this website with the revised effective date.</p>
        </>
      ),
    },
    {
      title: "22. Governing Law",
      body: (
        <p>
          These Terms &amp; Conditions shall be interpreted in accordance with the applicable laws of Bangladesh. Any dispute will be addressed in
          accordance with applicable Bangladesh law and the appropriate legal or regulatory process.
        </p>
      ),
    },
  ];
}

export default async function TermsOfServicePage() {
  const { settings } = await fetchSite();
  const sections = buildSections();

  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>Welcome to Global Shelf BD.</p>
          <p>
            These Terms &amp; Conditions govern your use of the Global Shelf BD website, online shopping services, products, and related services.
          </p>
          <p>
            By accessing our website, creating an account, placing an order, or using our services, you acknowledge that you have read, understood,
            and agreed to these Terms &amp; Conditions.
          </p>
          <p>If you do not agree with these terms, please do not use our website or services.</p>
        </>
      }
      sections={sections}
      footer={<ContactDetailsBlock settings={settings} />}
    />
  );
}
