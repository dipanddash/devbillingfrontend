import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import type { SparkDatum } from "./types";

interface InvoiceSummaryCardsProps {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  totalInvoices: number;
  sparkData: SparkDatum[];
}

const InvoiceSummaryCards = ({
  totalRevenue,
  pendingAmount,
  overdueAmount,
  totalInvoices,
  sparkData,
}: InvoiceSummaryCardsProps) => {
  const cards = [
    { title: "Total Revenue", value: totalRevenue, color: "text-violet-700" },
    { title: "Pending Amount", value: pendingAmount, color: "text-amber-600" },
    { title: "Overdue", value: overdueAmount, color: "text-rose-600" },
    { title: "Total Invoices", value: totalInvoices, color: "text-violet-700" },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_4px_16px_rgba(20,10,50,0.06)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-400">
            {card.title}
          </p>
          <h3 className={`mt-2 text-2xl font-bold ${card.color}`}>
            {card.title === "Total Invoices"
              ? card.value
              : `Rs.${Number(card.value).toLocaleString()}`}
          </h3>
          <div className="mt-3 h-[42px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill={`url(#spark-${i})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ))}
    </section>
  );
};

export default InvoiceSummaryCards;
