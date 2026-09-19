// Estado global
let currentUser = 1; // Usuario anónimo
let momentos = [];
let momentosAgrupados = []; // Agrupados por fecha
let momentosAgrupados_full = []; // Copia completa sin filtrar
let miniCarrouselIndex = {}; // Índice de mini-carrusel por fecha
let selectedYear = null; // Año seleccionado para filtrar
let tipoActual = 'foto'; // Qué se está creando en el formulario: 'foto' o 'carta'

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

// Mini-carousel swipe support (delegated)
document.addEventListener('touchstart', handleMiniCarrouselTouchStart, false);
document.addEventListener('touchmove', handleMiniCarrouselTouchMove, { passive: false });
document.addEventListener('touchend', handleMiniCarrouselTouchEnd, false);

let arrastre = null;

// ==================== LOGOUT ====================
function logout() {
    heartClickCount = 0;
    momentos = [];
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
            // El recuerdo más nuevo va primero
            momentos.sort((a, b) => {
                const fechaA = new Date(a.fecha_recuerdo || a.fecha);
                const fechaB = new Date(b.fecha_recuerdo || b.fecha);
                return fechaB - fechaA;
            });
            agruparMomentosPorFecha();
            mostrarYears();
            renderCarousel();
        })
        .catch(err => console.error('Error cargando momentos:', err));
}

// Lee el año desde "YYYY-MM-DD" sin pasar por Date, que interpreta la
// fecha como UTC y puede devolver el año anterior en husos negativos.
function getYear(fechaStr) {
    const match = String(fechaStr || '').match(/^(\d{4})/);
    return match ? parseInt(match[1], 10) : new Date(fechaStr).getFullYear();
}

function mostrarYears() {
    const yearsContainer = document.getElementById('years-container');
    if (!yearsContainer) return;

    if (momentos.length === 0) {
        yearsContainer.innerHTML = '';
        return;
    }

    const years = new Set();
    momentos.forEach(momento => {
        years.add(getYear(momento.fecha_recuerdo || momento.fecha));
    });

    const todos = `<span class="year-badge${selectedYear === null ? ' active' : ''}" data-year="todos" onclick="filtrarPorAño(null)">Todos</span>`;

    yearsContainer.innerHTML = todos + Array.from(years)
        .sort((a, b) => b - a)
        .map(year => `<span class="year-badge${selectedYear === year ? ' active' : ''}" data-year="${year}" onclick="filtrarPorAño(${year})">${year}</span>`)
        .join('');
}

function agruparMomentosPorFecha() {
    const grupos = {};
    momentos.forEach(momento => {
        const fechaRecuerdo = momento.fecha_recuerdo || momento.fecha;
        const titulo = momento.titulo || 'Nuestro Momento';
        const tipo = momento.tipo === 'carta' ? 'carta' : 'foto';
        // El tipo entra en la clave: una carta nunca se agrupa con las fotos de ese día
        const key = `${tipo}-${fechaRecuerdo}-${titulo}`;

        if (!grupos[key]) {
            grupos[key] = {
                fecha: fechaRecuerdo,
                titulo: titulo,
                tipo: tipo,
                descripcion: momento.descripcion || (tipo === 'carta' ? '' : 'Un momento especial compartido'),
                fotos: []
            };
        }
        if (momento.foto_url) grupos[key].fotos.push(momento);
    });

    momentosAgrupados_full = Object.values(grupos);
    aplicarFiltro();
}

function aplicarFiltro() {
    momentosAgrupados = selectedYear === null
        ? momentosAgrupados_full
        : momentosAgrupados_full.filter(grupo => getYear(grupo.fecha) === selectedYear);

    miniCarrouselIndex = {};
    momentosAgrupados.forEach((_, i) => {
        miniCarrouselIndex[i] = 0;
    });
}

function filtrarPorAño(year) {
    // Volver a tocar el año activo lo deselecciona
    selectedYear = (year === null || selectedYear === year) ? null : year;

    aplicarFiltro();

    document.querySelectorAll('.year-badge').forEach(badge => {
        const badgeYear = badge.dataset.year === 'todos' ? null : parseInt(badge.dataset.year, 10);
        badge.classList.toggle('active', badgeYear === selectedYear);
    });

    renderCarousel();
    document.querySelector('.carousel-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderCarousel() {
    momentosCarousel.innerHTML = '';

    if (momentosAgrupados.length === 0) {
        const mensaje = momentos.length === 0
            ? 'No hay momentos aún. ¡Agrega el primero! 💕'
            : `No hay momentos de ${selectedYear} 🌻`;
        momentosCarousel.innerHTML = `<div style="text-align: center; color: #fff; padding: 40px; text-shadow: 0 2px 6px rgba(0,0,0,0.6);"><p>${mensaje}</p></div>`;
        momentCounter.textContent = '0 / 0';
        return;
    }

    momentosAgrupados.forEach((grupo, index) => {
        const card = document.createElement('div');
        card.dataset.index = index;

        if (grupo.tipo === 'carta') {
            card.className = 'carta-card';
            card.innerHTML = plantillaCarta(grupo);
            card.addEventListener('click', () => card.classList.toggle('abierta'));
        } else {
            card.className = 'momento-card';
            card.innerHTML = plantillaPolaroid(grupo, miniCarrouselIndex[index] || 0);
        }

        momentosCarousel.appendChild(card);
    });

    updateCarouselIndicator();
}

function plantillaPolaroid(grupo, fotoActual) {
    const titulo = escaparHtml(grupo.titulo);
    const total = grupo.fotos.length;

    const contador = total > 1
        ? `<div class="mini-carousel-controls"><span class="mini-carousel-counter">${fotoActual + 1}/${total}</span></div>`
        : '';

    return `
        <div class="momento-foto-container">
            <div class="mini-carousel">
                <div class="mini-carousel-track" style="transform: translate3d(-${fotoActual * 100}%, 0, 0)">
                    ${grupo.fotos.map(foto => `
                        <img src="${escaparHtml(foto.foto_url)}" alt="${titulo}" class="momento-foto" draggable="false">
                    `).join('')}
                </div>
            </div>
            ${contador}
        </div>
        <div class="momento-header">
            <div class="momento-titulo">${titulo}</div>
            <div class="momento-fecha">${formatearFecha(grupo.fecha)}</div>
        </div>
        <div class="momento-decoracion">🌻 ❤️ 🌻</div>
        <div class="momento-descripcion">"${escaparHtml(grupo.descripcion)}"</div>
    `;
}

function plantillaCarta(grupo) {
    const titulo = escaparHtml(grupo.titulo);
    const fecha = formatearFecha(grupo.fecha);
    const foto = grupo.fotos[0];

    return `
        <div class="sobre">
            <div class="sobre-cuerpo">
                <div class="sobre-membrete">
                    <div class="sobre-titulo">${titulo}</div>
                    <div class="sobre-fecha">${fecha}</div>
                </div>
            </div>
            <div class="sobre-solapa"></div>
            <div class="sobre-lacre">❤</div>
            <div class="sobre-pista">Toca el lacre</div>
        </div>
        <div class="carta-hoja">
            <div class="carta-hoja-interior">
                ${foto ? `<img src="${escaparHtml(foto.foto_url)}" alt="${titulo}" class="carta-foto">` : ''}
                ${grupo.descripcion ? `<p class="carta-texto">${escaparHtml(grupo.descripcion)}</p>` : ''}
                <div class="carta-firma">${fecha}</div>
            </div>
        </div>
    `;
}

function escaparHtml(texto) {
    const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(texto ?? '').replace(/[&<>"']/g, caracter => escapes[caracter]);
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
    const card = momentosCarousel.querySelector(`[data-index="${index}"]`);
    if (!card) return;

    const track = card.querySelector('.mini-carousel-track');
    if (track) {
        track.classList.remove('dragging');
        track.style.transform = `translate3d(-${fotoActual * 100}%, 0, 0)`;
    }

    const counter = card.querySelector('.mini-carousel-counter');
    if (counter) counter.textContent = `${fotoActual + 1}/${grupo.fotos.length}`;
}

function updateCarouselIndicator() {
    const total = momentosAgrupados.length;
    momentCounter.textContent = total === 1 ? '1 recuerdo' : `${total} recuerdos`;
}

// ==================== UPLOAD ====================
function toggleUploadForm() {
    uploadFormContainer.classList.toggle('hidden');
    if (!uploadFormContainer.classList.contains('hidden')) {
        document.getElementById('foto').value = '';
        document.getElementById('titulo').value = '';
        document.getElementById('fecha-recuerdo').value = '';
        document.getElementById('descripcion').value = '';
        cambiarTipo('foto');
    }
}

function cambiarTipo(tipo) {
    tipoActual = tipo === 'carta' ? 'carta' : 'foto';
    const esCarta = tipoActual === 'carta';

    document.querySelectorAll('.tipo-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tipo === tipoActual);
    });

    const inputFoto = document.getElementById('foto');
    inputFoto.required = !esCarta;
    inputFoto.multiple = !esCarta;

    document.getElementById('upload-title').textContent = esCarta ? 'Escribir una Carta' : 'Agregar un Nuevo Momento';
    document.getElementById('foto-label').textContent = esCarta ? 'Foto de la carta (opcional)' : 'Fotos';
    document.getElementById('fecha-label').textContent = esCarta ? 'Fecha de la carta' : 'Fecha del Recuerdo';
    document.getElementById('descripcion-label').textContent = esCarta ? 'La carta' : 'Recuerdo o Frase';

    const texto = document.getElementById('descripcion');
    texto.rows = esCarta ? 9 : 4;
    texto.placeholder = esCarta
        ? 'Querida...'
        : 'Cuéntale a nuestro futuro yo qué sentiste en este momento...';

    uploadForm.querySelector('button[type="submit"]').textContent = esCarta ? 'Guardar Carta' : 'Guardar Momento';
    clearMessages();
}

function subirFoto(event) {
    event.preventDefault();
    clearMessages();

    const fotos = Array.from(document.getElementById('foto').files);
    const titulo = document.getElementById('titulo').value;
    const fechaRecuerdo = document.getElementById('fecha-recuerdo').value;
    const descripcion = document.getElementById('descripcion').value;
    const submitBtn = uploadForm.querySelector('button[type="submit"]');

    const esCarta = tipoActual === 'carta';

    if (!titulo) {
        showError(uploadError, 'Ingresa un título');
        return;
    }

    if (!fechaRecuerdo) {
        showError(uploadError, esCarta ? 'Selecciona la fecha de la carta' : 'Selecciona la fecha del recuerdo');
        return;
    }

    if (!esCarta && fotos.length === 0) {
        showError(uploadError, 'Selecciona al menos una foto');
        return;
    }

    if (esCarta && fotos.length === 0 && !descripcion.trim()) {
        showError(uploadError, 'Escribe la carta o adjunta una foto de ella');
        return;
    }

    // La carta es un único envío aunque no lleve foto; las fotos van de una en una
    const envios = esCarta ? [fotos[0] || null] : fotos;

    submitBtn.disabled = true;
    submitBtn.textContent = esCarta ? 'Guardando carta...' : `Guardando (0/${envios.length})...`;

    const uploadPromises = envios.map((foto, index) => {
        const formData = new FormData();
        if (foto) formData.append('foto', foto);
        formData.append('tipo', esCarta ? 'carta' : 'foto');
        formData.append('usuario_id', currentUser);
        formData.append('usuario_nombre', 'Nosotros');
        formData.append('titulo', titulo);
        formData.append('fecha_recuerdo', fechaRecuerdo);
        formData.append('descripcion', descripcion);

        return fetch('/api/subir', {
            method: 'POST',
            body: formData
        })
        .then(async res => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `No se pudo guardar (HTTP ${res.status})`);
            if (!esCarta) submitBtn.textContent = `Guardando (${index + 1}/${envios.length})...`;
            if (!data.success) throw new Error(data.error || 'Error al subir');
            return data;
        });
    });

    Promise.all(uploadPromises)
    .then(results => {
        showSuccess(uploadSuccess, esCarta ? 'Carta guardada 💌' : `${results.length} foto(s) guardada(s) con éxito`);
        uploadForm.reset();
        setTimeout(() => {
            toggleUploadForm();
            cargarMomentos();
            submitBtn.disabled = false;
        }, 1000);
    })
    .catch(err => {
        console.error('Upload error:', err);
        showError(uploadError, err.message || 'Error al guardar');
        submitBtn.disabled = false;
        submitBtn.textContent = esCarta ? 'Guardar Carta' : 'Guardar Momento';
    });
}

// ==================== TOUCH/SWIPE ====================
function handleMiniCarrouselTouchStart(event) {
    arrastre = null;

    const contenedor = event.target.closest('.momento-foto-container');
    if (!contenedor) return;

    const track = contenedor.querySelector('.mini-carousel-track');
    const card = contenedor.closest('.momento-card');
    if (!track || !card) return;

    const cardIndex = Number(card.dataset.index);
    const grupo = momentosAgrupados[cardIndex];
    if (!grupo || grupo.fotos.length < 2) return;

    const touch = event.changedTouches[0];
    arrastre = {
        track,
        cardIndex,
        total: grupo.fotos.length,
        indice: miniCarrouselIndex[cardIndex] || 0,
        startX: touch.screenX,
        startY: touch.screenY,
        ancho: track.offsetWidth || 1,
        horizontal: false,
        delta: 0
    };
}

function handleMiniCarrouselTouchMove(event) {
    if (!arrastre) return;

    const touch = event.changedTouches[0];
    const dx = touch.screenX - arrastre.startX;
    const dy = touch.screenY - arrastre.startY;

    // Hasta que el gesto se declare horizontal no le quitamos el scroll a la página
    if (!arrastre.horizontal) {
        if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
        arrastre.horizontal = true;
        arrastre.track.classList.add('dragging');
    }

    event.preventDefault();

    // En el primer y último fotograma la foto cede menos, así se siente el tope
    const enElTope = (arrastre.indice === 0 && dx > 0) ||
                     (arrastre.indice === arrastre.total - 1 && dx < 0);
    arrastre.delta = enElTope ? dx * 0.32 : dx;

    const base = -arrastre.indice * arrastre.ancho;
    arrastre.track.style.transform = `translate3d(${base + arrastre.delta}px, 0, 0)`;
}

function handleMiniCarrouselTouchEnd() {
    if (!arrastre) return;

    const gesto = arrastre;
    arrastre = null;
    gesto.track.classList.remove('dragging');

    if (!gesto.horizontal) return;

    const umbral = gesto.ancho * 0.18;
    const avanza = gesto.delta < -umbral;
    const retrocede = gesto.delta > umbral;

    if (avanza && gesto.indice < gesto.total - 1) {
        nextMiniCarrusel(gesto.cardIndex);
    } else if (retrocede && gesto.indice > 0) {
        prevMiniCarrusel(gesto.cardIndex);
    } else {
        updateMiniCarrusel(gesto.cardIndex);
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
