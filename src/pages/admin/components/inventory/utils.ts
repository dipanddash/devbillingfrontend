export const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.results)) return record.results as T[];
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.data)) return record.data as T[];
  }
  return [];
};

export const asNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const formatNum = (value: unknown, fractionDigits = 3) => asNumber(value).toFixed(fractionDigits);

const cleanErrorMessage = (raw: string): string => {
  if (!raw) return raw;
  const match = raw.match(/ErrorDetail\(string='([^']+)'/);
  if (match?.[1]) return match[1];
  return raw
    .replace(/^\[+/, "")
    .replace(/\]+$/, "")
    .replace(/^'+|'+$/g, "")
    .trim();
};

export const extractApiMessage = (payload: unknown, fallback: string): string => {
  if (!payload) return fallback;
  if (typeof payload === "string") return cleanErrorMessage(payload);
  if (Array.isArray(payload)) {
    const first = payload[0];
    if (typeof first === "string") return cleanErrorMessage(first);
    if (first && typeof first === "object") {
      return extractApiMessage(first, fallback);
    }
    return fallback;
  }
  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const direct = record.error ?? record.detail ?? record.message;
    if (typeof direct === "string") return cleanErrorMessage(direct);
    if (Array.isArray(direct) || (direct && typeof direct === "object")) {
      return extractApiMessage(direct, fallback);
    }
    const firstValue = Object.values(record)[0];
    if (firstValue !== undefined) {
      return extractApiMessage(firstValue, fallback);
    }
  }
  return fallback;
};

export const todayIso = () => new Date().toISOString().slice(0, 10);
