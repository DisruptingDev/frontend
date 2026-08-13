"use client";

export const onSuplantar = (token, nombre, grupoId, usuarioObj) => {
    console.log('Suplantando usuario:', nombre, 'Token:', token, 'GrupoID:', grupoId);
    
    // Backup de sesión de SuperAdmin
    const currentSuperUser = localStorage.getItem("superUser");
    const currentGrupoId = localStorage.getItem("grupo_id");
    const currentUsuario = localStorage.getItem("usuario");

    if (currentSuperUser !== null) localStorage.setItem("superUser_backup", currentSuperUser);
    if (currentGrupoId !== null) localStorage.setItem("grupo_id_backup", currentGrupoId);
    if (currentUsuario !== null) localStorage.setItem("usuario_backup", currentUsuario);

    const authToken = localStorage.getItem("authToken");
    const authTokenSession = sessionStorage.getItem("authToken");

    if (authTokenSession) {
        sessionStorage.setItem('authTokenSuperUser', authTokenSession);
        sessionStorage.setItem('authToken', token);
    }
    if (authToken) {
        localStorage.setItem('authTokenSuperUser', authToken);
        localStorage.setItem('authToken', token);
    }

    localStorage.setItem('usuarioSuplantado', nombre);
    localStorage.setItem('superUser', 'false'); // Se comporta como usuario regular durante suplantación
    
    if (grupoId) {
        localStorage.setItem('grupo_id', grupoId.toString());
        sessionStorage.setItem('grupo_id', grupoId.toString());
    }
    if (usuarioObj) {
        localStorage.setItem('usuario', typeof usuarioObj === 'string' ? usuarioObj : JSON.stringify(usuarioObj));
    }
    return true;
};