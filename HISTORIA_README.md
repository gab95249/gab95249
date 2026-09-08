# Nuestra Historia - Sistema Compartido

Aplicación web para que tú y tu pareja compartan fotos y descripciones de momentos especiales.

## Características

✨ **Autenticación simple** — Dos usuarios con credenciales básicas
📸 **Subida de fotos** — Cada uno sube sus fotos con descripción
📖 **Galería compartida** — Ver toda la historia o solo tu aporte
🗑️ **Gestión** — Elimina solo tus propias fotos
🎨 **Diseño responsivo** — Funciona en desktop, tablet y móvil

## Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar servidor
```bash
npm start
```

El servidor estará en `http://localhost:3000`

## Credenciales (por defecto)

- **Usuario**: `yo` | **Contraseña**: `1234`
- **Usuario**: `mi_novia` | **Contraseña**: `5678`

> ⚠️ Cambia estas credenciales en `server.js` para producción

## Uso

1. Abre la app en el navegador
2. Selecciona quién eres
3. Ingresa tu contraseña
4. Sube fotos con descripción
5. Visualiza la historia compartida

## API Endpoints

### POST `/api/login`
Autenticación de usuario
```json
{
  "usuario": "yo",
  "contrasena": "1234"
}
```

### POST `/api/subir`
Subir foto (multipart/form-data)
- `foto`: archivo de imagen
- `usuario_id`: ID del usuario
- `usuario_nombre`: nombre del usuario
- `descripcion`: (opcional) descripción del momento

### GET `/api/historia`
Obtener toda la historia (todas las fotos de ambos usuarios)

### GET `/api/mi-historia/:usuario_id`
Obtener solo las fotos de un usuario

### DELETE `/api/eliminar/:id`
Eliminar una foto
```json
{
  "usuario_id": 1
}
```

## Estructura de archivos

```
.
├── server.js              # Backend Express
├── package.json           # Dependencias
├── historia.db            # Base de datos SQLite (se crea automáticamente)
├── uploads/               # Carpeta de fotos subidas
└── public/
    ├── index.html         # Frontend
    ├── styles.css         # Estilos
    └── script.js          # Lógica cliente
```

## Personalización

### Cambiar credenciales
Edita `server.js`, línea ~55:
```javascript
const usuarios = [
    { nombre: 'yo', contrasena: '1234', color: '#667eea' },
    { nombre: 'mi_novia', contrasena: '5678', color: '#f06292' }
];
```

### Cambiar colores
- Edita los valores `color` en `server.js`
- O modifica `styles.css`

### Aumentar límite de fotos
Edita `server.js`, línea ~33:
```javascript
limits: { fileSize: 50 * 1024 * 1024 }, // 50MB en lugar de 10MB
```

## Seguridad

- ✅ Validación de tipos de imagen
- ✅ Cada usuario solo puede eliminar sus propias fotos
- ✅ Las fotos se guardan en el servidor

⚠️ **Para producción:**
- Implementa autenticación real (JWT, OAuth)
- Usa HTTPS
- Protege las credenciales en variables de entorno
- Implementa límites de rate para uploads

## Deploy

### Heroku
```bash
heroku login
heroku create nombre-app
git push heroku main
```

### Railway
```bash
railway link
railway up
```

### Render
Conecta el repositorio GitHub en render.com

## Troubleshooting

**"Error: Cannot find module 'express'"**
```bash
npm install
```

**Puerto 3000 ya está en uso**
```bash
PORT=3001 npm start
```

**No se guardan las fotos**
- Verifica permisos de carpeta `uploads/`
- Comprueba espacio en disco
- Revisa la consola para errores

## Próximas mejoras

- [ ] Autenticación con Google/Facebook
- [ ] Editor de fotos integrado
- [ ] Timeline interactivo
- [ ] Búsqueda y filtrado
- [ ] Compartir momentos con otros
- [ ] Notificaciones en tiempo real
- [ ] Backup automático

---

Hecho para compartir momentos especiales ❤️
