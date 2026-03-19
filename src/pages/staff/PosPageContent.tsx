import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingCart, CloudOff } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PosCatalogPanel from "./components/pos/PosCatalogPanel";
import PosInvoicePreviewModal from "./components/pos/PosInvoicePreviewModal";
import PosPaymentModal from "./components/pos/PosPaymentModal";
import PosTakeawayModal from "./components/pos/PosTakeawayModal";

import { isOnline } from "@/offline/network";
import {
  cacheCategories, cacheProducts, cacheAddons, cacheCombos,
  cacheCustomers, cacheOrderDetail, cacheSnapshot,
  getCachedCategories, getCachedProducts, getCachedAddons, getCachedCombos, getCachedCustomers, getCachedOrderDetail,
} from "@/offline/cache";
import { createOfflineOrder, getOfflineOrderById, saveOfflineOrder } from "@/offline/orders";

const BASE_URL = import.meta.env.VITE_API_BASE;
const HOLD_CART_KEY = "staff_pos_hold_cart_v1";

/* ================= TYPES ================= */

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  category_name: string;
  image: string;
  gst_percent: number;
  is_available?: boolean;
  availability_reason?: string | null;
}

interface ComboItem {
  id: string;
  combo: string;
  product: string;
  product_name: string;
  quantity: number;
}

interface Combo {
  id: string;
  name: string;
  price: string;
  gst_percent: number;
  image: string;
  is_active: boolean;
  items: ComboItem[];
  is_available?: boolean;
  availability_reason?: string | null;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  image?: string;
}

interface SelectedAddon {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartItem {
  key: string;
  type: "product" | "combo";
  id: string;
  name: string;
  price: number;
  basePrice?: number;
  qty: number;
  image?: string;
  gst_percent: number;
  comboItems?: ComboItem[];
  selectedAddons?: SelectedAddon[];
}

interface OrderDetails {
  id: string;
  order_type: string;
  status?: string;
  payment_status?: string;
  customer_name: string;
  phone?: string;
  customer_phone?: string;
  table_number?: string;
  token_number?: string;
  session?: string;
  items?: OrderDetailItem[];
}

interface OrderDetailItemAddon {
  addon?: string;
  addon_name?: string;
  price_at_time: number | string;
}

interface OrderDetailItem {
  id: string;
  product?: string;
  combo?: string;
  product_name?: string;
  combo_name?: string;
  quantity: number;
  base_price: number | string;
  gst_percent: number | string;
  price_at_time: number | string;
  addons?: OrderDetailItemAddon[];
}

interface OfflineStoredOrderItem {
  product?: string;
  combo?: string;
  name: string;
  base_price?: number;
  quantity: number;
  price: number;
  gst_percent: number;
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
  }>;
}

interface PendingSelection {
  type: "product" | "combo";
  product?: Product;
  combo?: Combo;
  selectedAddons?: SelectedAddon[];
  mode?: "add" | "edit";
  editingCartKey?: string;
}

interface InvoiceLineItem {
  name: string;
  quantity: number;
  base_price: number;
  line_total: number;
  addons?: InvoiceLineItemAddon[];
}

interface InvoiceLineItemAddon {
  name: string;
  quantity_per_item?: number;
  quantity_total?: number;
  unit_price?: number;
  line_total?: number;
}

interface InvoiceCouponDetails {
  code?: string;
  discount_type?: "AMOUNT" | "PERCENT" | string;
  value?: number | string;
  discount_amount?: number | string;
  free_item?: string;
  free_item_category?: string;
}

interface InvoiceData {
  bill_number: string;
  date: string;
  customer_name: string;
  staff?: string;
  subtotal: number | string;
  total_gst: number | string;
  discount: number | string;
  manual_discount?: number | string;
  coupon_discount?: number | string;
  discount_type?: string;
  coupon_details?: InvoiceCouponDetails | null;
  discount_breakdown?: {
    manual_discount?: number | string;
    coupon_discount?: number | string;
    total_discount?: number | string;
  };
  final_amount: number | string;
  line_items?: InvoiceLineItem[];
  items?: InvoiceLineItem[];
}

interface AppliedCoupon {
  id: number;
  code: string;
  discount_type: "AMOUNT" | "PERCENT" | "FREE_ITEM";
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  free_item?: string;
  free_item_category?: string;
}

interface CustomerLookupRow {
  id: string;
  name: string;
  phone: string;
}

/* ================= COMPONENT ================= */

export default function SalesTransactionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");
  const quickStartOrderType = (searchParams.get("new_order") || "").toUpperCase();
  const sessionIdParam = searchParams.get("session");
  const tableNumberParam = searchParams.get("table_number");
  const tokenNumberParam = searchParams.get("token_number");
  const customerNameParam = searchParams.get("customer_name");
  const token = localStorage.getItem("access");

  /* ================= STATE ================= */

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [expandedAddonRows, setExpandedAddonRows] = useState<Record<string, boolean>>({});
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [runtimeOrderId, setRuntimeOrderId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [creatingTakeaway, setCreatingTakeaway] = useState(false);
  const [posNotice, setPosNotice] = useState("");
  const [showTakeawayModal, setShowTakeawayModal] = useState(false);
  const [takeawayCustomerName, setTakeawayCustomerName] = useState("");
  const [takeawayPhone, setTakeawayPhone] = useState("");
  const [takeawayError, setTakeawayError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [customerMatches, setCustomerMatches] = useState<CustomerLookupRow[]>([]);
  const [takeawayLookupDone, setTakeawayLookupDone] = useState(false);
  const [takeawayRequiresName, setTakeawayRequiresName] = useState(false);
  const [hasHeldCart, setHasHeldCart] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [pendingQty, setPendingQty] = useState("1");
  const [pendingQtyError, setPendingQtyError] = useState("");
  const [pendingAddonSearch, setPendingAddonSearch] = useState("");
  const [showAllAddonsModal, setShowAllAddonsModal] = useState(false);
  const [pendingAddonEditorId, setPendingAddonEditorId] = useState<string | null>(null);
  const [pendingAddonEditorQty, setPendingAddonEditorQty] = useState("1");
  const [pendingAddonEditorError, setPendingAddonEditorError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [discountPercentInput, setDiscountPercentInput] = useState("");
  const [discountAmountInput, setDiscountAmountInput] = useState("");
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("amount");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);
  const [markingPending, setMarkingPending] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const activeKeys = new Set(cart.map((item) => item.key));
    setExpandedAddonRows((prev) => {
      const next: Record<string, boolean> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (activeKeys.has(key)) next[key] = value;
      });
      return next;
    });
  }, [cart]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);
  const pendingQtyInputRef = useRef<HTMLInputElement | null>(null);
  const queryOrderContext = useMemo<OrderDetails | null>(() => {
    if (!tableNumberParam && !tokenNumberParam && !customerNameParam) return null;
    return {
      id: "",
      order_type: "DINE_IN",
      customer_name: customerNameParam ?? "",
      table_number: tableNumberParam ?? "",
      token_number: tokenNumberParam ?? "",
      session: sessionIdParam ?? "",
    };
  }, [customerNameParam, sessionIdParam, tableNumberParam, tokenNumberParam]);
  const effectiveOrderId = runtimeOrderId ?? orderId;
  const hasBillingContext = Boolean(effectiveOrderId || queryOrderContext);
  const isDineInContext = (orderDetails?.order_type ?? queryOrderContext?.order_type) === "DINE_IN";
  // Track if the current order was created offline (needs offline payment path)
  const [isOfflineOrder, setIsOfflineOrder] = useState(false);
  const [offlineCustomerName, setOfflineCustomerName] = useState("");
  const [offlineCustomerPhone, setOfflineCustomerPhone] = useState("");

  const openNewPosBilling = () => {
    window.open("/staff/pos", "_blank", "noopener,noreferrer");
  };

  const isEditableTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === "input" || tag === "textarea" || el.isContentEditable;
  };

  const getContextError = () =>
    "Select Dine In or Take Away first. Products are locked until billing starts.";

  const getApiErrorMessage = (err: unknown, fallback: string): string => {
    if (Array.isArray(err)) {
      return err.length > 0 ? String(err[0]) : fallback;
    }
    if (err && typeof err === "object") {
      const obj = err as Record<string, unknown>;
      const detail = obj["detail"];
      if (Array.isArray(detail) && detail.length > 0) return String(detail[0]);
      return String(obj["detail"] ?? obj["error"] ?? obj["message"] ?? obj["raw"] ?? fallback);
    }
    return fallback;
  };

  const isLikelyNetworkError = (error: unknown): boolean => {
    if (!error) return false;
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "";
    return /failed to fetch|network|offline|load failed|connection|timeout/i.test(message);
  };

  const isBackendUnavailableError = (error: unknown): boolean => {
    if (!error) return false;
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "";
    return /database unavailable|db_offline|service unavailable|neon unreachable|http 503|status 503/i.test(message);
  };

  const isOrderLockedFailure = (error: unknown): boolean => {
    if (!error) return false;
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "";
    return /order_locked|already paid|cannot modify items for paid\/completed\/cancelled order/i.test(message);
  };

  const isOrderLocked = (details: OrderDetails | null | undefined): boolean => {
    if (!details) return false;
    const paymentStatus = String(details.payment_status ?? "").toUpperCase();
    const status = String(details.status ?? "").toUpperCase();
    return paymentStatus === "PAID" || status === "COMPLETED" || status === "CANCELLED";
  };

  const getCreatedOrderId = (value: unknown): string => {
    if (!value || typeof value !== "object") return "";
    const obj = value as Record<string, unknown>;
    const nestedOrder = obj["order"];
    const nestedOrderId =
      nestedOrder && typeof nestedOrder === "object"
        ? (nestedOrder as Record<string, unknown>)["id"]
        : undefined;
    return String(obj["id"] ?? obj["order_id"] ?? nestedOrderId ?? "");
  };

  const mapExistingOrderItemsToCart = (items: OrderDetailItem[]): CartItem[] => {
    const mappedByKey: Record<string, CartItem> = {};

    items.forEach((item) => {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const gstPercent = Number(item.gst_percent || 0);

      if (item.combo) {
        const comboId = String(item.combo);
        const key = `combo:${comboId}`;
        const unitPrice = Number(item.price_at_time || item.base_price || 0);
        const existing = mappedByKey[key];
        if (existing) {
          existing.qty += quantity;
        } else {
          mappedByKey[key] = {
            key,
            type: "combo",
            id: comboId,
            name: item.combo_name || "Combo",
            price: unitPrice,
            qty: quantity,
            gst_percent: gstPercent,
          };
        }
        return;
      }

      if (!item.product) return;

      const addonRows = Array.isArray(item.addons) ? item.addons : [];
      const addonMap: Record<string, SelectedAddon> = {};
      addonRows.forEach((addonRow) => {
        if (!addonRow?.addon) return;
        const addonId = String(addonRow.addon);
        const existing = addonMap[addonId];
        if (existing) {
          existing.qty += 1;
        } else {
          addonMap[addonId] = {
            id: addonId,
            name: addonRow.addon_name || "Addon",
            price: Number(addonRow.price_at_time || 0),
            qty: 1,
          };
        }
      });

      const selectedAddons = Object.values(addonMap).sort((a, b) => a.name.localeCompare(b.name));
      const addonKey = selectedAddons.map((addon) => `${addon.id}:${addon.qty}`).join(",");
      const productId = String(item.product);
      const basePrice = Number(item.base_price || 0);
      const unitAddonPrice = selectedAddons.reduce((sum, addon) => sum + addon.price * addon.qty, 0);
      const unitPrice = basePrice + unitAddonPrice;
      const key = `product:${productId}:${addonKey}`;
      const existing = mappedByKey[key];
      if (existing) {
        existing.qty += quantity;
      } else {
        mappedByKey[key] = {
          key,
          type: "product",
          id: productId,
          name: item.product_name || "Product",
          price: unitPrice,
          basePrice,
          qty: quantity,
          gst_percent: gstPercent,
          selectedAddons,
        };
      }
    });

    return Object.values(mappedByKey);
  };

  const mapOfflineOrderItemsToCart = (items: OfflineStoredOrderItem[]): CartItem[] => {
    return items.map((item, index) => ({
      key: `${item.product ?? item.combo ?? item.name}-${index}`,
      type: item.combo ? "combo" : "product",
      id: String(item.product ?? item.combo ?? ""),
      name: item.name,
      price: Number(item.price || 0),
      basePrice:
        item.base_price != null
          ? Number(item.base_price || 0)
          : Math.max(
              0,
              Number(item.price || 0) -
                (item.addons ?? []).reduce(
                  (sum, addon) => sum + Number(addon.price || 0) * Math.max(1, Number(addon.qty || 1)),
                  0,
                ),
            ),
      qty: Math.max(1, Number(item.quantity || 1)),
      gst_percent: Number(item.gst_percent || 0),
      selectedAddons: (item.addons ?? []).map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: Number(addon.price || 0),
        qty: Math.max(1, Number(addon.qty || 1)),
      })),
    }));
  };

  const startTakeawayFromPos = async () => {
    if (creatingTakeaway) return;
    const customerName = takeawayCustomerName.trim();
    const customerPhoneRaw = takeawayPhone.trim();
    const customerPhoneDigits = takeawayPhone.replace(/\D/g, "").slice(-10).trim();
    if (!customerPhoneRaw) {
      setTakeawayError("Enter mobile number.");
      return;
    }
    if (customerPhoneDigits.length !== 10) {
      setTakeawayError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!customerName && takeawayLookupDone && takeawayRequiresName) {
      setTakeawayError("Enter customer name.");
      return;
    }

    if (!customerName) {
      setLookupLoading(true);
      try {
        const localMatches = (await getCachedCustomers())
          .filter((row) => String(row?.phone ?? "").replace(/\D/g, "").endsWith(customerPhoneDigits))
          .slice(0, 8)
          .map((row) => ({
            id: String(row.id ?? ""),
            name: String(row.name ?? ""),
            phone: String(row.phone ?? ""),
          }));

        let matches = [...localMatches];
        if (token && isOnline()) {
          try {
            const res = await fetch(
              `${BASE_URL}/api/orders/customer-lookup/?phone=${encodeURIComponent(customerPhoneDigits)}&limit=8`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.ok) {
              const serverRows = (await res.json()) as Array<Record<string, unknown>>;
              const mapped = serverRows.map((row) => ({
                id: String(row.id ?? ""),
                name: String(row.name ?? ""),
                phone: String(row.phone ?? ""),
              }));
              const dedup = new Map<string, CustomerLookupRow>();
              [...mapped, ...localMatches].forEach((row) => {
                const key = `${row.phone}|${row.name}`.toLowerCase();
                if (!dedup.has(key)) dedup.set(key, row);
              });
              matches = Array.from(dedup.values()).slice(0, 8);
              if (mapped.length > 0) {
                await cacheCustomers(mapped);
              }
            }
          } catch {
            // Continue with local matches only.
          }
        }

        setCustomerMatches(matches);
        setTakeawayLookupDone(true);
        if (matches.length > 0) {
          const first = matches[0];
          setTakeawayCustomerName(first.name || "");
          setTakeawayRequiresName(false);
          setTakeawayError(
            matches.length === 1
              ? "Customer found. Press Continue to start order."
              : "Select customer (or edit name), then Continue.",
          );
          return;
        }

        setTakeawayRequiresName(true);
        setTakeawayError("Customer not found. Enter customer name and continue.");
        return;
      } finally {
        setLookupLoading(false);
      }
    }

    try {
      setCreatingTakeaway(true);
      setTakeawayError("");

      // If offline, create a local placeholder order
      if (!isOnline()) {
        const localId = crypto.randomUUID();
        setRuntimeOrderId(localId);
        setIsOfflineOrder(true);
        setOfflineCustomerName(customerName);
        setOfflineCustomerPhone(customerPhoneDigits);
        setPosNotice("");
        setShowTakeawayModal(false);
        setTakeawayCustomerName("");
        setTakeawayPhone("");
        setCustomerMatches([]);
        setTakeawayLookupDone(false);
        setTakeawayRequiresName(false);
        setTakeawayError("");
        navigate(`/staff/pos?order=${encodeURIComponent(localId)}`, { replace: true });
        return;
      }

      if (!token) {
        setTakeawayError("Session expired. Please login again.");
        return;
      }

      const payloadVariants = [
        { order_type: "TAKEAWAY", customer_name: customerName, customer_phone: customerPhoneRaw },
        { order_type: "TAKEAWAY", customer_name: customerName, customer_phone: customerPhoneDigits },
        { order_type: "TAKE_AWAY", customer_name: customerName, customer_phone: customerPhoneRaw },
        { order_type: "TAKE_AWAY", customer_name: customerName, customer_phone: customerPhoneDigits },
        { order_type: "TAKEAWAY", customer_name: customerName, phone: customerPhoneRaw },
        { order_type: "TAKEAWAY", customer_name: customerName, phone: customerPhoneDigits },
      ];

      let lastError = "Unable to create takeaway order.";
      let data: Record<string, unknown> | null = null;
      for (const payload of payloadVariants) {
        const res = await fetch(`${BASE_URL}/api/orders/create/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          data = await res.json();
          break;
        }

        const err: unknown = await res.json().catch(() => ({}));
        lastError = getApiErrorMessage(err, `Take Away failed (HTTP ${res.status}).`);
      }

      if (!data) throw new Error(lastError);
      const createdId = getCreatedOrderId(data);
      if (!createdId) throw new Error("Takeaway order created but id missing.");
      setRuntimeOrderId(createdId);
      setPosNotice("");
      setShowTakeawayModal(false);
      setTakeawayCustomerName("");
      setTakeawayPhone("");
      setCustomerMatches([]);
      setTakeawayLookupDone(false);
      setTakeawayRequiresName(false);
      setTakeawayError("");
      navigate(`/staff/pos?order=${encodeURIComponent(createdId)}`, { replace: true });
    } catch (error) {
      console.error(error);
      // Network error fallback to offline
      if (!isOnline() || isLikelyNetworkError(error) || isBackendUnavailableError(error)) {
        const localId = crypto.randomUUID();
        setRuntimeOrderId(localId);
        setIsOfflineOrder(true);
        setOfflineCustomerName(customerName);
        setOfflineCustomerPhone(customerPhoneDigits);
        setPosNotice("");
        setShowTakeawayModal(false);
        setTakeawayCustomerName("");
        setTakeawayPhone("");
        setCustomerMatches([]);
        setTakeawayLookupDone(false);
        setTakeawayRequiresName(false);
        setTakeawayError("");
        navigate(`/staff/pos?order=${encodeURIComponent(localId)}`, { replace: true });
        return;
      }
      setTakeawayError(error instanceof Error ? error.message : "Could not start Take Away billing.");
    } finally {
      setCreatingTakeaway(false);
    }
  };

  const startPartnerOrderFromPos = async (partner: "SWIGGY" | "ZOMATO") => {
    if (!token || creatingTakeaway) return;
    try {
      setCreatingTakeaway(true);
      setPosNotice("");
      const payloadVariants = [
        { order_type: partner, customer_name: partner },
        { order_type: partner, customer_name: partner, customer_phone: "" },
        { order_type: "TAKEAWAY", customer_name: partner },
      ];

      let data: Record<string, unknown> | null = null;
      let lastError = `Unable to start ${partner} order.`;
      for (const payload of payloadVariants) {
        const res = await fetch(`${BASE_URL}/api/orders/create/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          data = await res.json();
          break;
        }

        const err: unknown = await res.json().catch(() => ({}));
        lastError = getApiErrorMessage(err, `${partner} failed (HTTP ${res.status}).`);
      }

      if (!data) throw new Error(lastError);
      const createdId = getCreatedOrderId(data);
      if (!createdId) throw new Error(`${partner} order created but id missing.`);

      setRuntimeOrderId(createdId);
      navigate(`/staff/pos?order=${encodeURIComponent(createdId)}`, { replace: true });
    } catch (error) {
      console.error(error);
      setPosNotice(error instanceof Error ? error.message : `Could not start ${partner} order.`);
    } finally {
      setCreatingTakeaway(false);
    }
  };

  const selectCustomerMatch = (customer: CustomerLookupRow) => {
    setTakeawayCustomerName(customer.name || takeawayCustomerName);
    setTakeawayPhone(customer.phone || takeawayPhone);
    setCustomerMatches([]);
    setTakeawayLookupDone(true);
    setTakeawayRequiresName(false);
    setTakeawayError("");
  };

  useEffect(() => {
    if (!showTakeawayModal) return;
    const digits = takeawayPhone.replace(/\D/g, "");
    if (digits.length < 4) {
      setCustomerMatches([]);
      setLookupLoading(false);
      setTakeawayLookupDone(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLookupLoading(true);
      try {
        const cachedCustomers = await getCachedCustomers();
        const normalized = digits.slice(-10);
        const localMatches = (Array.isArray(cachedCustomers) ? cachedCustomers : [])
          .filter((row) => String(row?.phone ?? "").replace(/\D/g, "").includes(normalized))
          .slice(0, 8)
          .map((row) => ({
            id: String(row.id ?? ""),
            name: String(row.name ?? ""),
            phone: String(row.phone ?? ""),
          }));

        let merged = [...localMatches];
        if (token && isOnline()) {
          try {
            const res = await fetch(
              `${BASE_URL}/api/orders/customer-lookup/?phone=${encodeURIComponent(digits)}&limit=8`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.ok) {
              const serverMatches = (await res.json()) as Array<Record<string, unknown>>;
              const mappedServer = (Array.isArray(serverMatches) ? serverMatches : []).map((row) => ({
                id: String(row.id ?? ""),
                name: String(row.name ?? ""),
                phone: String(row.phone ?? ""),
              }));

              const dedup = new Map<string, CustomerLookupRow>();
              [...mappedServer, ...localMatches].forEach((row) => {
                const key = `${row.phone}|${row.name}`.toLowerCase();
                if (!dedup.has(key)) dedup.set(key, row);
              });
              merged = Array.from(dedup.values()).slice(0, 8);
              if (mappedServer.length > 0) {
                await cacheCustomers(mappedServer);
              }
            }
          } catch {
            // continue with local cached matches only
          }
        }

        if (!cancelled) {
          setCustomerMatches(merged);
        }
      } finally {
        if (!cancelled) setLookupLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [takeawayPhone, showTakeawayModal, token]);

  useEffect(() => {
    if (showTakeawayModal) return;
    setLookupLoading(false);
    setCustomerMatches([]);
    setTakeawayLookupDone(false);
    setTakeawayRequiresName(false);
  }, [showTakeawayModal]);

  /* ================= LOAD PRODUCTS (with offline cache) ================= */

  // Map raw server/cache data to typed objects
  const mapProduct = (product: Record<string, unknown>): Product => ({
    id: String(product.id ?? ""),
    name: String(product.name ?? ""),
    price: String(product.price ?? "0"),
    category_name: String(product.category_name ?? ""),
    image: String(product.image_url ?? product.image ?? ""),
    gst_percent: Number(product.gst_percent ?? 0),
    is_available: Boolean(product.is_available ?? true),
    availability_reason: product.availability_reason ? String(product.availability_reason) : null,
  });

  const mapCombo = (combo: Record<string, unknown>): Combo => ({
    id: String(combo.id ?? ""),
    name: String(combo.name ?? ""),
    price: String(combo.price ?? "0"),
    gst_percent: Number(combo.gst_percent ?? 0),
    image: String(combo.image_url ?? combo.image ?? ""),
    is_active: Boolean(combo.is_active),
    is_available: Boolean(combo.is_available ?? true),
    availability_reason: combo.availability_reason ? String(combo.availability_reason) : null,
    items: Array.isArray(combo.items)
      ? combo.items.map((item: Record<string, unknown>) => ({
          id: String(item.id ?? ""),
          combo: String(item.combo ?? combo.id ?? ""),
          product: String(item.product ?? ""),
          product_name: String(item.product_name ?? ""),
          quantity: Number(item.quantity ?? 0),
        }))
      : [],
  });

  const mapAddon = (addon: Record<string, unknown>): Addon => ({
    id: String(addon.id ?? ""),
    name: String(addon.name ?? ""),
    price: Number(addon.price ?? 0),
    image: String(addon.image_url ?? addon.image ?? ""),
  });

  // Load from server with offline cache fallback
  const loadFromServerOrCache = async () => {
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Prefer consolidated snapshot to avoid fragmented product/recipe/tax fetches.
      const snapshotRes = await fetch(`${BASE_URL}/api/sync/snapshot/`, { headers });
      if (snapshotRes.ok) {
        const snapshotData = await snapshotRes.json();
        const catData = Array.isArray(snapshotData?.categories) ? snapshotData.categories : [];
        const prodData = Array.isArray(snapshotData?.products) ? snapshotData.products : [];
        const comboData = Array.isArray(snapshotData?.combos) ? snapshotData.combos : [];
        const addonData = Array.isArray(snapshotData?.addons) ? snapshotData.addons : [];

        setCategories([{ id: "all", name: "All" }, ...catData]);
        setProducts(prodData.map(mapProduct));
        setCombos(comboData.map(mapCombo));
        setAddons(addonData.map(mapAddon));
        cacheSnapshot(snapshotData).catch(() => {});
        return;
      }

      // Fallback to legacy split APIs when snapshot endpoint is unavailable.
      const [catRes, prodRes, comboRes, addonRes] = await Promise.all([
        fetch(`${BASE_URL}/api/products/categories/`, { headers }),
        fetch(`${BASE_URL}/api/products/products/`, { headers }),
        fetch(`${BASE_URL}/api/products/combos/`, { headers }),
        fetch(`${BASE_URL}/api/products/addons/`, { headers }),
      ]);

      const catData = await catRes.json();
      const prodData = await prodRes.json();
      const comboData = await comboRes.json();
      const addonData = await addonRes.json();

      setCategories([{ id: "all", name: "All" }, ...catData]);
      setProducts((Array.isArray(prodData) ? prodData : []).map(mapProduct));
      setCombos((Array.isArray(comboData) ? comboData : []).map(mapCombo));
      setAddons((Array.isArray(addonData) ? addonData : []).map(mapAddon));

      // Cache for offline use (non-blocking)
      cacheCategories(catData).catch(() => {});
      cacheProducts(prodData).catch(() => {});
      cacheCombos(comboData).catch(() => {});
      cacheAddons(addonData).catch(() => {});
    } catch {
      // Network failed — load from offline cache
      console.log("[POS] Loading from offline cache...");
      try {
        const [cats, prods, combosData, addonsData] = await Promise.all([
          getCachedCategories(),
          getCachedProducts(),
          getCachedCombos(),
          getCachedAddons(),
        ]);

        if (cats.length > 0) setCategories([{ id: "all", name: "All" }, ...cats]);
        if (prods.length > 0) setProducts(prods.map(mapProduct));
        if (combosData.length > 0) setCombos(combosData.map(mapCombo));
        if (addonsData.length > 0) setAddons(addonsData.map(mapAddon));
      } catch (cacheErr) {
        console.error("[POS] Offline cache load failed:", cacheErr);
      }
    }
  };

  useEffect(() => {
    if (!token) return;
    loadFromServerOrCache();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setHasHeldCart(Boolean(sessionStorage.getItem(HOLD_CART_KEY)));
  }, []);

  useEffect(() => {
    if (!quickStartOrderType || !token) return;
    if (quickStartOrderType === "TAKEAWAY") {
      setPosNotice("");
      setTakeawayError("");
      setTakeawayCustomerName("");
      setTakeawayPhone("");
      setCustomerMatches([]);
      setTakeawayLookupDone(false);
      setTakeawayRequiresName(false);
      setShowTakeawayModal(true);
      navigate("/staff/pos", { replace: true });
      return;
    }
    if (quickStartOrderType === "SWIGGY" || quickStartOrderType === "ZOMATO") {
      void startPartnerOrderFromPos(quickStartOrderType as "SWIGGY" | "ZOMATO");
      navigate("/staff/pos", { replace: true });
    }
  }, [quickStartOrderType, token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ================= LOAD ORDER DETAILS ================= */

  useEffect(() => {
    if (!effectiveOrderId || !token) return;

    let isCancelled = false;

    const loadOrder = async () => {
      const offlineOrder = await getOfflineOrderById(effectiveOrderId);
      if (!isCancelled && offlineOrder && String(offlineOrder.sync_status ?? "").toLowerCase() !== "synced") {
        setIsOfflineOrder(true);
        setOfflineCustomerName(String(offlineOrder.customer_name ?? ""));
        setOfflineCustomerPhone(String(offlineOrder.customer_phone ?? ""));
        setOrderDetails({
          id: effectiveOrderId,
          order_type: String(offlineOrder.order_type ?? "TAKEAWAY"),
          customer_name: String(offlineOrder.customer_name ?? ""),
          customer_phone: String(offlineOrder.customer_phone ?? ""),
        } as OrderDetails);
        setCart(
          mapOfflineOrderItemsToCart(
            Array.isArray(offlineOrder.items) ? (offlineOrder.items as OfflineStoredOrderItem[]) : [],
          ),
        );
        return;
      }

      if (!isCancelled && isOfflineOrder) {
        setOrderDetails({
          id: effectiveOrderId,
          order_type: "TAKEAWAY",
          customer_name: offlineCustomerName,
          customer_phone: offlineCustomerPhone,
        } as OrderDetails);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/orders/${effectiveOrderId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Order fetch failed (${response.status})`);
      }
      const data = await response.json();
      if (isCancelled) return;
      console.log("ORDER DETAILS:", data);
      setIsOfflineOrder(false);
      setOrderDetails(data as OrderDetails);
      await cacheOrderDetail(data);
      const existingItems = Array.isArray((data as OrderDetails).items)
        ? ((data as OrderDetails).items as OrderDetailItem[])
        : [];
      setCart(mapExistingOrderItemsToCart(existingItems));
    };

    void loadOrder().catch(async (err) => {
      console.error(err);
      const cachedDetail = await getCachedOrderDetail(effectiveOrderId);
      if (!cachedDetail) return;
      if (isCancelled) return;
      setIsOfflineOrder(false);
      setOrderDetails(cachedDetail as OrderDetails);
      const existingItems = Array.isArray((cachedDetail as OrderDetails).items)
        ? ((cachedDetail as OrderDetails).items as OrderDetailItem[])
        : [];
      setCart(mapExistingOrderItemsToCart(existingItems));
      setPosNotice("Loaded cached order data while offline. Sync when connection returns.");
    });
    return () => {
      isCancelled = true;
    };
  }, [effectiveOrderId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ================= FILTER ================= */

  const filteredProducts = products.filter(p =>
    (activeCategory === "All" || p.category_name === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const searchSuggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 8);
  }, [products, search]);

  const showSearchDropdown = isSearchFocused && searchSuggestions.length > 0;

  const filteredCombos = combos.filter((c) =>
    activeCategory === "Combo" && c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPendingAddons = useMemo(() => {
    const term = pendingAddonSearch.trim().toLowerCase();
    if (!term) return addons;
    return addons.filter((addon) => addon.name.toLowerCase().includes(term));
  }, [addons, pendingAddonSearch]);
  const previewPendingAddons = useMemo(() => filteredPendingAddons.slice(0, 4), [filteredPendingAddons]);

  const pendingSelectedAddons = useMemo(
    () => (pendingSelection?.type === "product" ? pendingSelection.selectedAddons ?? [] : []),
    [pendingSelection]
  );

  const pendingAddonUnitTotal = useMemo(
    () => pendingSelectedAddons.reduce((sum, addon) => sum + addon.price * addon.qty, 0),
    [pendingSelectedAddons]
  );

  const pendingProductUnitPrice = useMemo(() => {
    if (pendingSelection?.type !== "product" || !pendingSelection.product) return 0;
    return Number(pendingSelection.product.price || 0) + pendingAddonUnitTotal;
  }, [pendingAddonUnitTotal, pendingSelection]);
  const isEditingPendingSelection = pendingSelection?.mode === "edit";

  /* ================= CART ================= */

  const buildProductCartItem = (p: Product, qty = 1, selectedAddonRows: SelectedAddon[] = []) => {
    const selectedAddons = selectedAddonRows
      .filter((addon) => addon.qty > 0)
      .map((addon) => ({
        ...addon,
        qty: Math.max(1, Math.floor(addon.qty)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const addonKey = selectedAddons.map((addon) => `${addon.id}:${addon.qty}`).join(",");
    const unitAddonPrice = selectedAddons.reduce((sum, addon) => sum + addon.price * addon.qty, 0);
    const unitPrice = parseFloat(p.price) + unitAddonPrice;
    return {
      key: `product:${p.id}:${addonKey}`,
      type: "product" as const,
      id: p.id,
      name: p.name,
      price: unitPrice,
      basePrice: parseFloat(p.price),
      qty,
      image: p.image,
      gst_percent: Number(p.gst_percent || 0),
      selectedAddons,
    };
  };

  const addToCart = (p: Product, qty = 1, selectedAddonRows: SelectedAddon[] = []) => {
    if (!hasBillingContext) {
      setPosNotice(getContextError());
      return;
    }
    const nextItem = buildProductCartItem(p, qty, selectedAddonRows);
    setCart(prev => {
      const ex = prev.find(i => i.key === nextItem.key);
      if (ex) {
        return prev.map(i =>
          i.key === nextItem.key ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        nextItem,
      ];
    });
  };

  const addComboToCart = (combo: Combo, qty = 1) => {
    if (!hasBillingContext) {
      setPosNotice(getContextError());
      return;
    }
    setCart((prev) => {
      const key = `combo:${combo.id}`;
      const ex = prev.find((i) => i.key === key);
      if (ex) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        {
          key,
          type: "combo",
          id: combo.id,
          name: combo.name,
          price: parseFloat(combo.price),
          qty,
          image: combo.image,
          gst_percent: Number(combo.gst_percent || 0),
          comboItems: combo.items,
        },
      ];
    });
  };

  const openQtyModalForProduct = (product: Product) => {
    if (!hasBillingContext) {
      setPosNotice(getContextError());
      return;
    }
    if (product.is_available === false) {
      if (!isOnline()) {
        setPosNotice(
          "Server stock check is unavailable. Billing will continue from local cache and sync later.",
        );
      } else {
        setPosNotice(product.availability_reason || "This item is out of stock.");
        return;
      }
    }
    setPendingSelection({ type: "product", product, selectedAddons: [], mode: "add" });
    setPendingQty("1");
    setPendingQtyError("");
    setPendingAddonSearch("");
    setShowAllAddonsModal(false);
    setPendingAddonEditorId(null);
    setPendingAddonEditorQty("1");
    setPendingAddonEditorError("");
  };

  const openQtyModalForCombo = (combo: Combo) => {
    if (!hasBillingContext) {
      setPosNotice(getContextError());
      return;
    }
    if (combo.is_available === false) {
      if (!isOnline()) {
        setPosNotice(
          "Server stock check is unavailable. Billing will continue from local cache and sync later.",
        );
      } else {
        setPosNotice(combo.availability_reason || "This combo is out of stock.");
        return;
      }
    }
    setPendingSelection({ type: "combo", combo, mode: "add" });
    setPendingQty("1");
    setPendingQtyError("");
    setPendingAddonSearch("");
    setShowAllAddonsModal(false);
    setPendingAddonEditorId(null);
    setPendingAddonEditorQty("1");
    setPendingAddonEditorError("");
  };

  const closeQtyModal = () => {
    setPendingSelection(null);
    setPendingQty("1");
    setPendingQtyError("");
    setPendingAddonSearch("");
    setShowAllAddonsModal(false);
    setPendingAddonEditorId(null);
    setPendingAddonEditorQty("1");
    setPendingAddonEditorError("");
  };

  const openQtyModalForCartItem = (item: CartItem) => {
    if (item.type !== "product") return;
    const mappedProduct =
      products.find((product) => product.id === item.id) ??
      ({
        id: item.id,
        name: item.name,
        price: String(item.basePrice ?? item.price),
        category_name: "",
        image: item.image ?? "",
        gst_percent: Number(item.gst_percent || 0),
        is_available: true,
      } as Product);
    setPendingSelection({
      type: "product",
      product: mappedProduct,
      selectedAddons: [...(item.selectedAddons ?? [])],
      mode: "edit",
      editingCartKey: item.key,
    });
    setPendingQty(String(item.qty));
    setPendingQtyError("");
    setPendingAddonSearch("");
    setShowAllAddonsModal(false);
    setPendingAddonEditorId(null);
    setPendingAddonEditorQty("1");
    setPendingAddonEditorError("");
  };

  const setPendingAddonQty = (addon: Addon, nextQty: number) => {
    const qty = Math.floor(nextQty);
    setPendingSelection((prev) => {
      if (!prev || prev.type !== "product") return prev;
      const existing = prev.selectedAddons ?? [];
      const next = [...existing];
      const idx = next.findIndex((row) => row.id === addon.id);
      if (qty <= 0) {
        return { ...prev, selectedAddons: next.filter((row) => row.id !== addon.id) };
      }
      if (idx >= 0) {
        next[idx] = { ...next[idx], qty };
      } else {
        next.push({ id: addon.id, name: addon.name, price: addon.price, qty });
      }
      return {
        ...prev,
        selectedAddons: next,
      };
    });
  };

  const openPendingAddonQtyEditor = (addon: Addon) => {
    const currentQty =
      pendingSelection?.type === "product"
        ? pendingSelection.selectedAddons?.find((row) => row.id === addon.id)?.qty
        : undefined;
    setPendingAddonEditorId(addon.id);
    setPendingAddonEditorQty(currentQty ? String(currentQty) : "1");
    setPendingAddonEditorError("");
  };

  const submitPendingAddonQtyEditor = (addon: Addon) => {
    const parsed = Math.floor(Number(pendingAddonEditorQty));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setPendingAddonEditorError("Enter a valid addon quantity.");
      return;
    }
    setPendingAddonQty(addon, parsed);
    setPendingAddonEditorId(null);
    setPendingAddonEditorQty("1");
    setPendingAddonEditorError("");
  };

  const closePendingAddonQtyEditor = () => {
    setPendingAddonEditorId(null);
    setPendingAddonEditorQty("1");
    setPendingAddonEditorError("");
  };

  const renderAddonRows = (addonList: Addon[]) => (
    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
      {addonList.map((addon) => {
        const selectedAddon = pendingSelectedAddons.find((row) => row.id === addon.id);
        const currentQty = selectedAddon?.qty ?? 0;
        const isEditingThisAddon = pendingAddonEditorId === addon.id;
        return (
          <div
            key={addon.id}
            className={`rounded-xl border bg-white p-2.5 ${
              currentQty > 0 ? "border-purple-300 shadow-sm" : "border-purple-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  addon.image ||
                  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=120&q=80"
                }
                alt={addon.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-purple-950">{addon.name}</p>
                <p className="text-xs text-purple-700">
                  Rs {addon.price.toFixed(0)}
                  {currentQty > 0 ? ` | Added x${currentQty}` : ""}
                </p>
              </div>
              {!isEditingThisAddon && (
                <button
                  type="button"
                  onClick={() => openPendingAddonQtyEditor(addon)}
                  className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-200"
                >
                  {currentQty > 0 ? "Edit Qty" : "Add"}
                </button>
              )}
            </div>

            {isEditingThisAddon && (
              <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50/60 p-2">
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    type="number"
                    min={1}
                    step={1}
                    value={pendingAddonEditorQty}
                    onChange={(e) => {
                      setPendingAddonEditorQty(e.target.value);
                      if (pendingAddonEditorError) setPendingAddonEditorError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitPendingAddonQtyEditor(addon);
                      }
                    }}
                    placeholder="Qty"
                    className="h-9 rounded-lg border-purple-200 bg-white text-sm text-purple-900"
                  />
                  <Button
                    type="button"
                    onClick={() => submitPendingAddonQtyEditor(addon)}
                    className="h-9 bg-[linear-gradient(135deg,#7c3aed_0%,#5b21b6_100%)] px-3 text-xs text-white hover:opacity-95"
                  >
                    Enter
                  </Button>
                  {currentQty > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPendingAddonQty(addon, 0);
                        closePendingAddonQtyEditor();
                      }}
                      className="h-9 border-rose-200 px-3 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Remove
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closePendingAddonQtyEditor}
                    className="h-9 border-purple-200 px-3 text-xs text-purple-700 hover:bg-purple-50"
                  >
                    Cancel
                  </Button>
                </div>
                {pendingAddonEditorError && (
                  <p className="mt-1 text-xs font-medium text-violet-700">{pendingAddonEditorError}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {addonList.length === 0 && (
        <p className="text-center text-xs text-purple-600/70">No addons found.</p>
      )}
    </div>
  );

  const confirmPendingQty = (keepOpen = false) => {
    if (!pendingSelection) return;
    const qtyNum = Number(pendingQty);
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      setPendingQtyError("Enter a valid quantity greater than 0.");
      return;
    }

    if (pendingSelection.type === "product" && pendingSelection.product) {
      if (pendingSelection.mode === "edit" && pendingSelection.editingCartKey) {
        const updatedItem = buildProductCartItem(
          pendingSelection.product,
          qtyNum,
          pendingSelection.selectedAddons ?? []
        );
        setCart((prev) => {
          const withoutEditing = prev.filter((item) => item.key !== pendingSelection.editingCartKey);
          const existingMatch = withoutEditing.find((item) => item.key === updatedItem.key);
          if (existingMatch) {
            return withoutEditing.map((item) =>
              item.key === updatedItem.key ? { ...item, qty: item.qty + updatedItem.qty } : item
            );
          }
          return [...withoutEditing, updatedItem];
        });
      } else {
        addToCart(
          pendingSelection.product,
          qtyNum,
          pendingSelection.selectedAddons ?? []
        );
      }
    } else if (pendingSelection.type === "combo" && pendingSelection.combo) {
      addComboToCart(pendingSelection.combo, qtyNum);
    }
    if (keepOpen) {
      setPendingQty("1");
      setPendingQtyError("");
      return;
    }
    closeQtyModal();
  };

  const updateQty = (key: string, diff: number) => {
    setCart(prev =>
      prev
        .map(i =>
          i.key === key ? { ...i, qty: i.qty + diff } : i
        )
        .filter(i => i.qty > 0)
    );
  };

  const setQty = (key: string, nextQty: number) => {
    if (!Number.isFinite(nextQty)) return;
    const safeQty = Math.floor(nextQty);
    setCart((prev) =>
      prev
        .map((item) => (item.key === key ? { ...item, qty: safeQty } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const resetCart = () => setCart([]);

  const holdCart = () => {
    if (cart.length === 0) {
      setPosNotice("Nothing to hold.");
      return;
    }
    sessionStorage.setItem(HOLD_CART_KEY, JSON.stringify(cart));
    setHasHeldCart(true);
    setCart([]);
    setPosNotice("Cart held. Use Resume Hold to restore it.");
  };

  const resumeHeldCart = () => {
    const raw = sessionStorage.getItem(HOLD_CART_KEY);
    if (!raw) {
      setHasHeldCart(false);
      setPosNotice("No held cart found.");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setPosNotice("Held cart is empty.");
        return;
      }
      setCart(parsed);
      setPosNotice("Held cart restored.");
    } catch {
      setPosNotice("Held cart data is invalid.");
    }
  };

  /* ================= TOTAL ================= */

  const parseNonNegative = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed;
  };

  const roundMoney = (value: number): number => Math.max(0, Math.round(value || 0));

  const rawSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const rawGst = cart.reduce((s, i) => {
    const taxableUnitPrice = i.basePrice ?? i.price;
    return s + (taxableUnitPrice * i.qty * i.gst_percent) / 100;
  }, 0);

  const subtotal = roundMoney(rawSubtotal);
  const gst = roundMoney(rawGst);
  const grossTotal = subtotal + gst;
  const rawDiscountAmount = parseNonNegative(discountAmountInput) ?? 0;
  const manualDiscountAmount = Math.min(roundMoney(rawDiscountAmount), grossTotal);
  const couponDiscountAmount = (() => {
    if (!appliedCoupon) return 0;
    if (grossTotal < Number(appliedCoupon.min_order_amount || 0)) return 0;
    const value = Number(appliedCoupon.value || 0);
    let discount =
      appliedCoupon.discount_type === "PERCENT"
        ? (grossTotal * value) / 100
        : value;
    if (appliedCoupon.max_discount_amount != null) {
      discount = Math.min(discount, Number(appliedCoupon.max_discount_amount));
    }
    return Math.max(0, Math.min(roundMoney(discount), grossTotal));
  })();
  const discountAmount = Math.min(roundMoney(manualDiscountAmount + couponDiscountAmount), grossTotal);
  const total = Math.max(0, grossTotal - discountAmount);
  const cashGivenAmount = Number(cashGiven || 0);
  const cashBalance = Number.isFinite(cashGivenAmount) ? roundMoney(cashGivenAmount - total) : 0;
  const manualDiscountDisplayValue =
    discountMode === "percent"
      ? `${Number(discountPercentInput || 0).toFixed(0)}%`
      : `Rs ${manualDiscountAmount.toFixed(0)}`;
  const couponTypeLabel = appliedCoupon
    ? appliedCoupon.discount_type === "PERCENT"
      ? `${Number(appliedCoupon.value || 0).toFixed(0)}%`
      : appliedCoupon.discount_type === "FREE_ITEM"
      ? "FREE ITEM"
      : `Rs ${Number(appliedCoupon.value || 0).toFixed(0)}`
    : "";
  const appliedFreeItemLabel =
    appliedCoupon?.discount_type === "FREE_ITEM"
      ? appliedCoupon.free_item || appliedCoupon.free_item_category || "Free Item"
      : "";

  const syncFromPercent = (rawPercent: string, baseTotal: number) => {
    const parsedPercent = parseNonNegative(rawPercent);
    if (parsedPercent === null) {
      setDiscountAmountInput("");
      return;
    }
    const clampedPercent = Math.min(parsedPercent, 100);
    const computedAmount = baseTotal > 0 ? (baseTotal * clampedPercent) / 100 : 0;
    setDiscountAmountInput(String(roundMoney(computedAmount)));
  };

  const syncFromAmount = (rawAmount: string, baseTotal: number) => {
    const parsedAmount = parseNonNegative(rawAmount);
    if (parsedAmount === null) {
      setDiscountPercentInput("");
      return;
    }
    const clampedAmount = Math.min(parsedAmount, baseTotal);
    const computedPercent = baseTotal > 0 ? (clampedAmount / baseTotal) * 100 : 0;
    setDiscountPercentInput(computedPercent.toFixed(0));
  };

  const switchDiscountMode = (mode: "percent" | "amount") => {
    setDiscountMode(mode);
    if (mode === "percent") {
      syncFromAmount(discountAmountInput, grossTotal);
      return;
    }
    syncFromPercent(discountPercentInput, grossTotal);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const applyCoupon = async () => {
    if (!token) return;
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter coupon code.");
      return;
    }
    if (grossTotal <= 0) {
      setCouponError("Add items to cart before applying coupon.");
      return;
    }
    try {
      setApplyingCoupon(true);
      setCouponError("");
      const res = await fetch(`${BASE_URL}/api/orders/coupons/validate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          order_amount: grossTotal,
          customer_phone: orderDetails?.customer_phone || orderDetails?.phone || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAppliedCoupon(null);
        setCouponError(String(data?.detail ?? data?.error ?? "Invalid coupon."));
        return;
      }
      setAppliedCoupon({
        id: Number(data.id),
        code: String(data.code ?? code),
        discount_type: String(data.discount_type ?? "PERCENT") as "AMOUNT" | "PERCENT" | "FREE_ITEM",
        value: Number(data.value ?? 0),
        min_order_amount: Number(data.min_order_amount ?? 0),
        max_discount_amount: data.max_discount_amount == null ? null : Number(data.max_discount_amount),
        free_item: String(data.free_item ?? ""),
        free_item_category: String(data.free_item_category ?? ""),
      });
      setCouponCodeInput(String(data.code ?? code));
      setCouponError("");
    } catch (err) {
      console.error("Apply coupon failed:", err);
      setAppliedCoupon(null);
      setCouponError("Could not apply coupon.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  useEffect(() => {
    if (cart.length > 0) return;
    setDiscountPercentInput("");
    setDiscountAmountInput("");
    setDiscountMode("amount");
    setCouponCodeInput("");
    setAppliedCoupon(null);
    setCouponError("");
  }, [cart.length]);

  useEffect(() => {
    if (discountMode === "percent") {
      syncFromPercent(discountPercentInput, grossTotal);
      return;
    }
    syncFromAmount(discountAmountInput, grossTotal);
  }, [grossTotal]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCartPayloadItems = () => {
    return cart.map((item) => {
      if (item.type === "combo") {
        return {
          combo: item.id,
          quantity: item.qty,
        };
      }
      return {
        product: item.id,
        quantity: item.qty,
        addons: (item.selectedAddons ?? []).map((addon) => ({
          addon: addon.id,
          quantity: addon.qty,
        })),
      };
    });
  };

  const syncCartItems = async (resolvedOrderId: string) => {
    if (isOfflineOrder) {
      throw new Error("This order is still offline and must be synced manually from Profile.");
    }
    const items = getCartPayloadItems();

    const addRes = await fetch(`${BASE_URL}/api/orders/add-items/${resolvedOrderId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items,
        ...(manualDiscountAmount > 0 ? { discount_amount: manualDiscountAmount } : {}),
        ...(appliedCoupon ? { coupon_code: appliedCoupon.code } : {}),
      }),
    });
    if (!addRes.ok) {
      const err: unknown = await addRes.json().catch(() => ({}));
      const message = getApiErrorMessage(err, "Failed to add items.");
      const errCode =
        err && typeof err === "object" ? String((err as Record<string, unknown>).code ?? "") : "";
      if (errCode.toUpperCase() === "ORDER_LOCKED") {
        throw new Error("ORDER_LOCKED");
      }
      if (errCode.toUpperCase() === "DB_OFFLINE") {
        throw new Error("DB_OFFLINE");
      }
      throw new Error(message);
    }
  };

  /* ================= SEND ================= */

  const handleSend = async () => {
    if (cart.length === 0 || !token || sending) return;

    setSending(true);
    try {
      let resolvedOrderId = effectiveOrderId;

      // Dine-in flow: create order only at send-time when order id doesn't exist yet.
      if (!resolvedOrderId) {
        if (!queryOrderContext) throw new Error("Missing order context for dine-in order creation.");
        if (!queryOrderContext.session) throw new Error("Missing session id for dine-in order creation.");

        const createRes = await fetch(`${BASE_URL}/api/orders/create/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_type: "DINE_IN",
            session: queryOrderContext.session,
          }),
        });

        if (!createRes.ok) {
          const err: unknown = await createRes.json().catch(() => ({}));
          throw new Error(getApiErrorMessage(err, "Unable to create dine-in order."));
        }

        const created = await createRes.json();
        const createdId = getCreatedOrderId(created);
        if (!createdId) throw new Error("Order created but id was not returned by API.");

        resolvedOrderId = createdId;
        setRuntimeOrderId(createdId);
        navigate(
          `/staff/pos?order=${encodeURIComponent(createdId)}&session=${encodeURIComponent(queryOrderContext.session ?? "")}&table_number=${encodeURIComponent(queryOrderContext.table_number ?? "")}&token_number=${encodeURIComponent(queryOrderContext.token_number ?? "")}&customer_name=${encodeURIComponent(queryOrderContext.customer_name ?? "")}`,
          { replace: true }
        );
      }

      await syncCartItems(resolvedOrderId);

      await fetch(`${BASE_URL}/api/orders/status/${resolvedOrderId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      window.location.href = "/staff/kitchen";
    } catch (error) {
      console.error(error);
      toast.error("Failed to send order to kitchen.");
    } finally {
      setSending(false);
    }
  };

  const openPaymentForTakeaway = () => {
    if (!effectiveOrderId) {
      setPosNotice("Start a takeaway/online order first.");
      return;
    }
    if (isOrderLocked(orderDetails)) {
      setPosNotice("Order is already settled. Opening invoice preview.");
      void loadInvoicePreview(effectiveOrderId);
      return;
    }
    if (cart.length === 0) {
      setPosNotice("Cart is empty.");
      return;
    }
    setPaymentMethod("CASH");
    setPaymentReference("");
    setCashGiven("");
    setPaymentError("");
    setShowPaymentModal(true);
  };

  const loadInvoicePreview = async (orderIdToLoad: string) => {
    if (!token) return;
    setInvoiceLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/invoice/${orderIdToLoad}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String(data?.error ?? data?.detail ?? "Failed to load invoice."));
      }
      setInvoiceData(data as InvoiceData);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const closeInvoicePreview = () => {
    setInvoiceData(null);
    setOrderDetails(null);
    setRuntimeOrderId(null);
    setCart([]);
    setPosNotice("");
    setShowPaymentModal(false);
    setPaymentError("");
    setPaymentReference("");
    setCashGiven("");
    setDiscountPercentInput("");
    setDiscountAmountInput("");
    setDiscountMode("amount");
    setCouponCodeInput("");
    setAppliedCoupon(null);
    setCouponError("");
    setPendingSelection(null);
    setPendingQty("1");
    setPendingQtyError("");
    setPendingAddonSearch("");
    setShowAllAddonsModal(false);
    setPendingAddonEditorId(null);
    setPendingAddonEditorQty("1");
    setPendingAddonEditorError("");
    window.location.replace("/staff/pos");
  };

  const confirmTakeawayPayment = async () => {
    if (!effectiveOrderId || paying) return;
    if (!token && isOnline()) {
      setPaymentError("Session expired. Please login again.");
      return;
    }
    if (isOrderLocked(orderDetails)) {
      setShowPaymentModal(false);
      setPaymentError("");
      setPosNotice("Order is already settled. Opening invoice preview.");
      await loadInvoicePreview(effectiveOrderId);
      return;
    }
    if (paymentMethod === "CARD" && !paymentReference.trim()) {
      setPaymentError("Card number/reference is required.");
      return;
    }
    if (paymentMethod === "CASH") {
      const parsed = Number(cashGiven);
      if (!Number.isFinite(parsed) || parsed < total) {
        setPaymentError("Cash given must be at least the bill amount.");
        return;
      }
    }

    // -- OFFLINE ORDER PATH --
    if (isOfflineOrder || !isOnline()) {
      try {
        setPaying(true);
        setPaymentError("");

        const offlineResult = await saveOfflineOrder({
          order_type: orderDetails?.order_type || "TAKEAWAY",
          customer_name: offlineCustomerName || orderDetails?.customer_name || "Customer",
          customer_phone: offlineCustomerPhone || orderDetails?.customer_phone || "",
          items: cart.map((item) => ({
            product: item.type === "product" ? item.id : undefined,
            combo: item.type === "combo" ? item.id : undefined,
            name: item.name,
            base_price: item.basePrice ?? item.price,
            quantity: item.qty,
            price: item.price,
            gst_percent: item.gst_percent,
            addons: (item.selectedAddons ?? []).map((a) => ({
              id: a.id,
              name: a.name,
              price: a.price,
              qty: a.qty,
            })),
          })),
          discount_amount: manualDiscountAmount || 0,
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim(),
          cash_received: paymentMethod === "CASH" ? Math.round(Number(cashGiven || 0)) : undefined,
          status: "COMPLETED",
          payment_status: "PAID",
          server_order_id: !isOfflineOrder && effectiveOrderId ? effectiveOrderId : undefined,
        }, effectiveOrderId);

        setShowPaymentModal(false);
        setCart([]);
        setIsOfflineOrder(false);
        setPosNotice(`Offline order saved (${offlineResult.order_id}). Will sync when online.`);
        toast.success("Payment saved offline. It will sync automatically when connection returns.");

        // Reset and go back to POS
        setTimeout(() => {
          setOrderDetails(null);
          setRuntimeOrderId(null);
          setPosNotice("");
          window.location.replace("/staff/pos");
        }, 2500);
      } catch (error) {
        console.error(error);
        setPaymentError(error instanceof Error ? error.message : "Failed to save offline order.");
      } finally {
        setPaying(false);
      }
      return;
    }

    // -- ONLINE ORDER PATH (unchanged) --
    try {
      setPaying(true);
      setPaymentError("");
      try {
        await syncCartItems(effectiveOrderId);
      } catch (err) {
        if (isOrderLockedFailure(err)) {
          setShowPaymentModal(false);
          setPosNotice("Order already settled. Opening invoice preview.");
          await loadInvoicePreview(effectiveOrderId);
          return;
        }
        throw err;
      }

      const payRes = await fetch(`${BASE_URL}/api/orders/pay/${effectiveOrderId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: paymentMethod,
          reference: paymentMethod === "CARD" ? paymentReference.trim() : paymentReference.trim() || null,
          cash_received: paymentMethod === "CASH" ? Math.round(Number(cashGiven || 0)) : null,
        }),
      });
      if (!payRes.ok) {
        const raw = await payRes.text().catch(() => "");
        let err: Record<string, unknown> | unknown[] = {};
        try {
          err = raw ? (JSON.parse(raw) as Record<string, unknown> | unknown[]) : {};
        } catch {
          err = { raw };
        }
        const msg = getApiErrorMessage(err, "Payment failed.");
        if (isOrderLockedFailure(msg)) {
          setShowPaymentModal(false);
          setPosNotice("Order already settled. Opening invoice preview.");
          await loadInvoicePreview(effectiveOrderId);
          return;
        }
        throw new Error(msg);
      }

      const statusRes = await fetch(`${BASE_URL}/api/orders/status/${effectiveOrderId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "NEW" }),
      });
      if (!statusRes.ok) {
        const statusErr: unknown = await statusRes.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(statusErr, "Could not update order status."));
      }

      setShowPaymentModal(false);
      setCart([]);
      toast.success("Payment completed successfully.");
      await loadInvoicePreview(effectiveOrderId);
    } catch (error) {
      console.error(error);
      if (!isOnline() || isLikelyNetworkError(error) || isBackendUnavailableError(error)) {
        try {
          const offlineResult = await saveOfflineOrder({
            order_type: orderDetails?.order_type || "TAKEAWAY",
            customer_name: offlineCustomerName || orderDetails?.customer_name || "Customer",
            customer_phone: offlineCustomerPhone || orderDetails?.customer_phone || "",
            items: cart.map((item) => ({
              product: item.type === "product" ? item.id : undefined,
              combo: item.type === "combo" ? item.id : undefined,
              name: item.name,
              base_price: item.basePrice ?? item.price,
              quantity: item.qty,
              price: item.price,
              gst_percent: item.gst_percent,
              addons: (item.selectedAddons ?? []).map((a) => ({
                id: a.id,
                name: a.name,
                price: a.price,
                qty: a.qty,
              })),
            })),
            discount_amount: manualDiscountAmount || 0,
            payment_method: paymentMethod,
            payment_reference: paymentReference.trim(),
            cash_received: paymentMethod === "CASH" ? Math.round(Number(cashGiven || 0)) : undefined,
            status: "COMPLETED",
            payment_status: "PAID",
            server_order_id: !isOfflineOrder && effectiveOrderId ? effectiveOrderId : undefined,
          }, effectiveOrderId);

          setShowPaymentModal(false);
          setCart([]);
          setIsOfflineOrder(false);
          setPosNotice(`Server unavailable. Offline order saved (${offlineResult.order_id}). Will sync when online.`);
          toast.success("Server unavailable. Payment saved locally and queued for sync.");
          setTimeout(() => {
            setOrderDetails(null);
            setRuntimeOrderId(null);
            setPosNotice("");
            window.location.replace("/staff/pos");
          }, 2500);
          return;
        } catch (offlineErr) {
          console.error(offlineErr);
        }
      }
      const message = error instanceof Error ? error.message : "Payment failed.";
      setPaymentError(message);
      setPosNotice(message);
    } finally {
      setPaying(false);
    }
  };

  const markTakeawayPending = async () => {
    if (!effectiveOrderId || markingPending) return;
    if (!token && isOnline()) {
      setPaymentError("Session expired. Please login again.");
      return;
    }
    if (cart.length === 0) {
      setPaymentError("Cart is empty.");
      return;
    }

    try {
      setMarkingPending(true);
      setPaymentError("");

      if (isOfflineOrder || !isOnline()) {
        const offlineResult = await saveOfflineOrder({
          order_type: orderDetails?.order_type || "TAKEAWAY",
          customer_name: offlineCustomerName || orderDetails?.customer_name || "Customer",
          customer_phone: offlineCustomerPhone || orderDetails?.customer_phone || "",
          items: cart.map((item) => ({
            product: item.type === "product" ? item.id : undefined,
            combo: item.type === "combo" ? item.id : undefined,
            name: item.name,
            base_price: item.basePrice ?? item.price,
            quantity: item.qty,
            price: item.price,
            gst_percent: item.gst_percent,
            addons: (item.selectedAddons ?? []).map((a) => ({
              id: a.id,
              name: a.name,
              price: a.price,
              qty: a.qty,
            })),
          })),
          discount_amount: manualDiscountAmount || 0,
          status: "NEW",
          payment_status: "UNPAID",
          server_order_id: !isOfflineOrder && effectiveOrderId ? effectiveOrderId : undefined,
        }, effectiveOrderId);

        setPosNotice(`Offline pending order saved (${offlineResult.order_id}). Redirecting to Orders...`);
        setShowPaymentModal(false);
        setCart([]);
        window.setTimeout(() => navigate("/staff/orders"), 700);
        return;
      }

      try {
        await syncCartItems(effectiveOrderId);
      } catch (err) {
        if (isOrderLockedFailure(err)) {
          setShowPaymentModal(false);
          setPosNotice("Order already settled. Opening invoice preview.");
          await loadInvoicePreview(effectiveOrderId);
          return;
        }
        throw err;
      }

      const statusRes = await fetch(`${BASE_URL}/api/orders/status/${effectiveOrderId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "NEW" }),
      });
      if (!statusRes.ok) {
        const statusErr: unknown = await statusRes.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(statusErr, "Could not update pending status."));
      }

      setPosNotice("Order marked as Pending Payment. Redirecting to Orders...");
      setShowPaymentModal(false);
      setCart([]);
      window.setTimeout(() => navigate("/staff/orders"), 700);
    } catch (error) {
      console.error(error);
      if (!isOnline() || isLikelyNetworkError(error) || isBackendUnavailableError(error)) {
        try {
          const offlineResult = await saveOfflineOrder({
            order_type: orderDetails?.order_type || "TAKEAWAY",
            customer_name: offlineCustomerName || orderDetails?.customer_name || "Customer",
            customer_phone: offlineCustomerPhone || orderDetails?.customer_phone || "",
            items: cart.map((item) => ({
              product: item.type === "product" ? item.id : undefined,
              combo: item.type === "combo" ? item.id : undefined,
              name: item.name,
              base_price: item.basePrice ?? item.price,
              quantity: item.qty,
              price: item.price,
              gst_percent: item.gst_percent,
              addons: (item.selectedAddons ?? []).map((a) => ({
                id: a.id,
                name: a.name,
                price: a.price,
                qty: a.qty,
              })),
            })),
            discount_amount: manualDiscountAmount || 0,
            status: "NEW",
            payment_status: "UNPAID",
            server_order_id: !isOfflineOrder && effectiveOrderId ? effectiveOrderId : undefined,
          }, effectiveOrderId);
          setPosNotice(`Server unavailable. Offline pending order saved (${offlineResult.order_id}). Redirecting to Orders...`);
          setShowPaymentModal(false);
          setCart([]);
          window.setTimeout(() => navigate("/staff/orders"), 700);
          return;
        } catch (offlineErr) {
          console.error(offlineErr);
        }
      }
      setPaymentError(error instanceof Error ? error.message : "Could not mark order as pending.");
    } finally {
      setMarkingPending(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const hasCtrl = event.ctrlKey || event.metaKey;

      if (hasCtrl) {
        if (key === "n") {
          event.preventDefault();
          openNewPosBilling();
          return;
        }
        if (key === "s") {
          event.preventDefault();
          if (isDineInContext) {
            void handleSend();
          } else {
            openPaymentForTakeaway();
          }
          return;
        }
        if (key === "p") {
          event.preventDefault();
          window.print();
          return;
        }
        if (key === "f") {
          event.preventDefault();
          searchInputRef.current?.focus();
          return;
        }
        if (key === "d") {
          event.preventDefault();
          setPosNotice("Use the discount % or amount inputs in the cart footer.");
          return;
        }
        if (key === "r") {
          event.preventDefault();
          setPosNotice("Return shortcut captured. Return flow is not available yet.");
          return;
        }
        if (key === "h") {
          event.preventDefault();
          holdCart();
          return;
        }
        if (key === "l") {
          event.preventDefault();
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          localStorage.removeItem("user");
          navigate("/");
          return;
        }
      }

      if (key === "escape") {
        event.preventDefault();
        if (invoiceData) {
          closeInvoicePreview();
          return;
        }
        if (pendingSelection) {
          closeQtyModal();
          return;
        }
        if (showPaymentModal) {
          setShowPaymentModal(false);
          setPaymentError("");
          return;
        }
        if (showTakeawayModal) {
          setShowTakeawayModal(false);
          setTakeawayError("");
          return;
        }
        setPosNotice("");
        return;
      }

      if (key === "enter") {
        if (pendingSelection) return;
        if (showPaymentModal) return;
        if (showTakeawayModal) return;
        if (isEditableTarget(event.target) && event.target !== searchInputRef.current) return;

        const product = filteredProducts.find((p) => p.is_available !== false || !isOnline());
        if (product) {
          event.preventDefault();
          addToCart(product);
          return;
        }

        const combo = filteredCombos.find((c) => c.is_available !== false || !isOnline());
        if (combo) {
          event.preventDefault();
          addComboToCart(combo);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredProducts, filteredCombos, navigate, showTakeawayModal, showPaymentModal, cart, creatingTakeaway, hasBillingContext, pendingSelection, isDineInContext]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pendingSelection) return;
    const timer = window.setTimeout(() => {
      pendingQtyInputRef.current?.focus();
      pendingQtyInputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pendingSelection]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!searchDropdownRef.current) return;
      if (!searchDropdownRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* ================= UI ================= */

  const displayOrder = orderDetails ?? queryOrderContext;

  const isTakeaway =
    displayOrder?.order_type === "TAKEAWAY" ||
    displayOrder?.order_type === "TAKE_AWAY" ||
    displayOrder?.order_type === "SWIGGY" ||
    displayOrder?.order_type === "ZOMATO";

  const isDineIn =
    displayOrder?.order_type === "DINE_IN";

  const productNameById = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [products]);

  const invoiceLineItems = useMemo(() => {
    if (!invoiceData) return [];
    const rows =
      Array.isArray(invoiceData.line_items) && invoiceData.line_items.length > 0
        ? invoiceData.line_items
        : Array.isArray(invoiceData.items)
        ? invoiceData.items
        : [];
    return rows.map((li) => ({
      ...li,
      addons: Array.isArray(li.addons) ? li.addons : [],
    }));
  }, [invoiceData]);
  const invoiceManualDiscount = Number(
    invoiceData?.manual_discount ??
      invoiceData?.discount_breakdown?.manual_discount ??
      0
  );
  const invoiceCouponDiscount = Number(
    invoiceData?.coupon_discount ??
      invoiceData?.discount_breakdown?.coupon_discount ??
      0
  );
  const invoiceFreeItemLabel = (() => {
    const details = invoiceData?.coupon_details;
    if (!details || details.discount_type !== "FREE_ITEM") return "";
    return String(details.free_item || details.free_item_category || "Free Item");
  })();

  return (
    <div className="pos-page min-h-screen p-3 sm:p-4 lg:p-5">
      {/* Offline indicator for POS */}
      {!isOnline() && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
          <CloudOff className="h-4 w-4" />
          <span>Offline Mode — Orders are saved locally until you sync them from Profile</span>
        </div>
      )}
      <style>{`
        @media print {
          .pos-page > * {
            display: none !important;
          }
          .pos-page > .pos-invoice-overlay {
            display: flex !important;
            position: static !important;
            inset: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .pos-thermal-root {
            width: 80mm !important;
            max-width: 80mm !important;
            max-height: none !important;
            overflow: visible !important;
            border: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .pos-no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="mx-auto grid max-w-[2200px] grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-6 xl:gap-8">
        {/* LEFT */}
        <PosCatalogPanel
          searchDropdownRef={searchDropdownRef}
          searchInputRef={searchInputRef}
          search={search}
          showSearchDropdown={showSearchDropdown}
          searchSuggestions={searchSuggestions}
          categories={categories}
          activeCategory={activeCategory}
          filteredProducts={filteredProducts}
          filteredCombos={filteredCombos}
          hasBillingContext={hasBillingContext}
          isOnlineNow={isOnline()}
          productNameById={productNameById}
          onSearchChange={setSearch}
          onSearchFocus={() => setIsSearchFocused(true)}
          onSearchKeyDown={(e) => {
            if (e.key === "Enter" && searchSuggestions.length > 0) {
              e.preventDefault();
              openQtyModalForProduct(searchSuggestions[0]);
              setSearch("");
              setIsSearchFocused(false);
            }
            if (e.key === "Escape") {
              setIsSearchFocused(false);
            }
          }}
          onSelectSuggestion={(item) => {
            openQtyModalForProduct(item);
            setSearch("");
            setIsSearchFocused(false);
          }}
          onCategoryChange={setActiveCategory}
          onOpenProduct={openQtyModalForProduct}
          onOpenCombo={openQtyModalForCombo}
        />

        {/* RIGHT */}
        <div className="lg:col-span-6 xl:col-span-5">
          <Card className="flex min-h-[78vh] flex-col rounded-[30px] border border-purple-300/70 bg-[linear-gradient(160deg,#ffffff_0%,#faf6ff_52%,#f4edff_100%)] shadow-[0_28px_70px_rgba(76,29,149,0.24)] lg:min-h-[calc(100vh-6.5rem)]">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-purple-200/80 bg-[linear-gradient(120deg,#f2e8ff_0%,#ffffff_100%)] px-5 py-4">
              <h2 className="inline-flex items-center gap-2 text-base font-semibold text-purple-950">
                <ShoppingCart className="h-4 w-4 text-purple-700" />
                Your Cart
                <span className="rounded-full border border-purple-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                  {cart.length}
                </span>
              </h2>
              <div className="flex items-center gap-1.5">
                {hasHeldCart && (
                  <Button variant="ghost" size="sm" onClick={resumeHeldCart} className="rounded-lg border border-purple-200/80 bg-white text-purple-700 hover:bg-purple-100 hover:text-purple-800">
                    Resume Hold
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={resetCart} className="rounded-lg border border-purple-200/80 bg-white text-purple-700 hover:bg-purple-100 hover:text-purple-800">
                  Reset
                </Button>
              </div>
            </div>

            {/* ORDER INFO */}
            {displayOrder && (
              <div className="space-y-1 border-b border-purple-100 bg-purple-50/70 px-5 py-3 text-sm">
                {isTakeaway && (
                  <>
                    <p><b>Type:</b> {displayOrder.order_type === "SWIGGY" || displayOrder.order_type === "ZOMATO" ? displayOrder.order_type : "Takeaway"}</p>
                    <p><b>Customer:</b> {displayOrder.customer_name}</p>
                    {displayOrder.phone && (
                      <p className="text-xs text-purple-700/70">
                        {displayOrder.phone}
                      </p>
                    )}
                  </>
                )}

                {isDineIn && (
                  <>
                    <p><b>Table:</b> {displayOrder.table_number || "-"}</p>
                    <p><b>Token:</b> {displayOrder.token_number || "-"}</p>
                    <p><b>Customer:</b> {displayOrder.customer_name || "-"}</p>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col">
              {/* BODY */}
              <div className="px-4 py-4 sm:px-5">
                <div className="mb-2 hidden grid-cols-12 border-b border-purple-100 pb-2 text-[11px] font-semibold uppercase tracking-wide text-purple-600 md:grid">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-3 text-center">Qty</div>
                  <div className="col-span-2 text-center">GST</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {cart.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-purple-200/80 bg-white/70 py-10 text-center text-sm font-medium text-purple-400">
                    Your cart is empty
                  </div>
                )}

                {cart.map(item => {
                  const rate = Number(item.gst_percent || 0);
                  const base = item.price * item.qty;
                  const taxableBase = (item.basePrice ?? item.price) * item.qty;
                  const final = base + (taxableBase * rate) / 100;
                  const selectedAddons = item.selectedAddons ?? [];
                  const showAllAddons = Boolean(expandedAddonRows[item.key]);
                  const visibleAddons = showAllAddons ? selectedAddons : selectedAddons.slice(0, 1);
                  const hiddenAddonCount = Math.max(0, selectedAddons.length - visibleAddons.length);

                  return (
                    <div
                      key={item.key}
                      className="mb-3 rounded-2xl border border-purple-100 bg-[linear-gradient(180deg,rgba(250,245,255,0.95)_0%,rgba(255,255,255,0.98)_100%)] px-3.5 py-3.5 text-[12px] shadow-[0_10px_24px_rgba(109,40,217,0.06)]"
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
                        <div className="flex items-start gap-3 rounded-lg text-left md:col-span-5">
                          <img
                            src={item.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&q=80"}
                            className="h-12 w-12 rounded-xl object-cover ring-1 ring-purple-100"
                          />
                          <div className="min-w-0">
                            <p className="break-words font-semibold leading-5 text-purple-950">{item.name}</p>
                            <p className="mt-0.5 text-[11px] text-purple-600/75">
                              Rs {item.price} x {item.qty}
                            </p>
                            {item.type === "product" && (
                              <button
                                type="button"
                                onClick={() => openQtyModalForCartItem(item)}
                                className="mt-1 text-[12px] font-semibold text-purple-700 underline decoration-purple-400 underline-offset-2 hover:text-purple-900"
                                title="Open addons modal"
                              >
                                Edit addons
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 md:col-span-7 md:mt-0 md:grid-cols-7 md:items-center">
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 bg-white/85 px-3 py-2 md:col-span-3 md:justify-center md:border-0 md:bg-transparent md:px-0 md:py-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600 md:hidden">
                              Qty
                            </span>
                            <div className="inline-flex items-center rounded-xl border border-purple-200 bg-white shadow-sm">
                              <button
                                onClick={() => updateQty(item.key, -1)}
                                disabled={item.qty <= 1}
                                className="h-8 w-8 rounded-l-lg text-base font-bold leading-none text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) => {
                                  const parsed = Number(e.target.value);
                                  if (Number.isNaN(parsed)) return;
                                  setQty(item.key, parsed);
                                }}
                                className="h-8 w-12 border-x border-purple-200 bg-white px-1 text-center text-sm font-semibold text-purple-900 outline-none focus:bg-purple-50"
                              />
                              <button
                                onClick={() => updateQty(item.key, 1)}
                                className="h-8 w-8 rounded-r-lg text-base font-bold leading-none text-purple-700 transition hover:bg-purple-100"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 md:col-span-2 md:block">
                            <div className="rounded-xl border border-purple-100 bg-white/80 px-3 py-2.5 text-left md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:text-center">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-purple-600 md:hidden">
                                GST
                              </span>
                              <span className="font-medium text-purple-800">{rate}%</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 md:col-span-2 md:block">
                            <div className="rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-right shadow-[0_6px_14px_rgba(109,40,217,0.05)] md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-purple-600 md:hidden">
                                Total
                              </span>
                              <span className="font-semibold text-purple-900">Rs {final.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>

                        {selectedAddons.length > 0 && (
                          <div className="border-t border-purple-100/80 pt-2 md:col-span-12 md:ml-[60px] md:border-t-0 md:pt-0">
                            <div className="space-y-0.5 text-[10px] leading-4 text-purple-700/85">
                              {visibleAddons.map((addon) => (
                                <p key={`${item.key}-addon-${addon.id}`}>
                                  + {addon.name} x{addon.qty} @ Rs {addon.price.toFixed(0)} = Rs {(addon.qty * addon.price).toFixed(0)} / item
                                </p>
                              ))}
                              {selectedAddons.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedAddonRows((prev) => ({
                                      ...prev,
                                      [item.key]: !prev[item.key],
                                    }))
                                  }
                                  className="mt-0.5 text-[10px] font-semibold text-purple-700 underline decoration-purple-400 underline-offset-2 hover:text-purple-900"
                                >
                                  {showAllAddons
                                    ? "View less addons"
                                    : `View more addons (${hiddenAddonCount})`}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-purple-200/70 bg-[linear-gradient(135deg,rgba(245,236,255,0.9)_0%,rgba(255,255,255,0.95)_100%)] p-3.5 shadow-[0_12px_28px_rgba(109,40,217,0.08)]">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-purple-700">
                      Discount
                    </p>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-purple-700">
                        {discountMode === "percent" ? "Discount Percent (%)" : "Discount Amount (Rs)"}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={discountMode === "percent" ? 100 : undefined}
                          step="1"
                          value={discountMode === "percent" ? discountPercentInput : discountAmountInput}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (discountMode === "percent") {
                              setDiscountPercentInput(raw);
                              syncFromPercent(raw, grossTotal);
                              return;
                            }
                            setDiscountAmountInput(raw);
                            syncFromAmount(raw, grossTotal);
                          }}
                          placeholder={discountMode === "percent" ? "Enter percent" : "Enter amount"}
                          className={`h-9 rounded-lg border-purple-200 bg-white text-xs text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300 ${
                            discountMode === "amount" ? "pl-8" : "pr-7"
                          }`}
                        />
                        <div className="inline-flex h-9 w-full rounded-lg border border-purple-200 bg-white text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => switchDiscountMode("amount")}
                            className={`w-1/2 rounded-md px-2 py-1 ${discountMode === "amount" ? "bg-purple-600 text-white" : "text-purple-700"}`}
                          >
                            Amt
                          </button>
                          <button
                            type="button"
                            onClick={() => switchDiscountMode("percent")}
                            className={`w-1/2 rounded-md px-2 py-1 ${discountMode === "percent" ? "bg-purple-600 text-white" : "text-purple-700"}`}
                          >
                            %
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-200/70 bg-[linear-gradient(135deg,rgba(245,236,255,0.86)_0%,rgba(255,255,255,0.96)_100%)] p-3.5 shadow-[0_12px_28px_rgba(109,40,217,0.08)]">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-purple-700">
                      Coupon
                    </p>
                    <div className="space-y-2">
                      <Input
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="h-9 rounded-lg border-purple-200 bg-white text-xs text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          onClick={() => void applyCoupon()}
                          disabled={applyingCoupon}
                          className="h-9 rounded-lg bg-purple-600 px-3 text-xs text-white hover:bg-purple-700"
                        >
                          {applyingCoupon ? "Applying..." : "Apply"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={removeCoupon}
                          disabled={!appliedCoupon}
                          className="h-9 rounded-lg border-purple-200 px-3 text-xs text-purple-700 hover:bg-purple-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    {appliedCoupon && (
                      <p className="mt-2 text-[11px] font-medium text-emerald-700">
                        Applied: {appliedCoupon.code} ({appliedCoupon.discount_type} {couponTypeLabel}) (- Rs {couponDiscountAmount.toFixed(0)})
                      </p>
                    )}
                    {appliedFreeItemLabel && (
                      <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                        Free Item: {appliedFreeItemLabel}
                      </p>
                    )}
                    {couponError && (
                      <p className="mt-2 text-[11px] font-medium text-rose-700">{couponError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="space-y-2 border-t border-purple-200/70 bg-white/90 p-4 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-purple-100 bg-purple-50/50 px-2.5 py-2 text-purple-800">
                    <p className="text-[10px] uppercase tracking-wide text-purple-600">Subtotal</p>
                    <p className="mt-0.5 font-semibold">Rs {subtotal.toFixed(0)}</p>
                  </div>
                  <div className="rounded-xl border border-purple-100 bg-purple-50/50 px-2.5 py-2 text-purple-800">
                    <p className="text-[10px] uppercase tracking-wide text-purple-600">GST</p>
                    <p className="mt-0.5 font-semibold">Rs {gst.toFixed(0)}</p>
                  </div>
                </div>
                <div className="space-y-1 rounded-xl border border-purple-100 bg-purple-50/40 px-2.5 py-2">
                  <div className="flex justify-between text-[11px] text-purple-800">
                    <span>Manual Discount ({discountMode === "percent" ? "Percent" : "Amount"}: {manualDiscountDisplayValue})</span>
                    <span>- Rs {manualDiscountAmount.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-purple-800">
                    <span>Coupon Discount {appliedCoupon ? `(${appliedCoupon.code} - ${appliedCoupon.discount_type})` : ""}</span>
                    <span>- Rs {couponDiscountAmount.toFixed(0)}</span>
                  </div>
                  {appliedFreeItemLabel && (
                    <div className="flex justify-between text-[11px] text-emerald-700">
                      <span>Coupon Free Item</span>
                      <span>{appliedFreeItemLabel}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-purple-900">
                    <span>Total Discount</span>
                    <span>- Rs {discountAmount.toFixed(0)}</span>
                  </div>
                </div>
                <div className="flex items-end justify-between rounded-xl border border-purple-200 bg-[linear-gradient(120deg,#f7f0ff_0%,#ffffff_100%)] px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">Grand Total</span>
                  <span className="text-xl font-bold text-purple-800">
                    Rs {total.toFixed(0)}
                  </span>
                </div>

                <Button
                  className="mt-2 h-11 w-full rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#5b21b6_100%)] font-semibold text-white shadow-[0_10px_22px_rgba(109,40,217,0.28)] hover:opacity-95"
                  onClick={() => {
                    if (isDineInContext) {
                      void handleSend();
                      return;
                    }
                    openPaymentForTakeaway();
                  }}
                  disabled={
                    cart.length === 0 ||
                    !token ||
                    (isDineInContext ? (!effectiveOrderId && !queryOrderContext?.session) : !effectiveOrderId) ||
                    sending ||
                    paying
                  }
                >
                  {isDineInContext ? (sending ? "Sending..." : "Send to Kitchen") : (paying ? "Processing..." : "Proceed to Pay")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <PosTakeawayModal
        open={showTakeawayModal}
        phone={takeawayPhone}
        customerName={takeawayCustomerName}
        lookupLoading={lookupLoading}
        lookupDone={takeawayLookupDone}
        requiresName={takeawayRequiresName}
        customerMatches={customerMatches}
        error={takeawayError}
        creatingTakeaway={creatingTakeaway}
        onPhoneChange={(value) => {
          setTakeawayPhone(value);
          setTakeawayLookupDone(false);
          setTakeawayRequiresName(false);
          setTakeawayCustomerName("");
          setTakeawayError("");
        }}
        onCustomerNameChange={setTakeawayCustomerName}
        onContinue={() => {
          void startTakeawayFromPos();
        }}
        onCancel={() => {
          setShowTakeawayModal(false);
          setPosNotice("");
          setTakeawayCustomerName("");
          setTakeawayPhone("");
          setCustomerMatches([]);
          setTakeawayError("");
          setTakeawayLookupDone(false);
          setTakeawayRequiresName(false);
        }}
        onSelectCustomerMatch={selectCustomerMatch}
      />

      {pendingSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-purple-200 bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-xl font-semibold text-purple-950">
              {pendingSelection.type === "product"
                ? isEditingPendingSelection
                  ? "Edit Item"
                  : "Customize Item"
                : "Add Quantity"}
            </h2>
            <p className="mb-4 text-sm text-purple-700">
              {pendingSelection.type === "product"
                ? pendingSelection.product?.name
                : pendingSelection.combo?.name}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirmPendingQty();
              }}
            >
              <Input
                ref={pendingQtyInputRef}
                type="number"
                min={1}
                step={1}
                placeholder="Enter product quantity"
                value={pendingQty}
                onChange={(e) => {
                  setPendingQty(e.target.value);
                  if (pendingQtyError) setPendingQtyError("");
                }}
                className="mb-3 h-11 rounded-xl border-purple-200 bg-white text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
              />

              {pendingSelection.type === "product" && (
                <div className="mb-4 space-y-3 rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                      Addons
                    </p>
                    <p className="text-xs font-semibold text-purple-700">
                      + Rs {pendingAddonUnitTotal.toFixed(0)} / item
                    </p>
                  </div>

                  <div className="relative">
                    
                    <Input
                      value={pendingAddonSearch}
                      onChange={(e) => setPendingAddonSearch(e.target.value)}
                      placeholder="Search addons..."
                      className="h-10 rounded-xl border-purple-200 bg-white pl-9 text-sm text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
                    />
                  </div>

                  {renderAddonRows(previewPendingAddons)}
                  {filteredPendingAddons.length > 4 && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAllAddonsModal(true)}
                        className="h-9 border-purple-200 text-xs text-purple-700 hover:bg-purple-50"
                      >
                        Show More ({filteredPendingAddons.length - 4} more)
                      </Button>
                    </div>
                  )}

                  <div className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs text-purple-800">
                    <div className="flex items-center justify-between">
                      <span>Base Price</span>
                      <span>Rs {Number(pendingSelection.product?.price || 0).toFixed(0)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span>Addons / item</span>
                      <span>Rs {pendingAddonUnitTotal.toFixed(0)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-purple-100 pt-1.5 font-semibold">
                      <span>Item Total</span>
                      <span>
                        Rs {(pendingProductUnitPrice * Math.max(1, Number(pendingQty) || 1)).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {pendingQtyError && (
                <p className="mb-4 text-sm font-medium text-violet-700">{pendingQtyError}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeQtyModal}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[linear-gradient(135deg,#7c3aed_0%,#5b21b6_100%)] text-white hover:opacity-95"
                >
                  {isEditingPendingSelection ? "Update Item" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingSelection?.type === "product" && showAllAddonsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-purple-200 bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-950">All Addons</h3>
                <p className="text-xs text-purple-700">Search works across all addons.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAllAddonsModal(false);
                  closePendingAddonQtyEditor();
                }}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Close
              </Button>
            </div>

            <div className="relative mb-3">
              
              <Input
                value={pendingAddonSearch}
                onChange={(e) => setPendingAddonSearch(e.target.value)}
                placeholder="Search addons..."
                className="h-10 rounded-xl border-purple-200 bg-white pl-9 text-sm text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
              />
            </div>

            {renderAddonRows(filteredPendingAddons)}
          </div>
        </div>
      )}

      <PosInvoicePreviewModal
        open={Boolean(invoiceLoading || invoiceData)}
        invoiceLoading={invoiceLoading}
        invoiceData={invoiceData}
        invoiceLineItems={invoiceLineItems}
        invoiceManualDiscount={invoiceManualDiscount}
        invoiceCouponDiscount={invoiceCouponDiscount}
        invoiceFreeItemLabel={invoiceFreeItemLabel}
        onClose={closeInvoicePreview}
      />

      <PosPaymentModal
        open={showPaymentModal}
        paymentMethod={paymentMethod}
        cashGiven={cashGiven}
        paymentReference={paymentReference}
        paymentError={paymentError}
        cashBalance={cashBalance}
        total={total}
        paying={paying}
        markingPending={markingPending}
        onMethodChange={(method) => {
          setPaymentMethod(method);
          setPaymentError("");
        }}
        onCashGivenChange={(value) => {
          setCashGiven(value);
          setPaymentError("");
        }}
        onPaymentReferenceChange={(value) => {
          setPaymentReference(value);
          setPaymentError("");
        }}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentError("");
        }}
        onConfirmPayment={() => {
          void confirmTakeawayPayment();
        }}
        onMarkPending={() => {
          void markTakeawayPending();
        }}
      />
    </div>
  );
}



