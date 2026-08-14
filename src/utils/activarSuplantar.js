"use client";

export const onSuplantar = (token, nombre, grupoId, usuarioObj) => {
    console.log('Suplantando usuario:', nombre, 'Token:', token, 'GrupoID:', grupoId);
    
    // Backup del grupo_id original del SuperAdmin
    const currentGrupoId = localStorage.getItem("grupo_id");
    const currentUsuario = localStorage.getItem("usuario");

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
    // Mantener superUser en true para conservar el menú lateral completo de navegación
    localStorage.setItem('superUser', 'true');

    // Intentar extraer el grupo_id del token JWT si no viene en los parámetros
    let finalGrupoId = grupoId;
    if ((!finalGrupoId || finalGrupoId === 'undefined' || finalGrupoId === 'null') && token) {
        try {
            const payloadStr = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadStr);
            finalGrupoId = payload.grupo_id || payload.grupoId || payload.GrupoID || '';
        } catch (e) {
            console.error('Error decodificando token en suplantación:', e);
        }
    }

    if (finalGrupoId && finalGrupoId !== 'undefined' && finalGrupoId !== 'null') {
        localStorage.setItem('grupo_id', finalGrupoId.toString());
        sessionStorage.setItem('grupo_id', finalGrupoId.toString());
    } else {
        localStorage.removeItem('grupo_id');
        sessionStorage.removeItem('grupo_id');
    }

    const updatedUser = usuarioObj ? {
        ...usuarioObj,
        grupo_id: finalGrupoId || usuarioObj.grupo_id || ''
    } : { nombre, grupo_id: finalGrupoId };

    localStorage.setItem('usuario', JSON.stringify(updatedUser));
    return true;
};