export const DEFAULT_EMISSION_FACTORS = Object.freeze({
  gasolina: 2.31,
  diesel: 2.68,
  glp: 2.98,
  electricidad: 0.549,
  vuelos: 0.255,
  residuos: 0.572,
});

const toNonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

export const resolveEmissionFactor = (factors, source) => {
  const factor = Number(factors[source]);

  return Number.isFinite(factor) && factor >= 0
    ? factor
    : DEFAULT_EMISSION_FACTORS[source];
};

export const calculateEmissions = (activity = {}, factors = {}) => {
  const gasolina =
    toNonNegativeNumber(activity.gasolina) *
    resolveEmissionFactor(factors, 'gasolina') / 1000;

  const diesel =
    toNonNegativeNumber(activity.diesel) *
    resolveEmissionFactor(factors, 'diesel') / 1000;

  const glp =
    toNonNegativeNumber(activity.glp) *
    resolveEmissionFactor(factors, 'glp') / 1000;

  const electricidad =
    toNonNegativeNumber(activity.electricidad) *
    resolveEmissionFactor(factors, 'electricidad') / 1000;

  const vuelos =
    toNonNegativeNumber(activity.vuelos) *
    resolveEmissionFactor(factors, 'vuelos') / 1000;

  const residuos =
    toNonNegativeNumber(activity.residuos) *
    resolveEmissionFactor(factors, 'residuos') / 1000;

  const a1 = gasolina + diesel + glp;
  const a2 = electricidad;
  const a3 = vuelos + residuos;

  return {
    gasolina,
    diesel,
    glp,
    electricidad,
    vuelos,
    residuos,
    a1,
    a2,
    a3,
    total: a1 + a2 + a3,
  };
};