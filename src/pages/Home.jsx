import React from 'react';
import { ArrowRight, Globe, TrendingDown, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container">
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '4rem 0', borderBottom: '1px solid var(--color-border)' }}>
        <h1 className="h1">Mide. Reduce. Neutraliza.</h1>
        <p className="h3 text-muted" style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
          Únete a EcoHuella Perú, la plataforma profesional para la gestión de emisiones de Gases de Efecto Invernadero (GEI) para personas y empresas.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/calculadora">
            <button style={{ padding: '1rem 2rem', fontSize: '1.25rem' }}>
              Calcular mi huella <ArrowRight size={24} />
            </button>
          </Link>
          <button className="outline" style={{ padding: '1rem 2rem', fontSize: '1.25rem' }}>
            ¿Cómo funciona?
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 0' }}>
        <h2 className="h2 text-center">Una plataforma completa para tu acción climática</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
          <div className="card text-center">
            <div style={{ backgroundColor: '#E0F2FE', width: '64px', height: '64px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe color="var(--color-secondary)" size={32} />
            </div>
            <h3 className="h3">Medición Precisa</h3>
            <p className="text-muted">Calcula tus emisiones en los Alcances 1, 2 y 3 utilizando los últimos factores de emisión del MINAM e IPCC.</p>
          </div>
          
          <div className="card text-center">
            <div style={{ backgroundColor: '#D1FAE5', width: '64px', height: '64px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown color="var(--color-primary)" size={32} />
            </div>
            <h3 className="h3">Trazabilidad Total</h3>
            <p className="text-muted">Guarda tu historial anual. Compara tus avances y visualiza en gráficos tu progreso hacia la descarbonización.</p>
          </div>

          <div className="card text-center">
            <div style={{ backgroundColor: '#FEF3C7', width: '64px', height: '64px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award color="#D97706" size={32} />
            </div>
            <h3 className="h3">Reporte Profesional</h3>
            <p className="text-muted">Genera reportes formales descargables en PDF listos para auditorías, verificación o presentación de credenciales.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
