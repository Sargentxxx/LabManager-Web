// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
    // ⚠️ REEMPLAZAR CON TUS DATOS DE FIREBASE
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO_ID",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Initialize Firebase if config is present
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.error("Firebase no configurado aún", e);
}

// --- AUTH MOCK (Seguridad Básica para frontend) ---
const AUTH_KEY = 'labmanager_admin_auth';
const MASTER_PASS = 'admin123'; // ⚠️ CAMBIAR ESTO

function checkAuth() {
    const input = document.getElementById('password-input').value;
    if (input === MASTER_PASS) {
        localStorage.setItem(AUTH_KEY, 'true');
        showDashboard();
    } else {
        document.getElementById('error-msg').style.display = 'block';
    }
}

function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadData();
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    location.reload();
}

// Check session on load
if (localStorage.getItem(AUTH_KEY) === 'true') {
    showDashboard();
}

// --- DATA LOADING ---
function loadData() {
    if (!db) {
        alert("¡Falta configurar Firebase! Abre admin_script.js y agrega tus credenciales.");
        return;
    }

    const tbody = document.getElementById('sales-table-body');
    const totalSalesEl = document.getElementById('total-sales');
    const totalRevEl = document.getElementById('total-revenue');
    const proCountEl = document.getElementById('pro-count');

    // Escuchar cambios en tiempo real
    db.collection('sales').orderBy('date', 'desc').onSnapshot((snapshot) => {
        tbody.innerHTML = '';
        let sales = 0;
        let revenue = 0;
        let pros = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            sales++;
            if (data.type === 'Pro') {
                pros++;
                revenue += 99;
            } else {
                revenue += 49;
            }

            const row = `
                <tr>
                    <td>${new Date(data.date).toLocaleDateString()}</td>
                    <td>${data.name || 'Desconocido'}</td>
                    <td>${data.email || '-'}</td>
                    <td><span class="badge ${data.type === 'Pro' ? 'badge-pro' : 'badge-standard'}">${data.type}</span></td>
                    <td>${data.status || 'Pendiente'}</td>
                    <td>
                        <button onclick="markDone('${doc.id}')" class="btn" style="padding: 5px 10px; font-size: 12px; background: #10B981">
                            ✅ Listo
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        totalSalesEl.innerText = sales;
        totalRevEl.innerText = `$${revenue}`;
        proCountEl.innerText = pros;
    });
}

function markDone(id) {
    if(confirm('¿Marcar licencia como entregada?')) {
        db.collection('sales').doc(id).update({
            status: 'Entregado'
        });
    }
}
