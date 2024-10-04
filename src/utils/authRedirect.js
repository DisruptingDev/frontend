// export const isAuthenticated = () => {
//     return !!localStorage.getItem("authToken"); // Verifica si hay un token de autenticación en localStorage
// };
export const isAuthenticated = () => {
    const authToken = localStorage.getItem("authToken");
    const loginDate = localStorage.getItem("loginDate");

    if (!authToken || !loginDate) {
        return false; // No hay token o fecha de login
    }

    const currentDate = new Date();
    const savedLoginDate = new Date(loginDate);

    // Verifica que la fecha de login no sea menor al día actual
    if (savedLoginDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
        localStorage.removeItem("authToken"); // Borra el token si la fecha es inválida
        localStorage.removeItem("loginDate"); // Borra la fecha
        return false;
    }

    return true; // Autenticado y la fecha es válida
};
