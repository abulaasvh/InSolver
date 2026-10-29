import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { InstitutionsListPage } from './pages/InstitutionsListPage';
import { InstitutionPage } from './pages/InstitutionPage';
import { OverlapsPage } from './pages/OverlapsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ImportPage } from './pages/ImportPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center text-slate-400">
        Loading InSolver session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/cases" replace />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <CasesPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <CaseDetailPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/institutions"
        element={
          <ProtectedRoute>
            <InstitutionsListPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/institutions/:id"
        element={
          <ProtectedRoute>
            <InstitutionPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/overlaps"
        element={
          <ProtectedRoute>
            <OverlapsPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/import"
        element={
          <ProtectedRoute>
            <ImportPage />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/cases" replace />} />
    </Routes>
  );
}

export default App;
