// export const isAuthenticated = () => {
//     return !!localStorage.getItem("authToken"); // Verifica si hay un token de autenticación en localStorage
// };
"use client";
export const isAuthenticated = () => {
    if (typeof window === 'undefined') {
        // Si estamos en el servidor, no intentes acceder a localStorage o sessionStorage
        return false;
    }
    const authToken = localStorage.getItem("authToken");
    const authTokenSession = sessionStorage.getItem("authToken");
    const loginDate = localStorage.getItem("loginDate");

    const currentDate = new Date();
    const savedLoginDate = new Date(loginDate);
    // console.log("authTokenSession", authTokenSession);
    if (authTokenSession) {
        // console.log("authTokenSession", authTokenSession);
      
        return authTokenSession
    }

    if (authToken && loginDate) {
        console.log("authToken", authToken);
        if (savedLoginDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
            localStorage.removeItem("authToken"); // Borra el token si la fecha es inválida
            localStorage.removeItem("loginDate"); // Borra la fecha
            return false;
        }
        else {
            return authToken;
        }
    }

};
