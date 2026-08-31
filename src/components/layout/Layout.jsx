import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '2rem 0' }}>
        {children}
      </main>
      <footer style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-text-light)', padding: '2rem 0', textAlign: 'center', marginTop: 'auto' }}>
        <div className="container">
          <p>© {new Date().getFullYear()} EcoHuella Perú. Herramienta de medición de huella de carbono.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
