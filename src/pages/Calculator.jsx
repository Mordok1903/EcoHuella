import React, { useState } from 'react';
import { Factory, Zap, Truck, CheckCircle, BarChart3, ArrowRight, ArrowLeft } from 'lucide-react';

const Calculator = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombrePeriodo: '',
    anio: '2026',
    // Alcance 1
    gasolina: 0,
    diesel: 0,
    glp: 0,
    // Alcance 2
    electricidad: 0,
    // Alcance 3
    vuelos: 0,
    residuos: 0,
    papel: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularResultados = () => {
    // Factores de emisión aproximados (kg CO2eq)
    const factorGasolina = 2.31; // por litro
    const factorDiesel = 2.68; // por litro
    const factorGLP = 2.98; // por kg
    const factorElectricidad = 0.549; // por kWh (Red Perú)
    const factorVuelos = 0.255; // por km
    const factorResiduos = 0.572; // por kg

    const alcance1 = (formData.gasolina * factorGasolina) + (formData.diesel * factorDiesel) + (formData.glp * factorGLP);
    const alcance2 = (formData.electricidad * factorElectricidad);
    const alcance3 = (formData.vuelos * factorVuelos) + (formData.residuos * factorResiduos);
    
    // Convertir a toneladas (tCO2eq)
    return {
      a1: (alcance1 / 1000).toFixed(2),
      a2: (alcance2 / 1000).toFixed(2),
      a3: (alcance3 / 1000).toFixed(2),
      total: ((alcance1 + alcance2 + alcance3) / 1000).toFixed(2)
    };
  };

  const resultados = calcularResultados();

  const nextStep = () => setStep(prev => prev + 1);
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
              <button className="outline" onClick={prevStep}><ArrowLeft size={20} /> Anterior</button>
              <button onClick={nextStep}>Calcular Resultados <BarChart3 size={20} /></button>
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
                {resultados.total} <span style={{ fontSize: '1.5rem', fontWeight: '400' }}>tCO₂eq</span>
              </p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                <div style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>Alcance 1</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{resultados.a1}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>tCO₂eq</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                <div style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>Alcance 2</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{resultados.a2}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>tCO₂eq</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: '#F8FAFC' }}>
                <div style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>Alcance 3</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{resultados.a3}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>tCO₂eq</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="outline" onClick={() => setStep(1)}>Calcular de Nuevo</button>
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
