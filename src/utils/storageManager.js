"use client";

/**
 * Claves de almacenamiento utilizadas por la aplicación
 */
const AUTH_KEYS = [
    'authToken',
    'authTokenSuperUser',
    'grupo_id',
    'grupo_id_backup',
    'usuario',
    'usuario_backup',
    'usuarioSuplantado',
    'superUser',
    'BOD',
    'newUser',
    'emisor_id_predeterminado'
];

/**
 * Limpia por completo todas las claves de autenticación y suplantación del almacenamiento.
 * Debe ejecutarse al cerrar sesión o antes de registrar un nuevo inicio de sesión.
 */
export function clearAuthStorage() {
    if (typeof window === 'undefined') return;

    AUTH_KEYS.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

/**
 * Obtiene el contexto activo de autenticación y suplantación del usuario.
 */
export function getActiveAuthContext() {
    if (typeof window === 'undefined') {
        return { token: '', grupoId: '', isSuplantando: false, isSuperUser: false, usuario: null };
    }

    const isSuplantando = Boolean(localStorage.getItem('usuarioSuplantado'));
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
    
    let usuarioObj = null;
    try {
        const rawUser = localStorage.getItem('usuario');
        if (rawUser) usuarioObj = JSON.parse(rawUser);
    } catch (e) {}

    let grupoId = localStorage.getItem('grupo_id') || sessionStorage.getItem('grupo_id') || usuarioObj?.grupo_id || '';
    if (grupoId === 'undefined' || grupoId === 'null') grupoId = '';

    // Si está suplantando, el flag de superusuario se desactiva para las peticiones activas
    const isSuperUser = !isSuplantando && (localStorage.getItem('superUser') === 'true' || localStorage.getItem('BOD') === 'true');

    return {
        token,
        grupoId: grupoId.toString(),
        isSuplantando,
        isSuperUser,
        usuario: usuarioObj
    };
}
