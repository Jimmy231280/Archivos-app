import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { session, profile, loading, debeCambiarPassword } = useAuth();

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center text-sm text-gray-500">Cargando…</div>;
  }
  if (!session) return <Navigate to="/login" replace />;
  if (profile && !profile.is_active) return <Navigate to="/login" replace />;
  if (debeCambiarPassword) return <Navigate to="/cambiar-password" replace />;
  if (adminOnly && profile?.role !== "admin") return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}
