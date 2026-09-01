import React from 'react';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file/browser';
import { AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import {
  normalizeImportedRows,
  tableRowsToObjects,
} from '../services/importNormalizer';
import { useNavigate } from 'react-router-dom';

const SmartImport = () => {
  const navigate = useNavigate();
  const [fileName, setFileName] = React.useState('');
  const [records, setRecords] = React.useState([]);
  const [errors, setErrors] = React.useState([]);
  const [isReading, setIsReading] = React.useState(false);

  const applyRows = (data, parsingErrors = []) => {
    const normalized = normalizeImportedRows(data);
    const fileErrors = parsingErrors.map((error) => ({
      row: (error.row ?? 0) + 2,
      message: error.message,
    }));

    setRecords(normalized.records);
    setErrors([...fileErrors, ...normalized.errors]);
    setIsReading(false);
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setRecords([]);
    setErrors([]);
    setIsReading(true);

    if (file.name.toLowerCase().endsWith('.xlsx')) {
      try {
        const tableRows = await readXlsxFile(file);
        applyRows(tableRowsToObjects(tableRows));
      } catch (error) {
        setErrors([{ row: '-', message: error.message }]);
        setIsReading(false);
      }

      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors: parseErrors }) => {
        applyRows(data, parseErrors);
      },
      error: (error) => {
        setErrors([{ row: '-', message: error.message }]);
        setIsReading(false);
      },
    });
  };

  const handleUseData = () => {
    const importedData = records.reduce((totals, record) => {
      totals[record.source] = (totals[record.source] || 0) + record.amount;
      return totals;
    }, {});

    navigate('/calculadora', {
      state: { importedData },
    });
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h2">Importar datos ambientales</h1>
        <p className="text-muted">
          Carga un archivo CSV o Excel para detectar, validar y clasificar tus consumos
          antes de calcular la huella de carbono.
        </p>
      </div>

      <section className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>1. Selecciona un archivo CSV o Excel</h2>
        <p className="text-muted">
          Debe contener las columnas <strong>fuente</strong>,{' '}
          <strong>cantidad</strong> y <strong>unidad</strong>.
        </p>

        <label
          htmlFor="csv-file"
          className="outline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
          }}
        >
          <Upload size={18} />
          Seleccionar archivo
        </label>

        <input
          id="csv-file"
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        {fileName && (
          <p style={{ marginBottom: 0 }}>
            Archivo: <strong>{fileName}</strong>
          </p>
        )}
      </section>

      {isReading && <p>Procesando archivo...</p>}

      {records.length > 0 && (
        <section className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle color="var(--color-primary)" />
            {records.length} registros válidos
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fila</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fuente</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Cantidad</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Unidad</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Alcance</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.row}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td style={{ padding: '0.75rem' }}>{record.row}</td>
                    <td style={{ padding: '0.75rem' }}>{record.label}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {record.amount}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{record.unit}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {record.scope}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleUseData}
            style={{ marginTop: '1.5rem' }}
          >
            Usar datos en la calculadora
          </button>
        </section>
      )}

      {errors.length > 0 && (
        <section
          className="card"
          style={{ padding: '2rem', borderColor: '#f59e0b' }}
        >
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle color="#f59e0b" />
            {errors.length} filas necesitan revisión
          </h2>

          <ul>
            {errors.map((error, index) => (
              <li key={`${error.row}-${index}`}>
                Fila {error.row}: {error.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};



export default SmartImport;
