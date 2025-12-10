"use client";

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

export function ProtectedRoute({ children, requiredPermissions = [] }: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/IniciaSesion');
      } else if (requiredPermissions.length > 0 && !requiredPermissions.some(p => hasPermission(p))) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, requiredPermissions, hasPermission, router]);

  if (loading || !user || (requiredPermissions.length > 0 && !requiredPermissions.some(p => hasPermission(p)))) {
    return <div>Loading...</div>; // O un spinner
  }

  return <>{children}</>;
}
