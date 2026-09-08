// Estado global
let currentUser = null;
let currentUserColor = null;

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const uploadForm = document.getElementById('upload-form');
const fotoInput = document.getElementById('foto');
const previewContainer = document.getElementById('preview-container');
const loginError = document.getElementById('login-error');
const uploadError = document.getElementById('upload-error');
const uploadSuccess = document.getElementById('upload-success');
const userBadge = document.getElementById('user-badge');
const historiaContainer = document.getElementById('historia-container');
const miHistoriaContainer = document.getElementById('mi-historia-container');
const emptyState = document.getElementById('empty-state');
const photoModal = document.getElementById('photo-modal');

// Listeners
fotoInput.addEventListener('change', handleFotoPreview);
loginForm.addEventListener('submit', login);
uploadForm.addEventListener('submit', subirFoto);

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
            currentUser = {
                id: data.usuario_id,
                nombre: data.usuario_nombre,
                color: data.color
            };
            currentUserColor = data.color;
            localStorage.setItem('user', JSON.stringify(currentUser));
            mostrarMainScreen();
        } else {
            showError(loginError, data.error);
        }
    })
    .catch(err => showError(loginError, 'Error de conexión'));
}

function logout() {
    currentUser = null;
    currentUserColor = null;
    localStorage.removeItem('user');
    loginForm.reset();
    document.querySelectorAll('.user-btn').forEach(b => b.classList.remove('selected'));
    loginScreen.classList.add('active');
    mainScreen.classList.remove('active');
    clearMessages();
}

function mostrarMainScreen() {
    loginScreen.classList.remove('active');
    mainScreen.classList.add('active');
    userBadge.textContent = `👤 ${currentUser.nombre}`;
    userBadge.style.background = currentUser.color;
    cargarHistoria();
}

function handleFotoPreview(e) {
    previewContainer.innerHTML = '';
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

function subirFoto(event) {
    event.preventDefault();
    clearMessages();

    const file = fotoInput.files[0];
    if (!file) {
        showError(uploadError, 'Selecciona una foto');
        return;
    }

    const formData = new FormData();
    formData.append('foto', file);
    formData.append('usuario_id', currentUser.id);
    formData.append('usuario_nombre', currentUser.nombre);
    formData.append('descripcion', document.getElementById('descripcion').value);

    const btn = document.getElementById('submit-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Subiendo...';

    fetch('/api/subir', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            uploadForm.reset();
            previewContainer.innerHTML = '';
            showSuccess(uploadSuccess, '✓ Foto subida exitosamente');
            setTimeout(() => {
                uploadSuccess.classList.remove('show');
                cargarHistoria();
            }, 2000);
        } else {
            showError(uploadError, data.error);
        }
    })
    .catch(err => showError(uploadError, 'Error subiendo la foto'))
    .finally(() => {
        btn.disabled = false;
        btn.textContent = originalText;
    });
}

function cargarHistoria() {
    Promise.all([
        fetch('/api/historia').then(r => r.json()),
        fetch(`/api/mi-historia/${currentUser.id}`).then(r => r.json())
    ])
    .then(([todoData, miaData]) => {
        mostrarHistoria(todoData.historias || [], historiaContainer);
        mostrarHistoria(miaData.historias || [], miHistoriaContainer);

        if ((todoData.historias || []).length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    })
    .catch(err => console.error('Error cargando historia:', err));
}

function mostrarHistoria(historias, container) {
    container.innerHTML = '';

    if (historias.length === 0) {
        return;
    }

    historias.forEach(item => {
        const div = document.createElement('div');
        div.className = 'historia-item';
        const fecha = new Date(item.fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let usuarioColor = '#667eea';
        if (item.usuario_nombre === 'mi_novia') usuarioColor = '#f06292';

        div.innerHTML = `
            <img src="${item.foto_url}" alt="${item.usuario_nombre}" onclick="abrirModal('${item.foto_url}', '${item.usuario_nombre}', '${fecha}', '${item.descripcion}')">
            <div class="historia-item-info">
                <span class="historia-item-usuario" style="background-color: ${usuarioColor}">
                    ${item.usuario_nombre === 'yo' ? '👨 Yo' : '👩 Mi Novia'}
                </span>
                <div class="historia-item-fecha">${fecha}</div>
                ${item.descripcion ? `<div class="historia-item-descripcion">"${item.descripcion}"</div>` : ''}
                ${item.usuario_nombre === currentUser.nombre ? `
                    <div class="historia-item-actions">
                        <button class="btn-delete" onclick="eliminarFoto(${item.id})">🗑️ Eliminar</button>
                    </div>
                ` : ''}
            </div>
        `;

        container.appendChild(div);
    });
}

function abrirModal(foto, usuario, fecha, descripcion) {
    document.getElementById('modal-img').src = foto;
    document.getElementById('modal-usuario').textContent = usuario === 'yo' ? '👨 Yo' : '👩 Mi Novia';
    document.getElementById('modal-fecha').textContent = fecha;
    document.getElementById('modal-descripcion').textContent = descripcion || '(Sin descripción)';
    photoModal.classList.add('active');
}

function closeModal() {
    photoModal.classList.remove('active');
}

function eliminarFoto(id) {
    if (!confirm('¿Eliminar esta foto?')) return;

    fetch(`/api/eliminar/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: currentUser.id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            cargarHistoria();
        } else {
            alert('Error eliminando la foto');
        }
    })
    .catch(err => alert('Error de conexión'));
}

function showTab(tab, event) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');
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

// Cerrar modal al hacer click fuera
photoModal.addEventListener('click', (e) => {
    if (e.target === photoModal) closeModal();
});

// Recuperar usuario si estaba logueado
window.addEventListener('load', () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        currentUserColor = currentUser.color;
        mostrarMainScreen();
    }
});
