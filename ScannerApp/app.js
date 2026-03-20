// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyAcyU31FdgWyQZrLdu6P-G0K7mQwV4sY4A",
    authDomain: "labmanager-ventas.firebaseapp.com",
    projectId: "labmanager-ventas",
    storageBucket: "labmanager-ventas.firebasestorage.app",
    messagingSenderId: "340778088741",
    appId: "1:340778088741:web:38e2ac671efb32cfccc2cc"
};

try {
    firebase.initializeApp(firebaseConfig);
} catch (e) {
    console.error("Firebase Error:", e);
}
const db = firebase.firestore();

// --- DOM ELEMENTS ---
const scannerView = document.getElementById('scanner-view');
const detailsView = document.getElementById('details-view');

const scanNewBtnTop = document.getElementById('scan-new-btn-top');
const scanNewBtnMain = document.getElementById('scan-new-btn-main');
const bottomActionBar = document.getElementById('bottom-action-bar');

const manualModal = document.getElementById('manual-modal');
const enterManualBtn = document.getElementById('enter-manual-btn');
const cancelManualBtn = document.getElementById('cancel-manual-btn');
const submitManualBtn = document.getElementById('submit-manual-btn');
const manualIdInput = document.getElementById('manual-id-input');

const loadingState = document.getElementById('loading-state');
const detailsContent = document.getElementById('details-content');

const html5QrCode = new Html5Qrcode("reader");

function initScanner() {
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    // If already scanning, don't start again
    if (html5QrCode.isScanning) return;

    // Use environment camera (back camera) by default
    html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        onScanSuccess,
        onScanFailure
    ).catch((err) => {
        console.error("Error al iniciar cámara:", err);
        // Fallback or alert user
        alert("No se pudo acceder a la cámara. Asegúrate de dar permisos de cámara y de usar HTTPS.");
    });
}

function onScanSuccess(decodedText, decodedResult) {
    console.log("QR Scanned:", decodedText);
    let orderId = null;
    
    // Pattern discovery logic
    if (decodedText.toLowerCase().includes('orden:')) {
        const parts = decodedText.split('|');
        const orderPart = parts[0].trim();
        const idMatch = orderPart.match(/\d+/);
        if (idMatch) orderId = idMatch[0];
    } else {
        // Just look for numbers anywhere if it's a short string, or trim it
        const idMatch = decodedText.match(/\d+/);
        if (idMatch && decodedText.length < 20) {
            orderId = idMatch[0];
        } else {
            orderId = decodedText.trim();
        }
    }
    
    if (orderId) {
        if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                showDetailsForOrder(orderId);
            }).catch(() => showDetailsForOrder(orderId));
        } else {
            showDetailsForOrder(orderId);
        }
    } else {
        alert("Código QR no reconocido. Intenta centrarlo mejor.");
    }
}

function onScanFailure(error) {
    // Ignore continuous scanning failures
}

// --- LOGIC / FLOW ---

function resetToScanner() {
    detailsView.classList.add('hidden');
    scanNewBtnTop.classList.add('hidden');
    bottomActionBar.classList.add('hidden');
    
    scannerView.classList.remove('hidden');
    manualModal.classList.remove('active'); // Close modal just in case
    initScanner();
}

function showDetailsForOrder(orderId) {
    scannerView.classList.add('hidden');
    
    detailsView.classList.remove('hidden');
    scanNewBtnTop.classList.remove('hidden');
    
    loadingState.classList.remove('hidden');
    detailsContent.classList.add('hidden');
    bottomActionBar.classList.add('hidden');
    
    // Fetch data from Firestore
    fetchOrderFromFirestore(orderId);
}

function fetchOrderFromFirestore(orderId) {
    const ordersRef = db.collection("orders");
    const idStr = String(orderId);

    // Step 1: Try Direct Doc ID
    ordersRef.doc(idStr).get().then((doc) => {
        if (doc.exists) {
            handleOrderSuccess(orderId, doc.data());
        } else {
            // Step 2: Try Doc ID with # prefix (common in manual sync)
            ordersRef.doc(`#${idStr}`).get().then((docHash) => {
                if (docHash.exists) {
                    handleOrderSuccess(orderId, docHash.data());
                } else {
                    // Step 3: Deep search by fields (fallback for random Doc IDs)
                    searchByFields(orderId);
                }
            });
        }
    }).catch(handleFirestoreError);
}

function searchByFields(orderId) {
    const ordersRef = db.collection("orders");
    const idStr = String(orderId).trim();
    const idNum = parseInt(idStr);

    console.log(`Searching globally for: "${idStr}" (string) and ${idNum} (number)...`);

    // We chain multiple attempts to find it in any common field
    // Attempt A: order_id (number)
    ordersRef.where("order_id", "==", idNum).limit(1).get().then((q1) => {
        if (!q1.empty) return handleOrderSuccess(orderId, q1.docs[0].data());
        
        // Attempt B: order_id (string)
        ordersRef.where("order_id", "==", idStr).limit(1).get().then((q2) => {
            if (!q2.empty) return handleOrderSuccess(orderId, q2.docs[0].data());
            
            // Attempt C: id (number)
            ordersRef.where("id", "==", idNum).limit(1).get().then((q3) => {
                if (!q3.empty) return handleOrderSuccess(orderId, q3.docs[0].data());
                
                // Attempt D: id (string)
                ordersRef.where("id", "==", idStr).limit(1).get().then((q4) => {
                    if (!q4.empty) return handleOrderSuccess(orderId, q4.docs[0].data());
                    
                    // Final Attempt: case_number (string/number)
                    ordersRef.where("numero", "==", idNum).limit(1).get().then((q5) => {
                        if (!q5.empty) return handleOrderSuccess(orderId, q5.docs[0].data());
                        
                        alert(`No se encontró el caso #${orderId} en la nube.\n\nEs posible que los datos aún no se hayan sincronizado desde LabManager Desktop o que el tipo de ID no coincida.`);
                        resetToScanner();
                    }).catch(handleFirestoreError);
                }).catch(handleFirestoreError);
            }).catch(handleFirestoreError);
        }).catch(handleFirestoreError);
    }).catch(handleFirestoreError);
}

function handleOrderSuccess(orderId, data) {
    populateUI(orderId, data);
    setTimeout(() => {
        loadingState.classList.add('hidden');
        detailsContent.classList.remove('hidden');
        bottomActionBar.classList.remove('hidden');
    }, 600);
}

function handleFirestoreError(error) {
    console.error("Firestore Error:", error);
    let msg = "Error de conexión con la base de datos.";
    if (error.code === 'permission-denied') msg = "Acceso denegado (Reglas de Seguridad).";
    alert(`${msg}\nDetalle: ${error.message || error.code}`);
    resetToScanner();
}

function populateUI(orderId, data) {
    // Top Hero
    document.getElementById('hero-order-id').textContent = `#${orderId}`;
    
    const statusEl = document.getElementById('case-status');
    const status = data.status || 'Desconocido';
    statusEl.textContent = status;
    statusEl.className = 'badge-large'; // reset
    
    const sLow = status.toLowerCase();
    if (sLow.includes('pendiente') || sLow.includes('revis')) {
        statusEl.classList.add('status-pending-bg', 'status-pending-text');
    } else if (sLow.includes('repara')) {
        statusEl.classList.add('status-repair-bg', 'status-repair-text');
    } else if (sLow.includes('termina') || sLow.includes('listo')) {
        statusEl.classList.add('status-ready-bg', 'status-ready-text');
    } else if (sLow.includes('entrega')) {
        statusEl.classList.add('status-delivered-bg', 'status-delivered-text');
    } else if (sLow.includes('cancel')) {
        statusEl.classList.add('status-cancel-bg', 'status-cancel-text');
    } else {
        statusEl.classList.add('status-delivered-bg', 'status-delivered-text');
    }

    // Client Info
    document.getElementById('client-name').textContent = data.client_name || data.name || 'No registrado';
    document.getElementById('client-phone').textContent = data.client_phone || data.phone || '-';

    // WhatsApp logic
    const msgBtn = document.getElementById('msg-client-btn');
    const phone = data.client_phone || data.phone || '';
    if (phone.length > 5) {
        msgBtn.style.display = 'flex';
        msgBtn.onclick = () => {
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const msg = `Hola ${data.client_name || ''}, nos comunicamos de LabManager referente a su ${data.device_type}. Orden #${orderId}. `;
            window.open(`https://wa.me/549${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        };
    } else {
        msgBtn.style.display = 'none';
    }

    // Device Info
    document.getElementById('case-device').textContent = `${data.device_type || 'Equipo'} ${data.brand_model || ''}`.trim() || 'Desconocido';
    document.getElementById('case-issue').textContent = data.problem_description || 'Sin detallar';
    
    const diagContainer = document.getElementById('diagnosis-container');
    if (data.diagnosis) {
        diagContainer.classList.remove('hidden');
        document.getElementById('case-diagnosis').textContent = data.diagnosis;
    } else {
        diagContainer.classList.add('hidden');
    }
    
    const workContainer = document.getElementById('work-container');
    if (data.work_done) {
        workContainer.classList.remove('hidden');
        document.getElementById('case-work').textContent = data.work_done;
    } else {
        workContainer.classList.add('hidden');
    }

    // Timeline
    buildTimeline(data);
}

function buildTimeline(data) {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';
    
    // 1. Ingreso
    const createdAt = data.created_at ? new Date(data.created_at) : new Date();
    addTimelineItem(container, 'Ingreso al Taller', formatDateTime(createdAt), true, true);
    
    // 2. Evaluacion
    if (data.diagnosis) {
        addTimelineItem(container, 'Diagnóstico Realizado', 'El equipo fue catalogado y diagnosticado.', true, true);
    }
    
    // 3. Status Dynamic
    const sLow = (data.status || '').toLowerCase();
    
    if (sLow.includes('repara')) {
        addTimelineItem(container, 'En Reparación', 'Nuestros técnicos están trabajando.', true, false);
        addTimelineItem(container, 'Listo / Retiro', 'Pendiente.', false, false);
    } 
    else if (sLow.includes('termina') || sLow.includes('listo')) {
        addTimelineItem(container, 'Reparado', 'El equipo ya fue reparado exitosamente.', true, true);
        addTimelineItem(container, 'Listo para Entregar', 'El cliente puede pasar a retirarlo.', true, false);
    } 
    else if (sLow.includes('entrega')) {
        addTimelineItem(container, 'Reparado', 'Completado.', true, true);
        addTimelineItem(container, 'Entregado', 'Devuelto al cliente con éxito.', true, true);
    } 
    else if (sLow.includes('cancel')) {
        addTimelineItem(container, 'Cancelado / Sin Reparo', 'El trabajo no se finalizó.', true, true);
    } 
    else {
        // Pendiente inicial
        addTimelineItem(container, 'Pendiente de Revisión', 'El sistema aguarda turno.', true, false);
    }
}

function addTimelineItem(container, title, desc, isActive, isCompleted) {
    const item = document.createElement('div');
    let classNames = 'timeline-item';
    if (isActive) classNames += ' active';
    if (isCompleted) classNames += ' completed';
    
    item.className = classNames;
    item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content">
            <h4>${title}</h4>
            <p>${desc}</p>
        </div>
    `;
    container.appendChild(item);
}

function formatDateTime(dateObj) {
    return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', hour: '2-digit', minute:'2-digit' });
}

// --- MODAL EVENTS ---
enterManualBtn.addEventListener('click', () => {
    manualModal.classList.add('active');
});

cancelManualBtn.addEventListener('click', () => {
    manualModal.classList.remove('active');
});

submitManualBtn.addEventListener('click', () => {
    const id = manualIdInput.value.trim();
    if (id) {
        manualModal.classList.remove('active');
        if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                showDetailsForOrder(id);
            }).catch(() => showDetailsForOrder(id));
        } else {
            showDetailsForOrder(id);
        }
    }
});

// Resets
scanNewBtnTop.addEventListener('click', resetToScanner);
scanNewBtnMain.addEventListener('click', resetToScanner);

// INITIALIZE
initScanner();

// --- PWA INSTALLATION LOGIC ---
let deferredPrompt;
const installModal = document.getElementById('install-modal');
const confirmInstallBtn = document.getElementById('confirm-install-btn');
const cancelInstallBtn = document.getElementById('cancel-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome mini-infobar
    e.preventDefault();
    deferredPrompt = e;
    
    // Show our custom UI after a short delay so it's not aggressive
    setTimeout(() => {
        // Only show if we are on the scanner view to not interrupt a client's details view
        if (!scannerView.classList.contains('hidden')) {
            installModal.classList.add('active');
        }
    }, 2000);
});

cancelInstallBtn.addEventListener('click', () => {
    installModal.classList.remove('active');
    // We don't nullify deferredPrompt so they can trigger it later if we add a button,
    // but for now, it just dismisses it.
});

confirmInstallBtn.addEventListener('click', async () => {
    installModal.classList.remove('active');
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA Prompt outcome: ${outcome}`);
        deferredPrompt = null;
    }
});

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((registration) => {
            console.log('SW registered: ', registration.scope);
        }).catch((err) => {
            console.log('SW registration failed: ', err);
        });
    });
}
