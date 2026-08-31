import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(undefined);

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

  if (session === undefined) return <div className="container text-center mt-2" style={{ padding: '4rem 0' }}>Verificando credenciales...</div>;
  if (session === null) return <Navigate to="/auth" replace />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/calculadora" element={
            <ProtectedRoute>
              <Calculator />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
