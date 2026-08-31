import React, { useState, useEffect } from 'react';
import { Factory, Zap, Truck, CheckCircle, BarChart3, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateEmissions } from '../services/emissionCalculator';

const Calculator = () => {
  // Inicializar estado desde localStorage si existe
  const getInitialState = (key, defaultValue) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  const [step, setStep] = useState(() => getInitialState('ecoHuella_step', 1));
  const [formData, setFormData] = useState(() => getInitialState('ecoHuella_formData', {
    nombrePeriodo: '',
    anio: '2026',
    gasolina: 0,
    diesel: 0,
    glp: 0,
    electricidad: 0,
    vuelos: 0,
    residuos: 0,
    papel: 0
  }));

  const [factores, setFactores] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Guardar en localStorage cada vez que cambien los datos o el paso
  useEffect(() => {
    localStorage.setItem('ecoHuella_step', JSON.stringify(step));
  }, [step]);

  useEffect(() => {
    localStorage.setItem('ecoHuella_formData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    // Cargar factores de emisión desde la base de datos
    const fetchFactores = async () => {
      const { data, error } = await supabase.from('factores_emision').select('*');
      if (data) {
        const factorMap = {};
        data.forEach(f => factorMap[f.fuente] = parseFloat(f.factor));
        setFactores(factorMap);
      }
    };
    fetchFactores();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const resultados = calculateEmissions(formData, factores);

  const guardarResultados = async () => {
    setIsSaving(true);

    // 1. Guardar en tabla calculos
    const { data: calculoData, error: err1 } = await supabase.from('calculos').insert([{
      nombre_periodo: formData.nombrePeriodo || 'Sin nombre',
      anio: formData.anio,
      total_emisiones: resultados.total
    }]).select();

    if (calculoData && calculoData.length > 0) {
      // 2. Guardar en tabla detalle
      await supabase.from('detalle_alcances').insert([{
        calculo_id: calculoData[0].id,
        alcance1: resultados.a1,
        alcance2: resultados.a2,
        alcance3: resultados.a3
      }]);
    }

    // Limpiar localStorage al guardar exitosamente
    localStorage.removeItem('ecoHuella_formData');
    localStorage.removeItem('ecoHuella_step');

    setIsSaving(false);
    setStep(5);
  };

  const calcularDeNuevo = () => {
    setFormData({
      nombrePeriodo: '', anio: '2026', gasolina: 0, diesel: 0, glp: 0, electricidad: 0, vuelos: 0, residuos: 0, papel: 0
    });
    setStep(1);
  };

  const nextStep = () => {
    if (step === 4) {
      guardarResultados();
    } else {
      setStep(prev => prev + 1);
    }
  };
  const prevStep = () => setStep(prev => prev - 1);

  const StepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '4px', backgroundColor: 'var(--color-border)', zIndex: 0, transform: 'translateY(-50%)' }}></div>
      <div style={{ position: 'absolute', top: '24px', left: '0', width: `${((step - 1) / 4) * 100}%`, height: '4px', backgroundColor: 'var(--color-primary)', zIndex: 0, transform: 'translateY(-50%)', transition: 'width 0.3s' }}></div>

      {[
        { id: 1, label: 'Inicio', icon: <CheckCircle size={20} /> },
        { id: 2, label: 'Alcance 1', icon: <Factory size={20} /> },
        { id: 3, label: 'Alcance 2', icon: <Zap size={20} /> },
        { id: 4, label: 'Alcance 3', icon: <Truck size={20} /> },
        { id: 5, label: 'Resultados', icon: <BarChart3 size={20} /> }
      ].map((s) => (
        <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.5rem', width: '20%' }}>
          <div style={{
            width: '48px', height: '48px',
            backgroundColor: step >= s.id ? 'var(--color-primary)' : 'var(--color-bg-card)',
            border: step >= s.id ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
            color: step >= s.id ? 'white' : 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s'
          }}>
            {s.icon}
          </div>
          <span style={{ fontWeight: step >= s.id ? '700' : '500', color: step >= s.id ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>{s.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1 className="h2 text-center mb-2">Medición de Huella de Carbono</h1>

      <StepIndicator />

      <div className="card">
        {step === 1 && (
          <div className="fade-in">
            <h2 className="h3">1. Datos Generales del Período</h2>
            <p className="text-muted mb-2">Defina los parámetros básicos de su medición para poder identificarla luego en su historial.</p>

            <div className="grid" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Nombre del Período / Proyecto</label>
                <input type="text" name="nombrePeriodo" value={formData.nombrePeriodo} onChange={handleChange} placeholder="Ej. Medición Anual 2026" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Año de Medición</label>
                <select name="anio" value={formData.anio} onChange={handleChange}>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={nextStep}>Siguiente Paso <ArrowRight size={20} /></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 className="h3">2. Alcance 1: Emisiones Directas</h2>
            <p className="text-muted mb-2">Ingrese el consumo de combustibles en instalaciones o vehículos de su propiedad durante el año seleccionado.</p>

            <div className="grid" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Gasolina (Litros)</label>
                <input type="number" min="0" name="gasolina" value={formData.gasolina} onChange={handleChange} placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Diésel (Litros)</label>
                <input type="number" min="0" name="diesel" value={formData.diesel} onChange={handleChange} placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>GLP (Kilogramos)</label>
                <input type="number" min="0" name="glp" value={formData.glp} onChange={handleChange} placeholder="0" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="outline" onClick={prevStep}><ArrowLeft size={20} /> Anterior</button>
              <button onClick={nextStep}>Siguiente Paso <ArrowRight size={20} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h2 className="h3">3. Alcance 2: Emisiones Indirectas</h2>
            <p className="text-muted mb-2">Ingrese el consumo total de electricidad de la red pública. (Basado en el Factor de Emisión del SEIN de Perú).</p>

            <div className="grid" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Electricidad Consumida (kWh)</label>
                <input type="number" min="0" name="electricidad" value={formData.electricidad} onChange={handleChange} placeholder="0" />
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
                  Puede encontrar este dato en la suma de sus recibos de luz (Luz del Sur, Enel, etc.) de todo el año.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="outline" onClick={prevStep}><ArrowLeft size={20} /> Anterior</button>
              <button onClick={nextStep}>Siguiente Paso <ArrowRight size={20} /></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="fade-in">
            <h2 className="h3">4. Alcance 3: Otras Emisiones Indirectas</h2>
            <p className="text-muted mb-2">Ingrese datos de actividades de terceros (viajes de negocio, gestión de residuos, etc).</p>

            <div className="grid" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Vuelos Aéreos (Kilómetros recorridos)</label>
                <input type="number" min="0" name="vuelos" value={formData.vuelos} onChange={handleChange} placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Residuos Sólidos Generados (Kilogramos)</label>
                <input type="number" min="0" name="residuos" value={formData.residuos} onChange={handleChange} placeholder="0" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="outline" onClick={prevStep} disabled={isSaving}><ArrowLeft size={20} /> Anterior</button>
              <button onClick={nextStep} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Calcular Resultados'} <BarChart3 size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="fade-in text-center">
            <div style={{ display: 'inline-block', backgroundColor: '#D1FAE5', color: 'var(--color-primary-dark)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <CheckCircle size={48} />
            </div>
            <h2 className="h2 mb-2">¡Cálculo Completado!</h2>
            <p className="text-muted mb-2">Su Huella de Carbono para {formData.nombrePeriodo || 'el período'} ha sido calculada exitosamente.</p>

            <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '2rem', border: '1px solid var(--color-border)', margin: '2rem 0' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Total Emisiones</h3>
              <p style={{ fontSize: '4rem', fontWeight: '700', color: 'var(--color-secondary)', lineHeight: 1 }}>
                {resultados.total.toFixed(2)} <span style={{ fontSize: '1.5rem', fontWeight: '400' }}>tCO₂eq</span>
              </p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                <div style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>Alcance 1</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{resultados.a1.toFixed(2)}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>tCO₂eq</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                <div style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>Alcance 2</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{resultados.a2.toFixed(2)}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>tCO₂eq</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                <div style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>Alcance 3</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{resultados.a3.toFixed(2)}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>tCO₂eq</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="outline" onClick={calcularDeNuevo}>Calcular de Nuevo</button>
              <button onClick={() => window.location.href='/dashboard'}>Ir a Mi Panel</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .fade-in {
          animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Calculator;
