const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "TU_ANON_KEY_DE_SUPABASE"; // La misma que usaste en el navegador

// 1. Cargar Logs de actividad
async function fetchLogs() {
    const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc`, {
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const data = await res.json();
    const body = document.getElementById('logs-body');
    
    body.innerHTML = data.map(log => `
        <tr>
            <td>${log.usuario_id}</td>
            <td>${log.accion}</td>
            <td style="color:#00d4ff">${log.contenido}</td>
            <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
        </tr>
    `).join('');

    // Actualizar pantalla en directo con la última URL visitada
    if(data[0]) {
        document.getElementById('live-monitor').innerHTML = 
            `<small>Viendo ahora:</small><br>${data[0].url_actual}`;
    }
}

// 2. Enviar órdenes de bloqueo (Lazarus Mode)
async function enviarOrden(comando) {
    const user = document.getElementById('target-user').value;
    await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: { 
            'apikey': SB_KEY, 
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ usuario_id: user, orden: comando, activa: true })
    });
    alert("Orden " + comando + " enviada con éxito.");
}

setInterval(fetchLogs, 2000); // Actualiza cada 2 segundos
