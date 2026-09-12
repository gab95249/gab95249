// Estado global
let currentUser = 1; // Usuario anónimo
let momentos = [];
let momentosAgrupados = []; // Agrupados por fecha
let currentMomentoIndex = 0;
let miniCarrouselIndex = {}; // Índice de mini-carrusel por fecha
let touchStartX = 0;
let touchEndX = 0;

// Constantes
const maxClicks = 5;
const minFontSize = 100;
const maxFontSize = 180;
let heartClickCount = 0;

// Pantallas
const splashScreen = document.getElementById('splash-screen');
const mainScreen = document.getElementById('main-screen');

// DOM - Splash
const heart = document.getElementById('heart');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const hint = document.querySelector('.hint');

// DOM - Main
const userBadge = document.getElementById('user-badge');
const uploadForm = document.getElementById('upload-form');
const momentosCarousel = document.getElementById('momentos-carousel');
const momentCounter = document.getElementById('moment-counter');
const uploadFormContainer = document.getElementById('upload-form-container');
const uploadError = document.getElementById('upload-error');
const uploadSuccess = document.getElementById('upload-success');
const carouselWrapper = document.querySelector('.carousel-wrapper');

// Event Listeners
carouselWrapper?.addEventListener('touchstart', handleSwipeStart, false);
carouselWrapper?.addEventListener('touchend', handleSwipeEnd, false);

// Mini-carousel swipe support (delegated)
document.addEventListener('touchstart', handleMiniCarrouselTouchStart, false);
document.addEventListener('touchend', handleMiniCarrouselTouchEnd, false);

let miniCarrouselTouchStart = 0;
let miniCarrouselTouchEnd = 0;
let currentMiniCarrouselIndex = -1;

// ==================== LOGOUT ====================
function logout() {
    heartClickCount = 0;
    momentos = [];
    currentMomentoIndex = 0;
    showScreen('splash');
    resetHeart();
}

// ==================== SPLASH SCREEN ====================
function handleHeartClick(event) {
    heartClickCount++;
    if (heartClickCount > maxClicks) heartClickCount = maxClicks;

    // Animación del corazón
    heart.classList.remove('clicked');
    void heart.offsetWidth; // Trigger reflow
    heart.classList.add('clicked');

    // Aumentar tamaño
    const fontSizeIncrease = (heartClickCount / maxClicks) * (maxFontSize - minFontSize);
    heart.style.fontSize = (minFontSize + fontSizeIncrease) + 'px';

    // Actualizar barra
    const progress = (heartClickCount / maxClicks) * 100;
    progressBar.style.width = progress + '%';
    progressPercent.textContent = Math.round(progress);

    // Emoji flotante
    createFloatingEmoji(event);

    // Si se llena completamente
    if (heartClickCount === maxClicks) {
        setTimeout(() => {
            celebrateCompletion();
        }, 300);
    }
}

function createFloatingEmoji(event) {
    const emojis = ['❤️', '🌻', '💕', '✨'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    const trail = document.createElement('div');
    trail.className = 'emoji-trail';
    trail.textContent = randomEmoji;
    trail.style.left = event.clientX + 'px';
    trail.style.top = event.clientY + 'px';

    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 1000);
}

function celebrateCompletion() {
    const heart = document.getElementById('heart');

    // Animación de celebración
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            heart.style.animation = 'none';
            void heart.offsetWidth;
            heart.style.animation = 'pulse 0.6s ease-out';
        }, i * 150);
    }

    // Cambiar mensaje
    setTimeout(() => {
        hint.textContent = '¡100% Amor Cargado! 💕🌻';
        hint.style.opacity = '1';
        hint.style.fontWeight = '600';
        hint.style.color = '#d97706';

        // Ir a main después de 1.5s
        setTimeout(() => {
            showScreen('main');
            cargarMomentos();
            updateUserBadge();
        }, 1500);
    }, 500);
}

function resetHeart() {
    heart.style.fontSize = minFontSize + 'px';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0';
    hint.textContent = 'Dale click al corazón ✨';
    hint.style.fontWeight = '400';
    hint.style.color = '#b45309';
    hint.style.opacity = '0.7';
}

// ==================== MAIN SCREEN ====================
function updateUserBadge() {
    userBadge.textContent = '💕 Nuestro Espacio';
}

function cargarMomentos() {
    fetch('/api/historia')
        .then(res => res.json())
        .then(data => {
            momentos = data.momentos || [];
            // Ordenar por fecha_recuerdo (más antigua primero)
            momentos.sort((a, b) => {
                const fechaA = new Date(a.fecha_recuerdo || a.fecha);
                const fechaB = new Date(b.fecha_recuerdo || b.fecha);
                return fechaA - fechaB;
            });
            currentMomentoIndex = 0;
            mostrarYears();
            renderCarousel();
        })
        .catch(err => console.error('Error cargando momentos:', err));
}

function mostrarYears() {
    if (momentos.length === 0) return;

    const years = new Set();
    momentos.forEach(momento => {
        const fecha = new Date(momento.fecha_recuerdo || momento.fecha);
        years.add(fecha.getFullYear());
    });

    const yearsContainer = document.getElementById('years-container');
    if (yearsContainer) {
        yearsContainer.innerHTML = Array.from(years)
            .sort((a, b) => a - b)
            .map(year => `<span class="year-badge">${year}</span>`)
            .join(' ');
    }
}

function agruparMomentosPorFecha() {
    const grupos = {};
    momentos.forEach(momento => {
        const fechaRecuerdo = momento.fecha_recuerdo || momento.fecha;
        const titulo = momento.titulo || 'Nuestro Momento';
        const key = `${fechaRecuerdo}-${titulo}`;

        if (!grupos[key]) {
            grupos[key] = {
                fecha: fechaRecuerdo,
                titulo: titulo,
                descripcion: momento.descripcion || 'Un momento especial compartido',
                fotos: []
            };
        }
        grupos[key].fotos.push(momento);
    });

    momentosAgrupados = Object.values(grupos);
    miniCarrouselIndex = {};
    momentosAgrupados.forEach((_, i) => {
        miniCarrouselIndex[i] = 0;
    });
}

function renderCarousel() {
    momentosCarousel.innerHTML = '';

    if (momentos.length === 0) {
        momentosCarousel.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;"><p>No hay momentos aún. ¡Agrega el primero! 💕</p></div>';
        momentCounter.textContent = '0 / 0';
        return;
    }

    agruparMomentosPorFecha();

    momentosAgrupados.forEach((grupo, index) => {
        const card = document.createElement('div');
        card.className = 'momento-card';
        if (index === currentMomentoIndex) card.classList.add('active');

        const fechaFormato = formatearFecha(grupo.fecha);
        const titulo = grupo.titulo;
        const descripcion = grupo.descripcion;
        const fotoCount = grupo.fotos.length;
        const fotoActual = miniCarrouselIndex[index] || 0;

        let miniCarrouselHTML = '';
        if (fotoCount > 1) {
            miniCarrouselHTML = `
                <div class="mini-carousel-controls">
                    <span class="mini-carousel-counter">${fotoActual + 1}/${fotoCount}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="momento-foto-container">
                <div class="mini-carousel">
                    ${grupo.fotos.map((foto, i) => `
                        <img src="${foto.foto_url}" alt="${titulo}" class="momento-foto ${i === fotoActual ? 'active' : 'hidden'}">
                    `).join('')}
                </div>
                ${miniCarrouselHTML}
            </div>
            <div class="momento-header">
                <div class="momento-titulo">${titulo}</div>
                <div class="momento-fecha">${fechaFormato}</div>
            </div>
            <div class="momento-decoracion">🌻 ❤️ 🌻</div>
            <div class="momento-descripcion">"${descripcion}"</div>
        `;

        momentosCarousel.appendChild(card);
    });

    updateCarouselIndicator();
    updateNavButtons();
}

function nextMiniCarrusel(index) {
    const grupo = momentosAgrupados[index];
    if (!grupo) return;

    const currentIndex = miniCarrouselIndex[index] || 0;
    if (currentIndex < grupo.fotos.length - 1) {
        miniCarrouselIndex[index] = currentIndex + 1;
        updateMiniCarrusel(index);
    }
}

function prevMiniCarrusel(index) {
    const currentIndex = miniCarrouselIndex[index] || 0;
    if (currentIndex > 0) {
        miniCarrouselIndex[index] = currentIndex - 1;
        updateMiniCarrusel(index);
    }
}

function updateMiniCarrusel(index) {
    const grupo = momentosAgrupados[index];
    if (!grupo) return;

    const fotoActual = miniCarrouselIndex[index] || 0;
    const card = document.querySelectorAll('.momento-card')[index];
    if (!card) return;

    const fotos = card.querySelectorAll('.momento-foto');
    fotos.forEach((foto, i) => {
        foto.classList.toggle('hidden', i !== fotoActual);
        foto.classList.toggle('active', i === fotoActual);
    });

    const counter = card.querySelector('.mini-carousel-counter');
    if (counter) counter.textContent = `${fotoActual + 1}/${grupo.fotos.length}`;

    const prevBtn = card.querySelector('.mini-carousel-btn.prev');
    const nextBtn = card.querySelector('.mini-carousel-btn.next');
    if (prevBtn) prevBtn.disabled = fotoActual === 0;
    if (nextBtn) nextBtn.disabled = fotoActual === grupo.fotos.length - 1;
}

function updateCarouselIndicator() {
    momentCounter.textContent = `${currentMomentoIndex + 1} / ${momentosAgrupados.length}`;
}

function updateNavButtons() {
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');

    prevBtn.disabled = currentMomentoIndex === 0;
    nextBtn.disabled = currentMomentoIndex === momentosAgrupados.length - 1;
}

function nextMomento() {
    if (currentMomentoIndex < momentosAgrupados.length - 1) {
        currentMomentoIndex++;
        updateCarousel();
    }
}

function prevMomento() {
    if (currentMomentoIndex > 0) {
        currentMomentoIndex--;
        updateCarousel();
    }
}

function updateCarousel() {
    document.querySelectorAll('.momento-card').forEach((card, index) => {
        card.classList.remove('active');
        if (index === currentMomentoIndex) card.classList.add('active');
    });

    updateCarouselIndicator();
    updateNavButtons();
}

// ==================== UPLOAD ====================
function toggleUploadForm() {
    uploadFormContainer.classList.toggle('hidden');
    if (!uploadFormContainer.classList.contains('hidden')) {
        document.getElementById('foto').value = '';
        document.getElementById('titulo').value = '';
        document.getElementById('fecha-recuerdo').value = '';
        document.getElementById('descripcion').value = '';
        clearMessages();
    }
}

function subirFoto(event) {
    event.preventDefault();
    clearMessages();

    const fotos = Array.from(document.getElementById('foto').files);
    const titulo = document.getElementById('titulo').value;
    const fechaRecuerdo = document.getElementById('fecha-recuerdo').value;
    const descripcion = document.getElementById('descripcion').value;
    const submitBtn = uploadForm.querySelector('button[type="submit"]');

    if (fotos.length === 0) {
        showError(uploadError, 'Selecciona al menos una foto');
        return;
    }

    if (!titulo) {
        showError(uploadError, 'Ingresa un título');
        return;
    }

    if (!fechaRecuerdo) {
        showError(uploadError, 'Selecciona la fecha del recuerdo');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = `Guardando (0/${fotos.length})...`;

    const uploadPromises = fotos.map((foto, index) => {
        const formData = new FormData();
        formData.append('foto', foto);
        formData.append('usuario_id', currentUser);
        formData.append('usuario_nombre', 'Nosotros');
        formData.append('titulo', titulo);
        formData.append('fecha_recuerdo', fechaRecuerdo);
        formData.append('descripcion', descripcion);

        return fetch('/api/subir', {
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            submitBtn.textContent = `Guardando (${index + 1}/${fotos.length})...`;
            if (!data.success) throw new Error(data.error || 'Error al subir');
            return data;
        });
    });

    Promise.all(uploadPromises)
    .then(results => {
        showSuccess(uploadSuccess, `${results.length} foto(s) guardada(s) con éxito`);
        uploadForm.reset();
        setTimeout(() => {
            toggleUploadForm();
            cargarMomentos();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Momento';
        }, 1000);
    })
    .catch(err => {
        console.error('Upload error:', err);
        showError(uploadError, err.message || 'Error al subir las fotos');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Momento';
    });
}

// ==================== TOUCH/SWIPE ====================
function handleSwipeStart(event) {
    touchStartX = event.changedTouches[0].screenX;
}

function handleSwipeEnd(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            nextMomento();
        } else {
            prevMomento();
        }
    }
}

function handleMiniCarrouselTouchStart(event) {
    const miniCarousel = event.target.closest('.mini-carousel');
    if (!miniCarousel) return;

    event.stopPropagation();
    miniCarrouselTouchStart = event.changedTouches[0].screenX;
    currentMiniCarrouselIndex = -1;

    const card = miniCarousel.closest('.momento-card');
    if (card) {
        const cardIndex = Array.from(document.querySelectorAll('.momento-card')).indexOf(card);
        currentMiniCarrouselIndex = cardIndex;
        console.log('Mini carousel touch start - Card index:', cardIndex, 'X:', miniCarrouselTouchStart);
    }
}

function handleMiniCarrouselTouchEnd(event) {
    if (currentMiniCarrouselIndex === -1) return;

    const miniCarousel = event.target.closest('.mini-carousel');
    if (!miniCarousel) return;

    event.stopPropagation();
    miniCarrouselTouchEnd = event.changedTouches[0].screenX;
    console.log('Mini carousel touch end - X:', miniCarrouselTouchEnd, 'Diff:', miniCarrouselTouchStart - miniCarrouselTouchEnd);
    handleMiniCarrouselSwipe();
}

function handleMiniCarrouselSwipe() {
    if (currentMiniCarrouselIndex === -1) return;

    const swipeThreshold = 50;
    const diff = miniCarrouselTouchStart - miniCarrouselTouchEnd;

    console.log('Swipe check - diff:', diff, 'threshold:', swipeThreshold, 'index:', currentMiniCarrouselIndex);

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            console.log('Next slide');
            nextMiniCarrusel(currentMiniCarrouselIndex);
        } else {
            console.log('Previous slide');
            prevMiniCarrusel(currentMiniCarrouselIndex);
        }
    }
}

// ==================== LLUVIA DE CORAZONES ====================
function createHeartRain() {
    const hearts = ['❤️', '💕', '💗', '💖'];

    setInterval(() => {
        const heart = document.createElement('div');
        heart.className = 'heart-rain';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (3 + Math.random() * 3) + 's';
        heart.style.animationDelay = Math.random() * 2 + 's';

        document.body.appendChild(heart);

        setTimeout(() => heart.remove(), 7000);
    }, 400);
}

// ==================== UTILIDADES ====================
function showScreen(screenName) {
    splashScreen.classList.remove('active');
    mainScreen.classList.remove('active');

    if (screenName === 'splash') splashScreen.classList.add('active');
    if (screenName === 'main') mainScreen.classList.add('active');
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', opciones);
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function showSuccess(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function clearMessages() {
    uploadError.classList.remove('show');
    uploadSuccess.classList.remove('show');
}

// ==================== INIT ====================
window.addEventListener('load', () => {
    // Iniciar directo con splash screen
    showScreen('splash');
    resetHeart();

    // Iniciar lluvia de corazones
    createHeartRain();
});
