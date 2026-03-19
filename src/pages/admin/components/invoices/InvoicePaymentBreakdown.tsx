import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { PAYMENT_COLORS } from "./constants";
import type { PaymentDatum } from "./types";

interface InvoicePaymentBreakdownProps {
  paymentData: PaymentDatum[];
}

const InvoicePaymentBreakdown = ({ paymentData }: InvoicePaymentBreakdownProps) => (
  <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_4px_16px_rgba(20,10,50,0.06)] lg:col-span-2">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-foreground">Payment Method Breakdown</h3>
    </div>
    <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={paymentData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              dataKey="value"
              paddingAngle={4}
            >
              {paymentData.map((entry, index) => (
                <Cell key={entry.name} fill={PAYMENT_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {paymentData.map((p, i) => (
          <div
            key={p.name}
            className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50/45 px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: PAYMENT_COLORS[i] }}
              />
              <span className="text-sm font-medium">{p.name}</span>
            </div>
            <span className="text-sm font-semibold">{p.value}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default InvoicePaymentBreakdown;
