export const SOURCE_LABELS = Object.freeze({
  gasolina: 'Gasolina',
  diesel: 'Diésel',
  glp: 'GLP',
  electricidad: 'Electricidad',
  vuelos: 'Vuelos',
  residuos: 'Residuos',
});

export const calculateVariation = (current, previous) => {
  const currentNumber = Number(current) || 0;
  const previousNumber = Number(previous) || 0;

  if (previousNumber === 0 && currentNumber === 0) {
    return 0;
  }

  if (previousNumber === 0 && currentNumber > 0) {
    return null;
  }

  return ((currentNumber - previousNumber) / previousNumber) * 100;
};

export const compareEmissionSources = (
  currentSources = [],
  previousSources = []
) =>
  currentSources.map((current) => {
    const previous = previousSources.find(
      (item) => item.fuente === current.fuente
    );

    const currentAmount = Number(current.cantidad) || 0;
    const previousAmount = Number(previous?.cantidad) || 0;

    return {
      source: current.fuente,
      label: SOURCE_LABELS[current.fuente] || current.fuente,
      previous: previousAmount,
      current: currentAmount,
      unit: current.unidad,
      emissions: Number(current.emisiones_tco2eq) || 0,
      variation: calculateVariation(currentAmount, previousAmount),
    };
  });

export const findVariationExtremes = (comparison = []) => {
  const numericVariations = comparison.filter(
    (item) => item.variation !== null
  );

  const increases = numericVariations.filter(
    (item) => item.variation > 0
  );

  const reductions = numericVariations.filter(
    (item) => item.variation < 0
  );

  return {
    greatestIncrease: increases.length
      ? increases.reduce((maximum, item) =>
          item.variation > maximum.variation ? item : maximum
        )
      : null,

    greatestReduction: reductions.length
      ? reductions.reduce((minimum, item) =>
          item.variation < minimum.variation ? item : minimum
        )
      : null,
  };
};