const UNIT_FAMILIES: Record<string, Record<string, number>> = {
  weight: {
    mg: 0.001,
    g: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592,
    ton: 1000000,
  },
  volume: {
    ml: 1,
    cl: 10,
    L: 1000,
    gal: 3785.41,
  },
};

const findUnitFamily = (unit: string) => {
  return Object.values(UNIT_FAMILIES).find((family) => unit in family) ?? null;
};

export const getCompatibleUnits = (baseUnit: string) => {
  const family = findUnitFamily(baseUnit);
  if (!family) return [baseUnit];
  return Object.keys(family);
};

export const convertToBaseUnit = (value: number, fromUnit: string, baseUnit: string) => {
  if (fromUnit === baseUnit) return value;
  const fromFamily = findUnitFamily(fromUnit);
  const baseFamily = findUnitFamily(baseUnit);
  if (!fromFamily || !baseFamily || fromFamily !== baseFamily) return value;

  const fromFactor = fromFamily[fromUnit];
  const baseFactor = baseFamily[baseUnit];
  if (!fromFactor || !baseFactor) return value;

  return (value * fromFactor) / baseFactor;
};
