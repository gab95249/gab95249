// Estado global
let currentUser = null;
let currentUserColor = null;
let momentos = [];
let currentMomentoIndex = 0;

// Constantes
const maxClicks = 5;
const minFontSize = 100;
const maxFontSize = 180;
let heartClickCount = 0;

// Pantallas
const loginScreen = document.getElementById('login-screen');
const splashScreen = document.getElementById('splash-screen');
const mainScreen = document.getElementById('main-screen');

// DOM - Login
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

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

// Event Listeners
loginForm.addEventListener('submit', login);
uploadForm.addEventListener('submit', subirFoto);

// ==================== LOGIN ====================
function selectUser(btn) {
    document.querySelectorAll('.user-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('usuario').value = btn.dataset.user;
}

function login(event) {
    event.preventDefault();
    clearMessages();

    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;

    if (!usuario || !contrasena) {
        showError(loginError, 'Selecciona un usuario');
        return;
    }

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            currentUser = data.usuario_id;
            currentUserColor = data.color;
            localStorage.setItem('usuario_id', data.usuario_id);
            localStorage.setItem('usuario_nombre', data.usuario_nombre);

            // Mostrar splash screen
            showScreen('splash');
            heartClickCount = 0;
            resetHeart();
        } else {
            showError(loginError, data.error || 'Credenciales inválidas');
        }
    })
    .catch(err => showError(loginError, 'Error al conectar'));
}

function logout() {
    currentUser = null;
    currentUserColor = null;
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_nombre');
    heartClickCount = 0;
    momentos = [];
    currentMomentoIndex = 0;
    showScreen('login');
    document.getElementById('usuario').value = '';
    document.getElementById('contrasena').value = '';
    document.querySelectorAll('.user-btn').forEach(b => b.classList.remove('selected'));
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
    const usuario = localStorage.getItem('usuario_nombre') || 'Usuario';
    const displayName = usuario === 'yo' ? '👨 Yo' : '👩 Mi Novia';
    userBadge.textContent = displayName;
}

function cargarMomentos() {
    fetch('/api/historia')
        .then(res => res.json())
        .then(data => {
            momentos = data.momentos || [];
            currentMomentoIndex = 0;
            renderCarousel();
        })
        .catch(err => console.error('Error cargando momentos:', err));
}

function renderCarousel() {
    momentosCarousel.innerHTML = '';

    if (momentos.length === 0) {
        momentosCarousel.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;"><p>No hay momentos aún. ¡Agrega el primero! 💕</p></div>';
        momentCounter.textContent = '0 / 0';
        return;
    }

    momentos.forEach((momento, index) => {
        const card = document.createElement('div');
        card.className = 'momento-card';
        if (index === currentMomentoIndex) card.classList.add('active');

        const fechaFormato = formatearFecha(momento.fecha);
        const titulo = momento.titulo || 'Nuestro Momento';
        const descripcion = momento.descripcion || 'Un momento especial compartido';
        const usuario = momento.usuario_nombre === 'yo' ? '👨' : '👩';

        card.innerHTML = `
            <div class="momento-header">
                <div class="momento-titulo">${titulo}</div>
                <div class="momento-fecha">${fechaFormato}</div>
            </div>
            <div class="momento-foto-container">
                <img src="${momento.foto_url}" alt="${titulo}" class="momento-foto">
            </div>
            <div class="momento-decoracion">🌻 ❤️ 🌻</div>
            <div class="momento-descripcion">"${descripcion}"</div>
            <div style="font-size: 11px; color: #b45309; margin-top: 10px;">Compartido por ${usuario}</div>
        `;

        momentosCarousel.appendChild(card);
    });

    updateCarouselIndicator();
    updateNavButtons();
}

function updateCarouselIndicator() {
    momentCounter.textContent = `${currentMomentoIndex + 1} / ${momentos.length}`;
}

function updateNavButtons() {
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');

    prevBtn.disabled = currentMomentoIndex === 0;
    nextBtn.disabled = currentMomentoIndex === momentos.length - 1;
}

function nextMomento() {
    if (currentMomentoIndex < momentos.length - 1) {
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
        document.getElementById('descripcion').value = '';
        clearMessages();
    }
}

function subirFoto(event) {
    event.preventDefault();
    clearMessages();

    const foto = document.getElementById('foto').files[0];
    const titulo = document.getElementById('titulo').value;
    const descripcion = document.getElementById('descripcion').value;

    if (!foto) {
        showError(uploadError, 'Selecciona una foto');
        return;
    }

    if (!titulo) {
        showError(uploadError, 'Ingresa un título');
        return;
    }

    const formData = new FormData();
    formData.append('foto', foto);
    formData.append('usuario_id', currentUser);
    formData.append('usuario_nombre', localStorage.getItem('usuario_nombre'));
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);

    fetch('/api/subir', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showSuccess(uploadSuccess, 'Momento guardado con éxito');
            uploadForm.reset();
            setTimeout(() => {
                toggleUploadForm();
                cargarMomentos();
            }, 1000);
        } else {
            showError(uploadError, data.error || 'Error al subir');
        }
    })
    .catch(err => showError(uploadError, 'Error al conectar'));
}

// ==================== UTILIDADES ====================
function showScreen(screenName) {
    loginScreen.classList.remove('active');
    splashScreen.classList.remove('active');
    mainScreen.classList.remove('active');

    if (screenName === 'login') loginScreen.classList.add('active');
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
    loginError.classList.remove('show');
    uploadError.classList.remove('show');
    uploadSuccess.classList.remove('show');
}

// ==================== INIT ====================
window.addEventListener('load', () => {
    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
        currentUser = usuarioId;
        showScreen('main');
        updateUserBadge();
        cargarMomentos();
    } else {
        showScreen('login');
    }
});
