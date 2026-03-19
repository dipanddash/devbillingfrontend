import { AlertTriangle, BarChart3, Package, TrendingDown } from "lucide-react";

import { Card } from "./InventoryAtoms";

interface InventorySummaryCardsSectionProps {
  itemsCount: number;
  lowCount: number;
  outCount: number;
  totalValuation: number;
}

const InventorySummaryCardsSection = ({
  itemsCount,
  lowCount,
  outCount,
  totalValuation,
}: InventorySummaryCardsSectionProps) => (
  <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Card title="Total Items" value={itemsCount} icon={<Package className="h-5 w-5 text-violet-600" />} />
    <Card title="Low Stock" value={lowCount} icon={<AlertTriangle className="h-5 w-5 text-fuchsia-500" />} />
    <Card title="Out of Stock" value={outCount} icon={<TrendingDown className="h-5 w-5 text-rose-500" />} />
    <Card title="Valuation" value={`Rs.${totalValuation.toFixed(2)}`} icon={<BarChart3 className="h-5 w-5 text-violet-600" />} />
  </section>
);

export default InventorySummaryCardsSection;
