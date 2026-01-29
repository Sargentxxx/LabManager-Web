// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card, .pricing-card, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Form submission (placeholder)
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Show success message (in production, send to server)
        alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
        contactForm.reset();
        
        // In production, you would send this to your backend:
        // fetch('/api/contact', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });
    });
}

// Add hover effect to stats
document.querySelectorAll('.stat').forEach(stat => {
    stat.addEventListener('mouseenter', () => {
        stat.style.transform = 'scale(1.1)';
        stat.style.transition = 'transform 0.3s ease';
    });
    
    stat.addEventListener('mouseleave', () => {
        stat.style.transform = 'scale(1)';
    });
});

// Pricing card hover effect
document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.borderColor = '#6366F1';
    });
    
    card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('featured')) {
            card.style.borderColor = '#E5E7EB';
        }
    });
});

// Mobile menu toggle (if you add a hamburger menu later)
function createMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '☰';
    hamburger.style.display = 'none';
    hamburger.style.fontSize = '1.5rem';
    hamburger.style.background = 'none';
    hamburger.style.border = 'none';
    hamburger.style.cursor = 'pointer';
    hamburger.style.color = '#111827';
    
    // Add hamburger to navbar
    const navbar = document.querySelector('.navbar .container');
    navbar.appendChild(hamburger);
    
    // Toggle menu on mobile
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
    
    // Show/hide hamburger based on screen size
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            hamburger.style.display = 'block';
            navLinks.style.display = navLinks.classList.contains('active') ? 'flex' : 'none';
        } else {
            hamburger.style.display = 'none';
            navLinks.style.display = 'flex';
        }
    }
    
    window.addEventListener('resize', checkScreenSize);
    checkScreenSize();
}

// Initialize mobile menu
createMobileMenu();

// Add download tracking (analytics placeholder)
document.querySelectorAll('a[href="#download"]').forEach(link => {
    link.addEventListener('click', () => {
        console.log('Download button clicked');
        // In production, track with Google Analytics:
        // gtag('event', 'download_click', { 'event_category': 'engagement' });
    });
});

// Lazy load images (if you add real screenshots later)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => imageObserver.observe(img));
}

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start).toLocaleString();
        }
    }, 16);
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const number = entry.target.querySelector('.stat-number');
            const text = number.textContent.replace(/[^0-9.]/g, '');
            const target = parseFloat(text);
            
            if (!isNaN(target)) {
                number.textContent = '0';
                animateCounter(number, target);
                entry.target.dataset.animated = 'true';
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

console.log('🚀 Taller PC Landing Page loaded successfully!');

// PayPal Integration
document.addEventListener("DOMContentLoaded", function () {
  // Check if PayPal SDK is loaded
  if (typeof paypal !== "undefined") {
    
    // Standard License Button ($99)
    if (document.getElementById("paypal-button-standard")) {
      paypal.Buttons({
        style: {
            shape: 'rect',
            color: 'blue',
            layout: 'vertical',
            label: 'pay',
        },
        createOrder: function (data, actions) {
          return actions.order.create({
            purchase_units: [{
                description: "Licencia Estándar - LabManager",
                amount: {
                  value: "49.00"
                }
            }]
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            alert('¡Pago completado con éxito por ' + details.payer.name.given_name + '! Gracias por su compra.');
            // Here you would typically trigger the download or license generation
            saveSale(details, 'Standard'); // Guardar en Firebase
            window.location.href = "Instalador_LabManager_v2.exe";
          });
        },
        onError: function (err) {
            console.error(err);
            alert("Ocurrió un error con el pago. Por favor intente nuevamente.");
        }
      }).render('#paypal-button-standard');
    }

    // Pro License Button ($199)
    if (document.getElementById("paypal-button-pro")) {
      paypal.Buttons({
        style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'pay',
        },
        createOrder: function (data, actions) {
          return actions.order.create({
             purchase_units: [{
                description: "Licencia Pro - LabManager",
                amount: {
                  value: "99.00"
                }
            }]
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            alert('¡Pago completado con éxito por ' + details.payer.name.given_name + '! Gracias por su compra.');
            saveSale(details, 'Pro'); // Guardar en Firebase
            window.location.href = "Instalador_LabManager_v2.exe";
          });
        },
        onError: function (err) {
            console.error(err);
            alert("Ocurrió un error con el pago. Por favor intente nuevamente.");
        }
      }).render('#paypal-button-pro');
    }
  }
});

// --- FIREBASE INTEGRATION FOR SALES ---
// ⚠️ COPIA AQUÍ LA MISMA CONFIGURACIÓN QUE EN ADMIN_SCRIPT.JS
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO_ID",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Initialize
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.log("Firebase no init (falta config)");
}

function saveSale(details, type) {
    if (!db) return;
    
    db.collection('sales').add({
        name: details.payer.name.given_name + ' ' + details.payer.name.surname,
        email: details.payer.email_address,
        date: new Date().toISOString(),
        amount: type === 'Pro' ? 99.00 : 49.00,
        type: type,
        status: 'Pendiente', // Pendiente de envío de licencia
        id_pago: details.id
    }).then(() => {
        console.log("Venta registrada en DB");
    }).catch((e) => {
        console.error("Error guardando venta: ", e);
    });
}

// Mercado Pago Integration
document.addEventListener("DOMContentLoaded", function () {
    const PUBLIC_KEY = 'APP_USR-38c7cc9a-6055-4b0f-81ca-81fe7692f325';
    
    try {
        const mp = new MercadoPago(PUBLIC_KEY, {
            locale: 'es-AR'
        });

        // Configuración de botones personalizados con redirección directa
        const checkoutConfig = {
            standard: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=5241841-4e3f5bd9-7e8e-4023-916b-0b49a1297d78',
            pro: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=5241841-12d15c2b-570c-4e19-ad93-baf3d881f2b8'
        };

        const btnStandard = document.getElementById('btn-mercadopago-standard');
        if (btnStandard) {
            btnStandard.addEventListener('click', () => {
                console.log("Redirigiendo a Mercado Pago Estándar...");
                window.location.href = checkoutConfig.standard;
            });
        }

        const btnPro = document.getElementById('btn-mercadopago-pro');
        if (btnPro) {
            btnPro.addEventListener('click', () => {
                console.log("Redirigiendo a Mercado Pago Pro...");
                window.location.href = checkoutConfig.pro;
            });
        }
    } catch (error) {
        console.error("Error al inicializar Mercado Pago:", error);
    }
});
