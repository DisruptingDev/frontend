"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [authState, setAuthState] = useState({
    user: null,
    loading: true,
    permissions: [],
    isSuperUser: false,
    permissionsLoaded: false, // Nuevo estado para controlar si los permisos se cargaron
  });
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Función para cargar los permisos del usuario
  const fetchPermissions = async (rolId, token) => {
    if (!rolId) {
      console.error("No RolID provided");
      return [];
    }
    try {
      const response = await fetch(
        `${apiUrl}/api/gestionusuarios/RolCopy/${rolId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Error al obtener permisos: ${response.status} - ${errorText}`
        );
        throw new Error("Error al obtener permisos");
      }

      const rolData = await response.json();
      console.log("Datos completos del rol:", rolData);

      if (!rolData.Permisos || !Array.isArray(rolData.Permisos)) {
        console.warn("Formato de permisos inválido en la respuesta");
        return [];
      }

      return rolData.Permisos.map((p) => ({
        ID: p.ID,
        Clave: p.Clave,
        Descripcion: p.Descripcion,
        SeccionID: p.SeccionID,
      }));
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return [];
    }
  };

  // Función para cargar el usuario desde el almacenamiento
  const loadUser = async () => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const loginDate =
        localStorage.getItem("loginDate") ||
        sessionStorage.getItem("loginDate");
      const sudo = localStorage.getItem("superUser") === "true";
      const rolId =
        localStorage.getItem("rolId") || sessionStorage.getItem("rolId");

      if (!token) {
        setAuthState((prev) => ({ ...prev, loading: false }));
        return;
      }

      // Verificar si el token ha expirado
      if (loginDate) {
        const loginTime = new Date(loginDate).getTime();
        const currentTime = new Date().getTime();
        const diffHours = (currentTime - loginTime) / (1000 * 60 * 60);

        if (diffHours > 12) {
          logout();
          return;
        }
      }

      const email = localStorage.getItem("correo");
      const username = localStorage.getItem("usuario");

      if (!email) {
        throw new Error("No se encontró información del usuario");
      }

      // Obtener permisos si hay rolId
      let permissions = [];
      if (rolId && token) {
        permissions = await fetchPermissions(rolId, token);
      }

      const userData = {
        email,
        username,
        isSuperUser: sudo,
        token,
        rolId,
      };

      setAuthState({
        user: userData,
        loading: false,
        permissions,
        isSuperUser: sudo,
        permissionsLoaded: true, // Marcamos que los permisos están cargados
      });
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: credentials.usuario,
          Password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error en la autenticación");
      }

      const result = await response.json();
      const currentDate = new Date().toISOString();

      // Limpiar almacenamiento previo
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("loginDate");
      sessionStorage.removeItem("loginDate");

      // Guardar según "remember me"
      if (remember) {
        localStorage.setItem("authToken", result.token);
        localStorage.setItem("loginDate", currentDate);
        localStorage.setItem("rolId", result.RolID);
      } else {
        sessionStorage.setItem("authToken", result.token);
        sessionStorage.setItem("rolId", result.RolID);
      }

      // Guardar datos adicionales
      localStorage.setItem("correo", credentials.usuario);
      const nombreUsuario = credentials.usuario.split("@")[0];
      localStorage.setItem("usuario", nombreUsuario);
      localStorage.setItem("superUser", result.sudo);

      // Establecer 'newUser' solo si no existe en sessionStorage
      if (sessionStorage.getItem("newUser") === null) {
        sessionStorage.setItem("newUser", "true");
      }

      // Obtener permisos
      const permissions = await fetchPermissions(result.RolID, result.token);

      const userData = {
        email: credentials.usuario,
        username: nombreUsuario,
        isSuperUser: result.sudo,
        token: result.token,
        rolId: result.RolID,
      };

      setAuthState({
        user: userData,
        loading: false,
        permissions: permissions,
        isSuperUser: result.sudo,
        permissionsLoaded: true,
      });

      if (sessionStorage.getItem("newUser") === null) {
        sessionStorage.setItem("newUser", "true");
      }

      // Redirigir según el tipo de usuario
      router.push(result.sudo ? "/Dashboard" : "/Home");

      return { success: true, isSuperUser: result.sudo };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Función de logout
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("loginDate");
    localStorage.removeItem("correo");
    localStorage.removeItem("usuario");
    localStorage.removeItem("superUser");
    localStorage.removeItem("rolId");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("rolId");

    setAuthState({
      user: null,
      loading: false,
      permissions: [],
      isSuperUser: false,
      permissionsLoaded: false,
    });

    router.push("/IniciaSesion");
  };

  // Verificar permisos
  const hasPermission = (permissionKey) => {
    if (authState.isSuperUser) return true;
    return authState.permissions.some((p) => p.Clave === permissionKey);
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
    permissionsLoaded: authState.permissionsLoaded, // Exportamos el nuevo estado
    login,
    logout,
    hasPermission,
    isAuthenticated,
    loadUser,
  };
}
