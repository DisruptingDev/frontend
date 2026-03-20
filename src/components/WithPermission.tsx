"use client";

import { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth.js";

interface WithPermissionProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function WithPermission({
  permission,
  children,
  fallback = null,
}: WithPermissionProps) {
  const { hasPermission, permissionsLoaded, isSuperUser } = useAuth();

  // Evita renderizar antes de tener permisos
  if (!permissionsLoaded) {
    return null; // o un loader si quieres
  }

  // SuperUser bypass
  if (isSuperUser || hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
