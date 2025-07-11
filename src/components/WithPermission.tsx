"use client";

import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth.js';

interface WithPermissionProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function WithPermission({ permission, children, fallback = null }: WithPermissionProps) {
  const { hasPermission } = useAuth();
  
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

