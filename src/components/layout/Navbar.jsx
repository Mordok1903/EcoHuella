import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, BarChart2, Home, User, LogOut, FileUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navStyles = {
    backgroundColor: 'var(--color-bg-card)',
    borderBottom: '1px solid var(--color-border)',
    padding: '1rem 0'
  };

  const containerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const logoStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--color-secondary)'
  };

  const menuStyles = {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center'
  };

  const linkStyles = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: location.pathname === path ? 'var(--color-primary)' : 'var(--color-text-main)',
    fontWeight: location.pathname === path ? '700' : '500',
    textDecoration: 'none',
    transition: 'color 0.2s'
  });

  return (
    <nav style={navStyles}>
      <div className="container" style={containerStyles}>
        <Link to="/" style={logoStyles}>
          <Leaf color="var(--color-primary)" size={28} />
          EcoHuella Perú
        </Link>
        
        <div style={menuStyles}>
          <Link to="/" style={linkStyles('/')}>
            <Home size={20} /> Inicio
          </Link>
          <Link to="/calculadora" style={linkStyles('/calculadora')}>
            <BarChart2 size={20} /> Calcular Huella
          </Link>
          <Link to="/importar" style={linkStyles('/importar')}>
            <FileUp size={20} /> Importar Datos
          </Link>
          <Link to="/dashboard" style={linkStyles('/dashboard')}>
            <User size={20} /> Mi Panel
          </Link>
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-primary-dark)' }}>
                {session.user.email}
              </span>
              <button className="outline" onClick={handleLogout} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <LogOut size={16} /> Salir
              </button>
            </div>
          ) : (
            <Link to="/auth">
              <button>Iniciar Sesión</button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
