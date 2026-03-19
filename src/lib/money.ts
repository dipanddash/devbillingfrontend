export const toMoneyNumber = (value: unknown): number => {
  const parsed =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const roundRupee = (value: unknown): number => Math.max(0, Math.round(toMoneyNumber(value)));

export const formatRupees = (value: unknown): string => `Rs ${roundRupee(value).toLocaleString("en-IN")}`;
