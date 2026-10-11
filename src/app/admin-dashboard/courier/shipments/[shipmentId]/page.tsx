import CourierShipmentDetailPage from "@/components/Dashboard/pages/courier/ShipmentDetailPage";

export default async function Page({ params }: { params: Promise<{ shipmentId: string }> }) {
  const { shipmentId } = await params;
  return <CourierShipmentDetailPage shipmentId={shipmentId} />;
}
