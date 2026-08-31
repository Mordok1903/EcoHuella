import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FileText, Download, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const [calculos, setCalculos] = React.useState([]);
  const [detalles, setDetalles] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      // 1. Obtener los cálculos
      const { data: calcData } = await supabase
        .from('calculos')
        .select('*')
        .order('fecha_creacion', { ascending: false });
        
      if (calcData && calcData.length > 0) {
        setCalculos(calcData);
        // 2. Obtener el detalle del último cálculo para el gráfico
        const ultimoId = calcData[0].id;
        const { data: detData } = await supabase
          .from('detalle_alcances')
          .select('*')
          .eq('calculo_id', ultimoId)
          .single();
          
        if (detData) setDetalles(detData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const hasData = calculos.length > 0;
  const ultimoCalculo = hasData ? calculos[0] : null;
  
  const barData = {
    labels: ['Alcance 1', 'Alcance 2', 'Alcance 3'],
    datasets: [
      {
        label: 'Emisiones (tCO₂eq)',
        data: detalles ? [detalles.alcance1, detalles.alcance2, detalles.alcance3] : [0,0,0],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#059669',
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: ['Alcance 1', 'Alcance 2', 'Alcance 3'],
    datasets: [
      {
        data: detalles ? [detalles.alcance1, detalles.alcance2, detalles.alcance3] : [0,0,0],
        backgroundColor: [
          '#0EA5E9', // Azul
          '#10B981', // Verde
          '#F59E0B'  // Naranja
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  const exportToPDF = () => {
    if (!ultimoCalculo) return alert('No hay datos para exportar.');
    
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Certificado de Medición - EcoHuella Perú', 20, 20);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período reportado: ${ultimoCalculo.nombre_periodo}`, 20, 35);
    doc.text(`Fecha de emisión: ${new Date(ultimoCalculo.fecha_creacion).toLocaleDateString()}`, 20, 45);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Emisiones: ${ultimoCalculo.total_emisiones} tCO2eq`, 20, 65);
    
    if (detalles) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`- Alcance 1 (Emisiones Directas): ${detalles.alcance1.toFixed(2)} tCO2eq`, 20, 80);
      doc.text(`- Alcance 2 (Energía Adquirida): ${detalles.alcance2.toFixed(2)} tCO2eq`, 20, 90);
      doc.text(`- Alcance 3 (Otras Indirectas): ${detalles.alcance3.toFixed(2)} tCO2eq`, 20, 100);
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Este documento fue generado por la plataforma EcoHuella Perú.', 20, 280);
    
    doc.save(`EcoHuella_Reporte_${ultimoCalculo.anio}.pdf`);
  };

  if (loading) return <div className="container text-center mt-2">Cargando datos...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="h2" style={{ margin: 0 }}>Mi Panel de Control</h1>
          <p className="text-muted">Resumen del período: {ultimoCalculo ? ultimoCalculo.nombre_periodo : 'Ninguno'}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="outline" onClick={exportToPDF} disabled={!hasData}>
            <Download size={20} /> Exportar PDF
          </button>
          <Link to="/calculadora">
            <button><Plus size={20} /> Nuevo Cálculo</button>
          </Link>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>Emisiones Totales</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 }}>{ultimoCalculo ? ultimoCalculo.total_emisiones : '0.00'} <span style={{ fontSize: '1.25rem', fontWeight: '400' }}>tCO₂eq</span></p>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Cálculos Realizados</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-secondary)' }}>{calculos.length}</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>históricos guardados</p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Equivalencia (Aprox)</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-secondary)' }}>{ultimoCalculo ? Math.round(ultimoCalculo.total_emisiones * 46) : 0} árboles</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>necesarios para absorber esto</p>
        </div>
      </div>

      {hasData ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 className="h3 mb-2">Emisiones por Alcance</h3>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>
          <div className="card">
            <h3 className="h3 mb-2">Desglose por Fuente</h3>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={chartOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <h3 className="h3">Aún no hay datos para mostrar</h3>
          <p className="text-muted mb-2">Realice su primer cálculo de huella de carbono para ver sus estadísticas detalladas aquí.</p>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="h3" style={{ margin: 0 }}>Historial de Mediciones</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '1rem' }}>Período</th>
                <th style={{ padding: '1rem' }}>Fecha</th>
                <th style={{ padding: '1rem' }}>Alcance 1</th>
                <th style={{ padding: '1rem' }}>Alcance 2</th>
                <th style={{ padding: '1rem' }}>Alcance 3</th>
                <th style={{ padding: '1rem' }}>Total (tCO₂eq)</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {calculos.map((calc) => (
                <tr key={calc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>{calc.nombre_periodo}</td>
                  <td style={{ padding: '1rem' }}>{new Date(calc.fecha_creacion).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>-</td>
                  <td style={{ padding: '1rem' }}>-</td>
                  <td style={{ padding: '1rem' }}>-</td>
                  <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--color-primary-dark)' }}>{calc.total_emisiones}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button className="outline" style={{ padding: '0.5rem' }} title="Ver Reporte">
                      <FileText size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
