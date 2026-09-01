# Sorpresa Digital con QR - Diana

Una Single Page Application interactiva y emotiva diseñada para compartir un momento especial a través de un código QR.

## Características

✨ **4 Pantallas Interactivas:**
1. **Bienvenida** - Saludo personalizado con botón de corazón animado
2. **Mensaje/Poema** - Texto emotivo que se revela gradualmente
3. **Galería de Fotos** - Carrusel estilo Polaroid con zoom interactivo
4. **Cierre** - Mensaje final y opción para guardar el momento

🎨 **Animaciones:**
- Corazones flotantes al iniciar
- Transiciones suaves entre pantallas
- Efecto de latido en el botón principal
- Zoom al seleccionar fotos
- Barra de carga progresiva

📱 **Responsivo:**
- Funciona en desktop, tablet y móvil
- Soporte para swipe en dispositivos táctiles
- Controles intuitivos de navegación

## Estructura

```
.
├── index.html       # Estructura HTML
├── styles.css       # Estilos y animaciones
├── script.js        # Lógica de interactividad
└── README.md        # Este archivo
```

## Personalización

### 1. Cambiar el Nombre
Editar `index.html`, línea 20:
```html
<h1 class="name">Diana</h1>
```

### 2. Cambiar el Mensaje/Poema
Editar `script.js`, dentro de `messages.poem`:
```javascript
const messages = {
    poem: `Tu texto aquí...`,
    // ...
};
```

### 3. Agregar Fotos
Reemplazar URLs en `script.js` en el array `photos`:
```javascript
const photos = [
    {
        url: "ruta/a/tu/foto.jpg",
        date: "Fecha o descripción"
    },
    // ...
];
```

Puedes usar:
- **Rutas locales**: `"photos/foto1.jpg"`
- **URLs externas**: `"https://ejemplo.com/foto.jpg"`
- **Data URIs**: Para imágenes base64 (útil para QR)

### 4. Cambiar el Mensaje de Cierre
Editar `script.js` en `messages.closing`:
```javascript
closing: {
    title: "Tu título aquí",
    text: "Tu mensaje aquí"
}
```

### 5. Colores y Gradientes
Editar `styles.css`:
- Colores principales: búscar `#667eea` y `#764ba2`
- Gradientes: búscar `linear-gradient`
- Colores de fondo: búscar `background:`

## Cómo Usar

1. **Abrir en navegador**
   ```bash
   # Abre el archivo index.html en tu navegador
   open index.html
   # O arrastrarlo a la barra de direcciones
   ```

2. **Generar QR**
   - Usa un generador de QR online (ej: qr-server.com)
   - Apunta a la URL donde está alojada esta aplicación
   - Ejemplo: `https://tudominio.com/sorpresa-diana/`

3. **Interactuar**
   - Toca/hace clic en el corazón para comenzar
   - Navega con botones o swipe (en móvil)
   - Abre las fotos con un clic
   - Guarda el momento al final

## Hosting

### Opciones Gratuitas:
- **GitHub Pages**: Sube a un repositorio y activa Pages
- **Netlify**: Drag & drop de carpeta
- **Vercel**: Conecta tu repositorio Git
- **Surge**: `npm install -g surge && surge`

### Con tu Dominio:
- Cualquier proveedor de hosting estándar
- Solo necesita servir archivos estáticos (HTML, CSS, JS)

## Navegadores Soportados

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers modernos

## Tips

💡 **Para mejores resultados:**
- Usa fotos de alta calidad (500x500px mínimo)
- Prueba en móvil antes de enviar el QR
- Personaliza los colores para que combinen con el tema
- Agrega más fotos editando el array `photos`
- El poema debe tener entre 100-300 caracteres para el mejor layout

🎁 **Para hacerlo aún más especial:**
- Crea un GIF con corazones y compartilo
- Cambia el título de la pestaña del navegador
- Agrega sonido de fondo (requiere editar script.js)
- Personaliza el nombre en cada pantalla

## Licencia

Libre para uso personal.

---

Hecho con ❤️ para Diana
