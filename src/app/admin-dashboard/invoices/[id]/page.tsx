import InvoiceDetails from "@/components/Dashboard/pages/InvoiceDetails";

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const [{ id }, { print }] = await Promise.all([params, searchParams]);
  return <InvoiceDetails invoiceId={decodeURIComponent(id)} autoPrint={print === "1"} />;
}
