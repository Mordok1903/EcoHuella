import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Registro exitoso. Revisa tu correo para verificar tu cuenta (o inicia sesión si el correo no requiere verificación en local).');
      }
    } catch (error) {
      setMessage(error.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
      <div className="card text-center">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Leaf color="var(--color-primary)" size={48} />
        </div>
        <h1 className="h3 mb-2">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h1>
        <p className="text-muted mb-2">Ingresa a EcoHuella Perú para gestionar tus mediciones.</p>
        
        {message && (
          <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', color: '#B45309', marginBottom: '1.5rem', fontWeight: '500' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="tu@correo.com"
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1.5rem' }}>
            {loading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>

        <p className="text-muted">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button 
            className="outline" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '1rem', border: 'none', textDecoration: 'underline' }}
            onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
