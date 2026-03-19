import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { getLogoDataUrl } from "./helpers";
import type { InvoiceDetail, InvoiceExportRow, ReceiptHeader } from "./types";

export const exportInvoicesExcel = (rows: InvoiceExportRow[], suffix: string) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
  XLSX.writeFile(workbook, `invoices-${suffix}.xlsx`);
};

export const exportInvoicesPdf = (rows: InvoiceExportRow[], suffix: string) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Invoices Report", 14, 14);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);

  autoTable(doc, {
    startY: 26,
    head: [["Invoice", "Customer", "Date", "Due Date", "Amount", "Status"]],
    body: rows.map((row) => [
      row.Invoice,
      row.Customer,
      row.Date,
      row.DueDate,
      `Rs.${Number(row.Amount).toLocaleString()}`,
      row.Status,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [124, 58, 237] },
  });

  doc.save(`invoices-${suffix}.pdf`);
};

export const downloadInvoiceDetailPdf = async (
  selectedInvoice: InvoiceDetail,
  receiptHeader: ReceiptHeader
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightX = pageWidth - margin;
  const centerX = pageWidth / 2;
  let y = 12;
  const logoDataUrl = await getLogoDataUrl();

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", centerX - 9, y, 18, 18);
    y += 22;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(receiptHeader.legalName, centerX, y, { align: "center" });
  y += 6;
  doc.setFontSize(11);
  doc.text(receiptHeader.branchName, centerX, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const addressLines = doc.splitTextToSize(receiptHeader.address, pageWidth - margin * 2);
  doc.text(addressLines, centerX, y, { align: "center" });
  y += addressLines.length * 4.5;
  doc.text(`Phone: ${receiptHeader.phone}`, centerX, y, { align: "center" });
  y += 5;
  doc.text(`CIN: ${receiptHeader.cin}`, centerX, y, { align: "center" });
  y += 5;
  doc.text(`GSTIN: ${receiptHeader.gstin}`, centerX, y, { align: "center" });
  y += 5;
  doc.text(`FSSAI: ${receiptHeader.fssai}`, centerX, y, { align: "center" });
  y += 8;

  doc.setDrawColor(180);
  doc.line(margin, y, rightX, y);
  y += 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", centerX, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Bill No: ${selectedInvoice.bill_number}`, margin, y);
  doc.text(`Bill Dt: ${selectedInvoice.date}`, rightX, y, { align: "right" });
  y += 6;
  doc.text(`Customer: ${selectedInvoice.customer_name || "-"}`, margin, y);
  doc.text(`Cashier: ${selectedInvoice.staff || "-"}`, rightX, y, { align: "right" });
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Item", "Qty", "Price", "GST %", "Total"]],
    body: selectedInvoice.line_items.flatMap((lineItem) => {
      const baseRow = [[
        lineItem.name,
        String(lineItem.quantity),
        Number(lineItem.base_price || 0).toFixed(2),
        Number(lineItem.gst_percent || 0).toFixed(2),
        Number(lineItem.line_total || 0).toFixed(2),
      ]];
      const addonRows = (lineItem.addons || []).map((addon) => [
        `  + ${addon.name} x${Number(addon.quantity_per_item ?? addon.quantity_total ?? 0)} @ ${Number(addon.unit_price || 0).toFixed(2)}`,
        "",
        "",
        "",
        Number(addon.line_total || 0).toFixed(2),
      ]);
      return [...baseRow, ...addonRows];
    }),
    styles: { fontSize: 9, cellPadding: 2.2 },
    headStyles: { fillColor: [33, 33, 33] },
    columnStyles: {
      0: { cellWidth: 88 },
      1: { halign: "right", cellWidth: 18 },
      2: { halign: "right", cellWidth: 24 },
      3: { halign: "right", cellWidth: 20 },
      4: { halign: "right", cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });

  const tableEndY =
    (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y;
  let summaryY = tableEndY + 8;
  const manualDiscount = Number(
    selectedInvoice.manual_discount ??
      selectedInvoice.discount_breakdown?.manual_discount ??
      0
  );
  const couponDiscount = Number(
    selectedInvoice.coupon_discount ??
      selectedInvoice.discount_breakdown?.coupon_discount ??
      0
  );
  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal: Rs.${selectedInvoice.subtotal.toLocaleString()}`, rightX, summaryY, { align: "right" });
  summaryY += 6;
  doc.text(`Total GST: Rs.${selectedInvoice.total_gst.toLocaleString()}`, rightX, summaryY, { align: "right" });
  summaryY += 6;
  doc.text(`Manual Discount: Rs.${manualDiscount.toLocaleString()}`, rightX, summaryY, { align: "right" });
  summaryY += 6;
  doc.text(`Coupon Discount: Rs.${couponDiscount.toLocaleString()}`, rightX, summaryY, { align: "right" });
  summaryY += 6;
  doc.text(`Total Discount: Rs.${selectedInvoice.discount.toLocaleString()}`, rightX, summaryY, { align: "right" });
  summaryY += 7;
  doc.setFontSize(12);
  doc.text(`Final Amount: Rs.${selectedInvoice.final_amount.toLocaleString()}`, rightX, summaryY, { align: "right" });
  summaryY += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Thank you. Visit again.", centerX, summaryY, { align: "center" });

  const safeBill = String(selectedInvoice.bill_number || "detail").replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`invoice-${safeBill}.pdf`);
};

export const downloadInvoiceDetailExcel = (selectedInvoice: InvoiceDetail) => {
  const itemsSheet = selectedInvoice.line_items.flatMap((lineItem) => {
    const baseRow = [{
      Item: lineItem.name,
      Quantity: lineItem.quantity,
      Price: lineItem.base_price,
      GSTPercent: lineItem.gst_percent,
      GSTAmount: lineItem.gst_amount,
      LineTotal: lineItem.line_total,
    }];
    const addonRows = (lineItem.addons || []).map((addon) => ({
      Item: `+ ${addon.name}`,
      Quantity: Number(addon.quantity_total ?? addon.quantity_per_item ?? 0),
      Price: Number(addon.unit_price || 0),
      GSTPercent: "",
      GSTAmount: "",
      LineTotal: Number(addon.line_total || 0),
    }));
    return [...baseRow, ...addonRows];
  });

  const summarySheet = [
    { Field: "Bill Number", Value: selectedInvoice.bill_number },
    { Field: "Date", Value: selectedInvoice.date },
    { Field: "Customer", Value: selectedInvoice.customer_name },
    { Field: "Order Type", Value: selectedInvoice.order_type },
    { Field: "Staff", Value: selectedInvoice.staff },
    { Field: "Payment Method", Value: selectedInvoice.payment_method },
    { Field: "Payment Status", Value: selectedInvoice.payment_status },
    { Field: "Subtotal", Value: selectedInvoice.subtotal },
    { Field: "Total GST", Value: selectedInvoice.total_gst },
    {
      Field: "Manual Discount",
      Value: Number(
        selectedInvoice.manual_discount ??
          selectedInvoice.discount_breakdown?.manual_discount ??
          0
      ),
    },
    {
      Field: "Coupon Discount",
      Value: Number(
        selectedInvoice.coupon_discount ??
          selectedInvoice.discount_breakdown?.coupon_discount ??
          0
      ),
    },
    { Field: "Total Discount", Value: selectedInvoice.discount },
    { Field: "Coupon Code", Value: selectedInvoice.coupon_details?.code ?? "" },
    { Field: "Coupon Type", Value: selectedInvoice.coupon_details?.discount_type ?? "" },
    { Field: "Final Amount", Value: selectedInvoice.final_amount },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summarySheet), "Summary");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(itemsSheet), "Items");
  XLSX.writeFile(workbook, `invoice-${selectedInvoice.bill_number || "detail"}.xlsx`);
};
