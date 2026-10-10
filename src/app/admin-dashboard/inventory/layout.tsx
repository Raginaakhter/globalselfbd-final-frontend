import InventoryShell from "@/components/Dashboard/pages/inventory/InventoryShell";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <InventoryShell>{children}</InventoryShell>;
}
