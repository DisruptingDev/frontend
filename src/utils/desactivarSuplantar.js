"use client";

export const offSuplantar = () => {
    const authToken = localStorage.getItem("authTokenSuperUser");
    const authTokenSession = sessionStorage.getItem("authTokenSuperUser");
    const usuarioSuplantado = localStorage.getItem("usuarioSuplantado");
    console.log('Desactivando suplantación:', usuarioSuplantado);

    const grupoIdBackup = localStorage.getItem("grupo_id_backup");
    const usuarioBackup = localStorage.getItem("usuario_backup");

    localStorage.setItem("superUser", "true");

    if (grupoIdBackup !== null) {
        localStorage.setItem("grupo_id", grupoIdBackup);
        sessionStorage.setItem("grupo_id", grupoIdBackup);
        localStorage.removeItem("grupo_id_backup");
    } else {
        localStorage.removeItem("grupo_id");
        sessionStorage.removeItem("grupo_id");
    }

    if (usuarioBackup !== null) {
        localStorage.setItem("usuario", usuarioBackup);
        localStorage.removeItem("usuario_backup");
    }

    if (authTokenSession) {
        sessionStorage.setItem('authToken', authTokenSession);
        sessionStorage.removeItem('authTokenSuperUser');
    }
    if (authToken) {
        localStorage.setItem('authToken', authToken);
        localStorage.removeItem('authTokenSuperUser');
    }
    localStorage.removeItem('usuarioSuplantado');
    return true;
};