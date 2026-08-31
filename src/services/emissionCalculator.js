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

const getFactor = (factors, source) => {
  const factor = Number(factors[source]);

  return Number.isFinite(factor) && factor >= 0
    ? factor
    : DEFAULT_EMISSION_FACTORS[source];
};

export const calculateEmissions = (activity = {}, factors = {}) => {
  const gasolina = toNonNegativeNumber(activity.gasolina);
  const diesel = toNonNegativeNumber(activity.diesel);
  const glp = toNonNegativeNumber(activity.glp);
  const electricidad = toNonNegativeNumber(activity.electricidad);
  const vuelos = toNonNegativeNumber(activity.vuelos);
  const residuos = toNonNegativeNumber(activity.residuos);

  const scope1Kg =
    gasolina * getFactor(factors, 'gasolina') +
    diesel * getFactor(factors, 'diesel') +
    glp * getFactor(factors, 'glp');

  const scope2Kg =
    electricidad * getFactor(factors, 'electricidad');

  const scope3Kg =
    vuelos * getFactor(factors, 'vuelos') +
    residuos * getFactor(factors, 'residuos');

  return {
    a1: scope1Kg / 1000,
    a2: scope2Kg / 1000,
    a3: scope3Kg / 1000,
    total: (scope1Kg + scope2Kg + scope3Kg) / 1000,
  };
};