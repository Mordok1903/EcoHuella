import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVariation,
  compareEmissionSources,
  findVariationExtremes,
} from './emissionComparison.js';

test('calcula aumentos, reducciones y valores sin cambio', () => {
  assert.equal(calculateVariation(15, 5), 200);
  assert.equal(calculateVariation(6, 15), -60);
  assert.equal(calculateVariation(8, 8), 0);
  assert.equal(calculateVariation(10, 0), null);
});

test('compara fuentes y conserva el nombre correcto de GLP', () => {
  const comparison = compareEmissionSources(
    [
      {
        fuente: 'gasolina',
        cantidad: 15,
        unidad: 'L',
        emisiones_tco2eq: 0.03465,
      },
      {
        fuente: 'glp',
        cantidad: 6,
        unidad: 'kg',
        emisiones_tco2eq: 0.01788,
      },
    ],
    [
      { fuente: 'gasolina', cantidad: 5 },
      { fuente: 'glp', cantidad: 7 },
    ]
  );

  assert.equal(comparison[0].variation, 200);
  assert.equal(comparison[1].label, 'GLP');
  assert.ok(comparison[1].variation < 0);
});

test('encuentra el mayor aumento y la mayor reducción', () => {
  const comparison = [
    { label: 'Gasolina', variation: 200 },
    { label: 'Diésel', variation: 33.3 },
    { label: 'Vuelos', variation: -50 },
    { label: 'Residuos', variation: -60 },
  ];

  const extremes = findVariationExtremes(comparison);

  assert.equal(extremes.greatestIncrease.label, 'Gasolina');
  assert.equal(extremes.greatestReduction.label, 'Residuos');
});