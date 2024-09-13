export const isAuthenticated = () => {
    return !!localStorage.getItem("authToken"); // Verifica si hay un token de autenticación en localStorage
};