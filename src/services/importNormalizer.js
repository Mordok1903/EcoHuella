const SOURCE_ALIASES = {
  gasolina: 'gasolina',
  diesel: 'diesel',
  petroleo: 'diesel',
  glp: 'glp',
  electricidad: 'electricidad',
  energia: 'electricidad',
  vuelo: 'vuelos',
  vuelos: 'vuelos',
  residuos: 'residuos',
  residuo: 'residuos',
};

export const SOURCE_CONFIG = Object.freeze({
  gasolina: { label: 'Gasolina', unit: 'L', scope: 1 },
  diesel: { label: 'Diésel', unit: 'L', scope: 1 },
  glp: { label: 'GLP', unit: 'kg', scope: 1 },
  electricidad: { label: 'Electricidad', unit: 'kWh', scope: 2 },
  vuelos: { label: 'Vuelos', unit: 'km', scope: 3 },
  residuos: { label: 'Residuos', unit: 'kg', scope: 3 },
});

const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const normalizeUnit = (value) => {
  const unit = normalizeText(value);

  const aliases = {
    l: 'L',
    litro: 'L',
    litros: 'L',
    kg: 'kg',
    kilogramo: 'kg',
    kilogramos: 'kg',
    kwh: 'kWh',
    km: 'km',
    kilometro: 'km',
    kilometros: 'km',
  };

  return aliases[unit] || value;
};

const readField = (row, acceptedNames) => {
  const normalizedRow = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeText(key), value])
  );

  for (const name of acceptedNames) {
    if (normalizedRow[name] !== undefined) return normalizedRow[name];
  }

  return undefined;
};

export const normalizeImportedRows = (rows = []) => {
  const records = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rawSource = readField(row, ['fuente', 'actividad', 'tipo', 'descripcion']);
    const rawAmount = readField(row, ['cantidad', 'consumo', 'valor']);
    const rawUnit = readField(row, ['unidad']);

    const source = SOURCE_ALIASES[normalizeText(rawSource)];
    const amount = Number(String(rawAmount ?? '').replace(',', '.'));
    const unit = normalizeUnit(rawUnit);

    if (!source) {
      errors.push({ row: rowNumber, message: 'Fuente no reconocida' });
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      errors.push({ row: rowNumber, message: 'Cantidad inválida' });
      return;
    }

    const config = SOURCE_CONFIG[source];

    if (unit !== config.unit) {
      errors.push({
        row: rowNumber,
        message: `La unidad de ${config.label} debe ser ${config.unit}`,
      });
      return;
    }

    records.push({
      row: rowNumber,
      source,
      label: config.label,
      amount,
      unit,
      scope: config.scope,
    });
  });

  return { records, errors };
};

export const tableRowsToObjects = (tableRows = []) => {
  const [headers, ...rows] = tableRows;

  if (!Array.isArray(headers) || headers.length === 0) {
    return [];
  }

  return rows
    .filter((row) =>
      row.some((cell) => cell !== null && String(cell).trim() !== '')
    )
    .map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [
          String(header ?? '').trim(),
          row[index],
        ])
      )
    );
};