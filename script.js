const messages = {
    poem: `En cada momento contigo encuentro razones para sonreír.
Tus ojos me guían, tu risa me reconforta,
y saber que estás aquí hace que cada día sea especial.

Eres la sorpresa que cambió mi vida,
el recuerdo que quiero repetir siempre,
y el amor que no necesita palabras para ser verdadero.

Te amo, Diana. ❤️`,
    closing: {
        title: "Gracias por compartir tu vida conmigo",
        text: "Cada momento a tu lado es un regalo que atesoro"
    }
};

const photos = [
    {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23667eea' width='400' height='400'/%3E%3Ctext x='50%' y='50%' font-size='48' fill='white' text-anchor='middle' dy='.3em'%3E📸%3C/text%3E%3Ctext x='50%' y='70%' font-size='20' fill='white' text-anchor='middle'%3EFoto 1%3C/text%3E%3C/svg%3E",
        date: "Junio 2024"
    },
    {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23764ba2' width='400' height='400'/%3E%3Ctext x='50%' y='50%' font-size='48' fill='white' text-anchor='middle' dy='.3em'%3E🎉%3C/text%3E%3Ctext x='50%' y='70%' font-size='20' fill='white' text-anchor='middle'%3EFoto 2%3C/text%3E%3C/svg%3E",
        date: "Agosto 2024"
    },
    {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%2364b5f6' width='400' height='400'/%3E%3Ctext x='50%' y='50%' font-size='48' fill='white' text-anchor='middle' dy='.3em'%3E🌅%3C/text%3E%3Ctext x='50%' y='70%' font-size='20' fill='white' text-anchor='middle'%3EFoto 3%3C/text%3E%3C/svg%3E",
        date: "Septiembre 2024"
    },
    {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f06292' width='400' height='400'/%3E%3Ctext x='50%' y='50%' font-size='48' fill='white' text-anchor='middle' dy='.3em'%3E💕%3C/text%3E%3Ctext x='50%' y='70%' font-size='20' fill='white' text-anchor='middle'%3EFoto 4%3C/text%3E%3C/svg%3E",
        date: "Octubre 2024"
    }
];

let currentScreen = 0;
const screens = ['screen-welcome', 'screen-message', 'screen-gallery', 'screen-closing'];
let isAnimating = false;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Mensaje en pantalla de mensaje
    document.getElementById('message-text').textContent = messages.poem;

    // Galería de fotos
    const galleryGrid = document.getElementById('gallery-grid');
    photos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.url}" alt="Foto ${index + 1}">
            <div class="photo-date">${photo.date}</div>
        `;
        photoItem.addEventListener('click', () => openPhotoModal(index));
        galleryGrid.appendChild(photoItem);
    });

    // Cierre
    document.getElementById('closing-title').textContent = messages.closing.title;
    document.getElementById('closing-text').textContent = messages.closing.text;

    // Evento del botón de corazón
    const heartButton = document.getElementById('heart-button');
    heartButton.addEventListener('click', (e) => {
        createFloatingHearts(e);
        startLoadingAnimation();
        setTimeout(() => nextScreen(), 2000);
    });

    // Evento de enter en bienvenida para iniciar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && currentScreen === 0) {
            heartButton.click();
        }
    });
}

function startLoadingAnimation() {
    const loadingBar = document.getElementById('loading-bar');
    loadingBar.style.width = '0%';
    loadingBar.offsetHeight; // Forzar reflow
    loadingBar.style.transition = 'width 2s ease';
    loadingBar.style.width = '100%';
}

function changeScreen(screenIndex) {
    if (isAnimating || screenIndex < 0 || screenIndex >= screens.length) return;
    if (screenIndex === currentScreen) return;

    isAnimating = true;

    // Ocultar pantalla actual
    const currentScreenEl = document.getElementById(screens[currentScreen]);
    currentScreenEl.classList.remove('active');

    // Mostrar nueva pantalla
    currentScreen = screenIndex;
    const newScreenEl = document.getElementById(screens[currentScreen]);
    newScreenEl.classList.add('active');

    isAnimating = false;
}

function nextScreen() {
    changeScreen(currentScreen + 1);
}

function previousScreen() {
    changeScreen(currentScreen - 1);
}

function createFloatingHearts(event) {
    const container = document.getElementById('floating-hearts');
    const rect = event.target.getBoundingClientRect();

    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.textContent = '❤️';
            heart.style.left = rect.left + rect.width / 2 + 'px';
            heart.style.top = rect.top + rect.height / 2 + 'px';

            // Variar el ángulo de salida
            const angle = (Math.random() * 60 - 30) * (Math.PI / 180);
            const velocity = Math.random() * 50 + 50;

            container.appendChild(heart);

            setTimeout(() => heart.remove(), 3000);
        }, i * 100);
    }
}

function openPhotoModal(index) {
    const photoItems = document.querySelectorAll('.photo-item');
    const photoItem = photoItems[index];

    // Crear backdrop
    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);
    }

    // Abrir modal
    photoItem.classList.add('modal-open');
    backdrop.classList.add('active');

    // Cerrar modal al hacer click en el backdrop
    const closeModal = () => {
        photoItem.classList.remove('modal-open');
        backdrop.classList.remove('active');
        backdrop.removeEventListener('click', closeModal);
    };

    backdrop.addEventListener('click', closeModal);

    // Cerrar al presionar ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function saveMemory() {
    const timestamp = new Date().toLocaleString('es-ES');
    const data = {
        person: 'Diana',
        savedAt: timestamp,
        message: messages.poem
    };

    // Crear blob y descargar
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorpresa-diana-${new Date().getTime()}.json`;
    link.click();

    // Feedback visual
    const btn = document.querySelector('.save-btn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Guardado';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// Soporte para swipe en móvil
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    if (touchStartX - touchEndX > 50) {
        nextScreen();
    } else if (touchEndX - touchStartX > 50) {
        previousScreen();
    }
}
