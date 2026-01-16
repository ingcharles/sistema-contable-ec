
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './modules/auth/context/AuthContext';
import { LoginPage } from './modules/auth/ui/LoginPage';

// Importando Módulos
import { DashboardPage } from './modules/dashboard/ui/DashboardPage';
import { FacturacionPage } from './modules/facturacion/ui/FacturacionPage';
import { ContabilidadPage } from './modules/contabilidad/ui/ContabilidadPage';
import { ComprasPage } from './modules/compras/ui/ComprasPage';
import { ImpuestosPage } from './modules/impuestos/ui/ImpuestosPage';
import { NominaPage } from './modules/nomina/ui/NominaPage';
import { ConfiguracionPage } from './modules/configuracion/ui/ConfiguracionPage';
import { BancosPage } from './modules/bancos/ui/BancosPage';
import { InventarioPage } from './modules/inventario/ui/InventarioPage';
import { CarteraPage } from './modules/cartera/ui/CarteraPage';
import { ReportesPage } from './modules/reportes/ui/ReportesPage';
import { DirectorioPage } from './modules/directorio/ui/DirectorioPage';
import { ActivosPage } from './modules/activos/ui/ActivosPage';
import { BuzonPage } from './modules/buzon/ui/BuzonPage';
import { AuditoriaPage } from './modules/seguridad/ui/AuditoriaPage';
import { CajaChicaPage } from './modules/cajachica/ui/CajaChicaPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-400">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="facturacion" element={<FacturacionPage />} />
            <Route path="contabilidad" element={<ContabilidadPage />} />
            <Route path="compras" element={<ComprasPage />} />
            <Route path="buzon" element={<BuzonPage />} />
            <Route path="directorio" element={<DirectorioPage />} />
            <Route path="cartera" element={<CarteraPage />} />
            <Route path="impuestos" element={<ImpuestosPage />} />
            <Route path="nomina" element={<NominaPage />} />
            <Route path="bancos" element={<BancosPage />} />
            <Route path="inventario" element={<InventarioPage />} />
            <Route path="activos" element={<ActivosPage />} />
            <Route path="caja-chica" element={<CajaChicaPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="auditoria" element={<AuditoriaPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
