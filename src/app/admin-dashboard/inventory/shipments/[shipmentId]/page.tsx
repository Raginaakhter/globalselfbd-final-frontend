import ShipmentDetailPage from "@/components/Dashboard/pages/inventory/ShipmentDetailPage";

export default async function Page({ params }: { params: Promise<{ shipmentId: string }> }) {
  const { shipmentId } = await params;
  return <ShipmentDetailPage shipmentId={shipmentId} />;
}
