import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEmissions,
  DEFAULT_EMISSION_FACTORS,
} from './emissionCalculator.js';

const approximatelyEqual = (actual, expected) => {
  assert.ok(
    Math.abs(actual - expected) < 1e-12,
    `Se esperaba ${expected}, pero se obtuvo ${actual}`
  );
};

test('calcula correctamente las fuentes y los tres alcances', () => {
  const result = calculateEmissions({
    gasolina: 10,
    diesel: 20,
    glp: 5,
    electricidad: 100,
    vuelos: 1000,
    residuos: 50,
  });

  approximatelyEqual(result.gasolina, 0.0231);
  approximatelyEqual(result.diesel, 0.0536);
  approximatelyEqual(result.glp, 0.0149);
  approximatelyEqual(result.electricidad, 0.0549);
  approximatelyEqual(result.vuelos, 0.255);
  approximatelyEqual(result.residuos, 0.0286);

  approximatelyEqual(result.a1, 0.0916);
  approximatelyEqual(result.a2, 0.0549);
  approximatelyEqual(result.a3, 0.2836);
  approximatelyEqual(result.total, 0.4301);
});

test('acepta valores numéricos recibidos como texto', () => {
  const result = calculateEmissions({
    gasolina: '10',
    electricidad: '100',
  });

  approximatelyEqual(
    result.total,
    (10 * DEFAULT_EMISSION_FACTORS.gasolina +
      100 * DEFAULT_EMISSION_FACTORS.electricidad) / 1000
  );
});

test('convierte entradas inválidas o negativas en cero', () => {
  const result = calculateEmissions({
    gasolina: -10,
    diesel: 'dato inválido',
    electricidad: null,
  });

  assert.deepEqual(result, {
    gasolina: 0,
    diesel: 0,
    glp: 0,
    electricidad: 0,
    vuelos: 0,
    residuos: 0,
    a1: 0,
    a2: 0,
    a3: 0,
    total: 0,
  });
});