"use client";
export const onSuplantar = (token, nombre) => {
    const authToken = localStorage.getItem("authToken");
    const authTokenSession = sessionStorage.getItem("authToken");
    const loginDate = localStorage.getItem("loginDate");
    // const currentDate = new Date();
    // const savedLoginDate = new Date(loginDate);
    console.log('Suplantando usuario:', nombre, token);
    if (authTokenSession) {
        sessionStorage.setItem('authTokenSuperUser', authTokenSession);
        sessionStorage.setItem('authToken', token);
        // sessionStorage.setItem('usuarioSuplantado', nombre);
        localStorage.setItem('usuarioSuplantado', nombre);
        return true
    }
    if (authToken) {
        localStorage.setItem('authTokenSuperUser', authToken);
        localStorage.setItem('authToken', token);
        localStorage.setItem('usuarioSuplantado', nombre);
        return true
    }
    return false
}