import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Login from "./pages/Login";
import CambiarPassword from "./pages/CambiarPassword";
import Inicio from "./pages/Inicio";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import Prestamos from "./pages/Prestamos";
import NuevoPrestamo from "./pages/NuevoPrestamo";
import Devoluciones from "./pages/Devoluciones";
import Vencimientos from "./pages/Vencimientos";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cambiar-password" element={<CambiarPassword />} />

          <Route path="/inicio" element={<ProtectedRoute><Inicio /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />

          <Route path="/prestamos" element={<ProtectedRoute adminOnly><Prestamos /></ProtectedRoute>} />
          <Route path="/prestamos/nuevo" element={<ProtectedRoute adminOnly><NuevoPrestamo /></ProtectedRoute>} />
          <Route path="/devoluciones" element={<ProtectedRoute adminOnly><Devoluciones /></ProtectedRoute>} />
          <Route path="/vencimientos" element={<ProtectedRoute adminOnly><Vencimientos /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute adminOnly><Reportes /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute adminOnly><Usuarios /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
