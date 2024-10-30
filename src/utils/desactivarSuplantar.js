"use client";

export const offSuplantar = () => {
    const authToken = localStorage.getItem("authTokenSuperUser");
    const authTokenSession = sessionStorage.getItem("authTokenSuperUser");
    const usuarioSuplantado = localStorage.getItem("usuarioSuplantado");
    console.log('Desactivando suplantación:', usuarioSuplantado);
    if (authTokenSession) {
        sessionStorage.setItem('authToken', authTokenSession);
        sessionStorage.removeItem('authTokenSuperUser');
        // sessionStorage.removeItem('usuarioSuplantado');
        localStorage.removeItem('usuarioSuplantado');
        return true
    }
    if (authToken) {
        localStorage.setItem('authToken', authTokenSession);
        localStorage.removeItem('authTokenSuperUser');
        localStorage.removeItem('usuarioSuplantado');
        return true
    }
    return false
}