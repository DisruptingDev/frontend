"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [authState, setAuthState] = useState({
    user: null,
    loading: true,
    permissions: [],
    isSuperUser: false
  });
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Función para cargar los permisos del usuario
  const fetchPermissions = async (rolId, token) => {
    try {
      const response = await fetch(`${apiUrl}/api/gestionusuarios/Rol/${rolId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener permisos');
      }

      const rolData = await response.json();
      return rolData.Permisos?.map(p => ({
        Clave: p.Clave,
        Descripcion: p.Descripcion
      })) || [];
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return [];
    }
  };

  // Función para cargar el usuario desde el almacenamiento
  const loadUser = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const loginDate = localStorage.getItem('loginDate') || sessionStorage.getItem('loginDate');
      const sudo = localStorage.getItem('superUser') === 'true';

      if (!token) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }

      // Verificar si el token ha expirado (opcional)
      if (loginDate) {
        const loginTime = new Date(loginDate).getTime();
        const currentTime = new Date().getTime();
        const diffHours = (currentTime - loginTime) / (1000 * 60 * 60);
        
        // Si han pasado más de 12 horas, cerrar sesión (ajustar según necesidad)
        if (diffHours > 12) {
          logout();
          return;
        }
      }

      // Obtener el RolID del token (podrías decodificarlo si lo necesitas)
      // En tu caso, parece que el RolID viene en la respuesta del login
      // así que lo guardaremos en el estado inicial

      const email = localStorage.getItem('correo');
      const username = localStorage.getItem('usuario');

      if (!email) {
        throw new Error('No se encontró información del usuario');
      }

      // Aquí podrías hacer una verificación adicional del token con el backend
      // si lo consideras necesario

      const userData = {
        email,
        username,
        isSuperUser: sudo,
        token
      };

      setAuthState(prev => ({
        ...prev,
        user: userData,
        loading: false,
        isSuperUser: sudo
      }));

    } catch (error) {
      console.error("Error loading user:", error);
      logout();
    }
  };

  // Efecto para cargar el usuario al montar el componente
  useEffect(() => {
    loadUser();
  }, []);

  // Función de login
  const login = async (credentials, remember) => {
    try {
      const response = await fetch(`${apiUrl}/api/login/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Email: credentials.usuario, // Ajustado para coincidir con tu formulario
          Password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error en la autenticación');
      }

      const result = await response.json();
      const currentDate = new Date().toISOString();

      // Limpiar almacenamiento previo
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('loginDate');
      sessionStorage.removeItem('loginDate');

      // Guardar según "remember me"
      if (remember) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('loginDate', currentDate);
      } else {
        sessionStorage.setItem('authToken', result.token);
      }

      // Guardar datos adicionales
      localStorage.setItem('correo', credentials.usuario);
      const nombreUsuario = credentials.usuario.split('@')[0];
      localStorage.setItem('usuario', nombreUsuario);
      localStorage.setItem('superUser', result.sudo);

      // Obtener permisos
      const permissions = await fetchPermissions(result.RolID, result.token);

      const userData = {
        email: credentials.usuario,
        username: nombreUsuario,
        isSuperUser: result.sudo,
        token: result.token,
        rolId: result.RolID
      };

      setAuthState({
        user: userData,
        loading: false,
        permissions,
        isSuperUser: result.sudo
      });

      // Redirigir según el tipo de usuario
      router.push(result.sudo ? '/Dashboard' : '/Home');

      return { success: true, isSuperUser: result.sudo };

    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Función de logout
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('loginDate');
    localStorage.removeItem('correo');
    localStorage.removeItem('usuario');
    localStorage.removeItem('superUser');
    sessionStorage.removeItem('authToken');
    
    setAuthState({
      user: null,
      loading: false,
      permissions: [],
      isSuperUser: false
    });
    
    router.push('/IniciaSesion');
  };

  // Verificar permisos
  const hasPermission = (permissionKey) => {
    if (authState.isSuperUser) return true;
    return authState.permissions.some(p => p.Clave === permissionKey);
  };

  // Verificar si está autenticado
  const isAuthenticated = () => {
    return !!authState.user;
  };

  return {
    user: authState.user,
    loading: authState.loading,
    isSuperUser: authState.isSuperUser,
    permissions: authState.permissions,
    login,
    logout,
    hasPermission,
    isAuthenticated,
    loadUser
  };
}
