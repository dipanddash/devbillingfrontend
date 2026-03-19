import { useEffect, useMemo, useState } from "react";

import CancelInvoiceModal from "./components/invoices/CancelInvoiceModal";
import { FALLBACK_INVOICES, PAGE_SIZE, RECEIPT_HEADER } from "./components/invoices/constants";
import {
  buildFallbackInvoiceDetail,
  buildInvoiceExportRows,
  buildInvoiceExportSuffix,
  buildInvoiceTotals,
  filterInvoices,
  mapOrderListToInvoiceRows,
  parseInvoiceDetailResponse,
} from "./components/invoices/invoice-data";
import {
  downloadInvoiceDetailExcel,
  downloadInvoiceDetailPdf,
  exportInvoicesExcel,
  exportInvoicesPdf,
} from "./components/invoices/invoice-export";
import InvoiceFilterControls from "./components/invoices/InvoiceFilterControls";
import InvoicesHeader from "./components/invoices/InvoicesHeader";
import InvoicePaymentBreakdown from "./components/invoices/InvoicePaymentBreakdown";
import InvoicePreviewModal from "./components/invoices/InvoicePreviewModal";
import InvoiceSummaryCards from "./components/invoices/InvoiceSummaryCards";
import InvoiceTable from "./components/invoices/InvoiceTable";
import type { InvoiceDetail, InvoiceRow, InvoiceStatusFilter } from "./components/invoices/types";

const API_BASE = import.meta.env.VITE_API_BASE;

const Invoices = () => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>(FALLBACK_INVOICES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loadingInvoicePk, setLoadingInvoicePk] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
  const [cancelTargetInvoice, setCancelTargetInvoice] = useState<InvoiceRow | null>(null);
  const [cancelRequestingPk, setCancelRequestingPk] = useState<string | null>(null);
  const [cancelErrorText, setCancelErrorText] = useState("");
  const [page, setPage] = useState(1);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const headers = getAuthHeaders();
        let list: Array<Record<string, unknown>> = [];

        // Prefer full list endpoint if available.
        const listRes = await fetch(`${API_BASE}/api/orders/list/`, { headers });
        if (listRes.ok) {
          const listRaw = await listRes.json();
          list = Array.isArray(listRaw)
            ? (listRaw as Array<Record<string, unknown>>)
            : [];
        } else {
          // Fallback: pull all paginated pages from recent endpoint.
          let nextUrl: string | null = `${API_BASE}/api/orders/recent/`;
          while (nextUrl) {
            const res = await fetch(nextUrl, { headers });
            if (!res.ok) break;

            const raw = await res.json();
            if (Array.isArray(raw)) {
              list = [...list, ...(raw as Array<Record<string, unknown>>)];
              nextUrl = null;
            } else {
              const pageResults = Array.isArray(raw?.results)
                ? (raw.results as Array<Record<string, unknown>>)
                : [];
              list = [...list, ...pageResults];
              nextUrl = typeof raw?.next === "string" ? raw.next : null;
            }
          }
        }

        const mapped: InvoiceRow[] = mapOrderListToInvoiceRows(list);

        if (mapped.length > 0) setInvoices(mapped);
      } catch (error) {
        console.error("Failed to load invoices:", error);
      }
    };

    void loadInvoices();
  }, []);

  const onViewInvoice = async (invoice: InvoiceRow) => {
    const fallbackDetail: InvoiceDetail = buildFallbackInvoiceDetail(invoice);

    if (!invoice.orderPk) {
      setSelectedInvoice(fallbackDetail);
      setIsInvoiceModalOpen(true);
      return;
    }

    setLoadingInvoicePk(invoice.orderPk);
    setLoadingInvoiceId(invoice.id);
    try {
      const res = await fetch(`${API_BASE}/api/orders/invoice/${invoice.orderPk}/`, { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(String(err?.error ?? err?.detail ?? "Invoice not available for this order yet."));
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
        const blob = await res.blob();
        const fileUrl = URL.createObjectURL(blob);
        window.open(fileUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(fileUrl), 3000);
        return;
      }

      const data = await res.json();
      const parsed = parseInvoiceDetailResponse(data);
      if (!parsed) return;
      setSelectedInvoice(parsed);
      setIsInvoiceModalOpen(true);
    } catch (error) {
      console.error("Failed to open invoice:", error);
      alert(error instanceof Error ? error.message : "Failed to open invoice.");
    } finally {
      setLoadingInvoicePk(null);
      setLoadingInvoiceId(null);
    }
  };

  const openCancelOrderModal = (invoice: InvoiceRow) => {
    if (!invoice.orderPk || invoice.status === "cancelled") return;
    setCancelErrorText("");
    setCancelTargetInvoice(invoice);
  };

  const closeCancelOrderModal = () => {
    if (cancelRequestingPk) return;
    setCancelErrorText("");
    setCancelTargetInvoice(null);
  };

  const confirmCancelOrder = async () => {
    if (!cancelTargetInvoice?.orderPk || cancelTargetInvoice.status === "cancelled") return;
    const invoice = cancelTargetInvoice;

    try {
      setCancelRequestingPk(invoice.orderPk);
      setCancelErrorText("");
      const res = await fetch(`${API_BASE}/api/orders/cancel/${invoice.orderPk}/`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(String(err?.error ?? err?.detail ?? `Cancel failed with status ${res.status}`));
      }

      setInvoices((prev) =>
        prev.map((row) =>
          row.orderPk === invoice.orderPk
            ? { ...row, status: "cancelled" }
            : row
        )
      );
      setCancelTargetInvoice(null);
    } catch (error) {
      console.error("Failed to cancel order:", error);
      setCancelErrorText(error instanceof Error ? error.message : "Failed to cancel order.");
    } finally {
      setCancelRequestingPk(null);
    }
  };

  const filtered = useMemo(
    () =>
      filterInvoices(invoices, {
        search,
        statusFilter,
        from: filterFrom,
        to: filterTo,
      }),
    [invoices, search, statusFilter, filterFrom, filterTo]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, filterFrom, filterTo, invoices]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedInvoices = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const {
    totalRevenue,
    pendingAmount,
    overdueAmount,
    totalInvoices,
  } = useMemo(() => buildInvoiceTotals(invoices), [invoices]);

  const sparkData = [
    { value: 400 },
    { value: 600 },
    { value: 500 },
    { value: 800 },
    { value: 700 },
    { value: 900 },
  ];

  const paymentData = [
    { name: "Cash", value: 35 },
    { name: "Card", value: 45 },
    { name: "UPI", value: 20 },
  ];

  const exportRows = useMemo(
    () => buildInvoiceExportRows(filtered, { from: exportFrom, to: exportTo }),
    [filtered, exportFrom, exportTo]
  );
  const exportSuffix = useMemo(
    () => buildInvoiceExportSuffix(exportFrom, exportTo),
    [exportFrom, exportTo]
  );

  const handleExportExcel = () => {
    exportInvoicesExcel(exportRows, exportSuffix);
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    exportInvoicesPdf(exportRows, exportSuffix);
    setShowExportMenu(false);
  };

  const handleDownloadInvoicePdf = async () => {
    if (!selectedInvoice) return;
    await downloadInvoiceDetailPdf(selectedInvoice, RECEIPT_HEADER);
  };

  const handleDownloadInvoiceExcel = () => {
    if (!selectedInvoice) return;
    downloadInvoiceDetailExcel(selectedInvoice);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <InvoicesHeader
        exportFrom={exportFrom}
        exportTo={exportTo}
        showExportMenu={showExportMenu}
        onExportFromChange={setExportFrom}
        onExportToChange={setExportTo}
        onToggleExportMenu={() => setShowExportMenu((prev) => !prev)}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />

      <InvoiceSummaryCards
        totalRevenue={totalRevenue}
        pendingAmount={pendingAmount}
        overdueAmount={overdueAmount}
        totalInvoices={totalInvoices}
        sparkData={sparkData}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InvoicePaymentBreakdown paymentData={paymentData} />
        <InvoiceFilterControls
          search={search}
          filterFrom={filterFrom}
          filterTo={filterTo}
          exportFrom={exportFrom}
          exportTo={exportTo}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onFilterFromChange={setFilterFrom}
          onFilterToChange={setFilterTo}
          onExportFromChange={setExportFrom}
          onExportToChange={setExportTo}
          onStatusFilterChange={setStatusFilter}
        />
      </section>

      <InvoiceTable
        invoices={pagedInvoices}
        filteredCount={filtered.length}
        pageStart={pageStart}
        currentPage={currentPage}
        totalPages={totalPages}
        loadingInvoicePk={loadingInvoicePk}
        loadingInvoiceId={loadingInvoiceId}
        cancelRequestingPk={cancelRequestingPk}
        onViewInvoice={(invoice) => {
          void onViewInvoice(invoice);
        }}
        onCancelInvoice={openCancelOrderModal}
        onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
      />

      {cancelTargetInvoice && (
        <CancelInvoiceModal
          invoice={cancelTargetInvoice}
          cancelErrorText={cancelErrorText}
          cancelRequestingPk={cancelRequestingPk}
          onClose={closeCancelOrderModal}
          onConfirm={() => {
            void confirmCancelOrder();
          }}
        />
      )}

      {isInvoiceModalOpen && selectedInvoice && (
        <InvoicePreviewModal
          selectedInvoice={selectedInvoice}
          receiptHeader={RECEIPT_HEADER}
          onDownloadPdf={() => {
            void handleDownloadInvoicePdf();
          }}
          onDownloadExcel={handleDownloadInvoiceExcel}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default Invoices;








