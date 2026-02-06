const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

async function refresh() {
    const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=1`, {
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const data = await res.json();
    
    if (data.length > 0) {
        const user = data[0];
        document.getElementById('dev-name').innerText = user.usuario_id;
        document.getElementById('target-id').value = user.usuario_id;
        
        const monitor = document.getElementById('live-monitor');
        if (monitor.src !== user.url_actual) monitor.src = user.url_actual;
    }
}

async function enviar(tipo) {
    const user = document.getElementById('target-id').value;
    const mins = document.getElementById('mute-mins').value || 0;
    
    // Limpiar órdenes anteriores
    await fetch(`${SB_URL}/rest/v1/ordenes?usuario_id=eq.${user}`, {
        method: 'DELETE',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });

    // Nueva orden
    await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user, orden: tipo, minutos: mins, activa: true })
    });
    alert("Comando " + tipo + " ejecutado.");
}

async function bloquearLink() {
    const url = document.getElementById('bad-link').value;
    await fetch(`${SB_URL}/rest/v1/links_bloqueados`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    });
    alert("URL Bloqueada con éxito.");
}

setInterval(refresh, 3000);
