import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeImportedRows,
  SOURCE_CONFIG,
  tableRowsToObjects,
} from './importNormalizer.js';

test('normaliza filas ambientales válidas', () => {
  const result = normalizeImportedRows([
    { fuente: 'Gasolina', cantidad: '10', unidad: 'litros' },
    { fuente: 'Electricidad', cantidad: '100', unidad: 'kWh' },
    { fuente: 'Vuelos', cantidad: '500', unidad: 'km' },
  ]);

  assert.equal(result.errors.length, 0);
  assert.deepEqual(
    result.records.map(({ source, amount, unit, scope }) => ({
      source,
      amount,
      unit,
      scope,
    })),
    [
      { source: 'gasolina', amount: 10, unit: 'L', scope: 1 },
      { source: 'electricidad', amount: 100, unit: 'kWh', scope: 2 },
      { source: 'vuelos', amount: 500, unit: 'km', scope: 3 },
    ]
  );
});

test('acepta encabezados alternativos, alias y coma decimal', () => {
  const result = normalizeImportedRows([
    { actividad: 'Petróleo', consumo: '12,5', unidad: 'L' },
  ]);

  assert.equal(result.errors.length, 0);
  assert.equal(result.records[0].source, 'diesel');
  assert.equal(result.records[0].amount, 12.5);
});

test('reporta fuente, cantidad y unidad inválidas', () => {
  const result = normalizeImportedRows([
    { fuente: 'Carbón', cantidad: 10, unidad: 'kg' },
    { fuente: 'Gasolina', cantidad: -5, unidad: 'L' },
    { fuente: 'GLP', cantidad: 20, unidad: 'L' },
  ]);

  assert.equal(result.records.length, 0);
  assert.equal(result.errors.length, 3);
  assert.match(result.errors[0].message, /Fuente/);
  assert.match(result.errors[1].message, /Cantidad/);
  assert.match(result.errors[2].message, /unidad/);
  assert.equal(SOURCE_CONFIG.glp.unit, 'kg');
});


test('convierte filas de Excel usando la primera fila como encabezados', () => {
  const rows = [
    ['fuente', 'cantidad', 'unidad'],
    ['Gasolina', 10, 'L'],
    ['Electricidad', 100, 'kWh'],
    [null, null, null],
  ];

  assert.deepEqual(tableRowsToObjects(rows), [
    { fuente: 'Gasolina', cantidad: 10, unidad: 'L' },
    { fuente: 'Electricidad', cantidad: 100, unidad: 'kWh' },
  ]);
});
