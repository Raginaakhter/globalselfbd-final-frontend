import type { Metadata } from "next";
import { fetchSite } from "@/lib/site-fetch";
import LegalPageLayout, { type LegalSection } from "@/components/legal/LegalPageLayout";
import ContactDetailsBlock from "@/components/legal/ContactDetailsBlock";

export const metadata: Metadata = {
  title: "Privacy Policy | Global Shelf BD",
  description: "How Global Shelf BD collects, uses and protects your personal information.",
};

const LAST_UPDATED = "September 22, 2026";

function buildSections(): LegalSection[] {
  return [
    {
      title: "1. Who We Are",
      body: (
        <>
          <p>Global Shelf BD is a Bangladesh-based Importer, Retailer, and Online Shopping Platform.</p>
          <p>Our website may offer products sourced from Bangladesh and international markets.</p>
        </>
      ),
    },
    {
      title: "2. Information We Collect",
      body: (
        <>
          <p>Depending on how you interact with us, we may collect information such as:</p>
          <p><strong>Personal Information</strong></p>
          <ul>
            <li>Full name</li>
            <li>Delivery address</li>
            <li>Billing address</li>
            <li>Mobile/telephone number</li>
            <li>Email address</li>
            <li>Account information</li>
            <li>Order history</li>
            <li>Communication history</li>
          </ul>
          <p><strong>Transaction Information</strong></p>
          <p>We may collect information relating to:</p>
          <ul>
            <li>Products ordered</li>
            <li>Order value</li>
            <li>Delivery information</li>
            <li>Payment status</li>
            <li>Refund information</li>
            <li>Transaction reference numbers</li>
          </ul>
          <p>Where payment is processed through a third-party payment gateway, we generally do not need to receive or store your complete card number or banking credentials.</p>
          <p><strong>Technical Information</strong></p>
          <p>When you use our website, certain technical information may be collected automatically, such as:</p>
          <ul>
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device type</li>
            <li>Operating system</li>
            <li>Website pages visited</li>
            <li>Approximate usage information</li>
            <li>Date and time of website activity</li>
          </ul>
        </>
      ),
    },
    {
      title: "3. How We Use Your Information",
      body: (
        <>
          <p>We may use your information to:</p>
          <ul>
            <li>Process and confirm orders.</li>
            <li>Deliver products.</li>
            <li>Process payments.</li>
            <li>Provide customer support.</li>
            <li>Process returns, replacements, and refunds.</li>
            <li>Communicate order updates.</li>
            <li>Respond to questions and complaints.</li>
            <li>Improve our website and services.</li>
            <li>Prevent fraud and unauthorized activity.</li>
            <li>Maintain business and transaction records.</li>
            <li>Comply with applicable legal and regulatory requirements.</li>
            <li>Send promotional communications where permitted and where applicable.</li>
          </ul>
        </>
      ),
    },
    {
      title: "4. Marketing Communications",
      body: (
        <>
          <p>If you provide consent or where otherwise permitted by applicable law, we may contact you about:</p>
          <ul>
            <li>New products</li>
            <li>Special offers</li>
            <li>Discounts</li>
            <li>Promotions</li>
            <li>New collections</li>
            <li>Company updates</li>
          </ul>
          <p>You may request to stop receiving marketing communications by using the unsubscribe option where provided or by contacting us.</p>
          <p>Transactional and service-related communications may still be sent when necessary to complete or manage your orders.</p>
        </>
      ),
    },
    {
      title: "5. Cookies",
      body: (
        <>
          <p>Our website may use cookies and similar technologies. Cookies may help us:</p>
          <ul>
            <li>Remember preferences.</li>
            <li>Keep you signed in.</li>
            <li>Maintain shopping-cart functionality.</li>
            <li>Understand website usage.</li>
            <li>Improve website performance.</li>
            <li>Provide relevant marketing or analytics.</li>
          </ul>
          <p>You can manage or disable cookies through your browser settings. However, disabling certain cookies may affect website functionality.</p>
        </>
      ),
    },
    {
      title: "6. How We Share Information",
      body: (
        <>
          <p>We do not sell your personal information as a business asset.</p>
          <p>We may share necessary information with trusted third parties where required to provide our services, including:</p>
          <ul>
            <li>Courier and delivery companies</li>
            <li>Payment service providers</li>
            <li>IT and hosting providers</li>
            <li>Website service providers</li>
            <li>Customer support providers</li>
            <li>Marketing or analytics service providers</li>
            <li>Professional advisers</li>
            <li>Government authorities or regulators where legally required</li>
          </ul>
          <p>We only aim to share information that is reasonably necessary for the relevant purpose.</p>
        </>
      ),
    },
    {
      title: "7. Payment Information",
      body: (
        <>
          <p>Online payments may be processed by third-party payment service providers. Your payment information may therefore be subject to the privacy policies and security practices of those providers.</p>
          <p>
            Global Shelf BD does not intentionally request customers to provide complete card PINs, passwords, OTPs, or other highly sensitive
            authentication information through ordinary customer-support channels.
          </p>
          <p><strong>Never share your OTP, card PIN, internet banking password, or account password with anyone claiming to represent Global Shelf BD.</strong></p>
        </>
      ),
    },
    {
      title: "8. Data Security",
      body: (
        <>
          <p>We take reasonable technical and organizational measures to protect personal information from unauthorized access, misuse, loss, alteration, or disclosure.</p>
          <p>However, no online system can be guaranteed to be completely secure. Customers should also take reasonable steps to protect their account credentials and devices.</p>
        </>
      ),
    },
    {
      title: "9. Data Retention",
      body: (
        <>
          <p>We may retain personal information for as long as reasonably necessary for:</p>
          <ul>
            <li>Providing our services</li>
            <li>Maintaining transaction records</li>
            <li>Customer support</li>
            <li>Accounting and financial purposes</li>
            <li>Legal and regulatory compliance</li>
            <li>Fraud prevention</li>
            <li>Resolving disputes</li>
          </ul>
          <p>When information is no longer reasonably required, we may delete, anonymize, or securely dispose of it, subject to applicable legal requirements.</p>
        </>
      ),
    },
    {
      title: "10. Children's Privacy",
      body: (
        <>
          <p>Our website may sell baby and children&apos;s products, but our online services are intended to be used by adults.</p>
          <p>We do not knowingly seek to collect personal information directly from children for independent account creation or marketing purposes.</p>
          <p>Parents or legal guardians may contact us if they believe a child has provided personal information to us.</p>
        </>
      ),
    },
    {
      title: "11. Third-Party Websites",
      body: (
        <>
          <p>Our website may contain links to third-party websites, brands, payment providers, social media platforms, or other services.</p>
          <p>We are not responsible for the privacy practices of third-party websites.</p>
          <p>We encourage users to review the privacy policies of those third parties before providing personal information.</p>
        </>
      ),
    },
    {
      title: "12. Social Media",
      body: (
        <p>
          We may operate social media pages and use social media tools for communication and marketing. Interactions with our social media pages
          may also be subject to the privacy policies of the relevant social media platforms.
        </p>
      ),
    },
    {
      title: "13. Your Privacy Choices and Rights",
      body: (
        <>
          <p>Subject to applicable law, you may have rights regarding your personal information, including the ability to:</p>
          <ul>
            <li>Request information about personal data we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion where legally applicable.</li>
            <li>Withdraw consent where processing is based on consent.</li>
            <li>Object to certain uses of your information where applicable.</li>
            <li>Request assistance regarding your personal data.</li>
          </ul>
          <p>To exercise a privacy-related request, contact us using the details below. We may need to verify your identity before processing certain requests.</p>
          <p>You can also view and update your name and profile picture directly from your <a href="/profile">profile page</a> at any time.</p>
        </>
      ),
    },
    {
      title: "14. Data Breaches and Security Incidents",
      body: (
        <p>
          If we become aware of a security incident involving personal information, we will take reasonable steps to investigate, contain, and
          address the incident and provide notifications where required by applicable law.
        </p>
      ),
    },
    {
      title: "15. International Data Transfers",
      body: (
        <p>
          Because Global Shelf BD works with international suppliers, service providers, technology platforms, and business partners, certain
          information may be processed or stored outside Bangladesh where necessary for providing our services. Where applicable, we will take
          reasonable steps to ensure that such processing is conducted in accordance with applicable legal requirements and appropriate safeguards.
        </p>
      ),
    },
    {
      title: "16. Changes to This Privacy Policy",
      body: (
        <>
          <p>We may update this Privacy Policy from time to time due to:</p>
          <ul>
            <li>Changes in our services</li>
            <li>Changes in technology</li>
            <li>Changes in data-processing practices</li>
            <li>Changes in applicable laws or regulations</li>
          </ul>
          <p>The updated policy will be published on our website with a revised effective date.</p>
        </>
      ),
    },
  ];
}

export default async function PrivacyPolicyPage() {
  const { settings } = await fetchSite();
  const sections = buildSections();

  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>
            At Global Shelf BD, we respect your privacy and are committed to protecting the personal information you provide when you visit our
            website, create an account, place an order, contact us, or use our services.
          </p>
          <p>
            This Privacy Policy explains what information we may collect, why we collect it, how we use it, when we may share it, and the choices
            available to you.
          </p>
          <p>
            This policy should be read together with our <a href="/terms">Terms of Service</a>, <a href="/refund-policy">Refund / Return Policy</a>,
            and <a href="/shipping-policy">Shipping &amp; Delivery Policy</a>.
          </p>
        </>
      }
      sections={sections}
      footer={
        <>
          <p className="text-sm text-slate-600 mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us. We will
            make reasonable efforts to respond to privacy-related requests within an appropriate period.
          </p>
          <ContactDetailsBlock settings={settings} />
        </>
      }
    />
  );
}
